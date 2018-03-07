---
title: "Running React Router v4, Redux Saga, SSR and Code Splitting together"
slug: "running-react-router-v4,-redux-saga,-ssr-and-code-splitting-together"
marmelab: "https://marmelab.com/blog/2017/10/17/code-splitting.html"
date: "2017-10-17"
description: "Code splitting and server-side rendering are two ways of making a React app fast. Let's put them together in practice, with Redux, Sagas and React Router V4."
image: /images/blog/code-splitting/splitting.jpg
image1024x395: /images/blog/code-splitting/splitting.jpg
tags:
- react
- tutorial
---

We are currently migrating a customer project from a Symfony application to a React application with server-side rendering. Out stack includes React Router V3, Redux, and Redux-Saga. But as features add up, the code becomes harder and harder to maintain, and the routing more and more complex. 

During the summer, the Product Owner agreed to prioritize two technical tasks: "Migrate to React Router 4" and "Improve Performance With Code Splitting". We already migrated a React application to React Router V4 in the past (see [React Router v4 Unofficial Migration Guide](https://codeburst.io/react-router-v4-unofficial-migration-guide-5a370b8905a). However, we wanted to validate the viability of the new stack, including React Router v4 (RRV4), Redux Saga, Code splitting, and compatible with server side rendering (SSR). 

This post details the implementation of a Proof-of-Concept (POC) validating this architecture.

## Project Bootstrap

We started a new application with the same routing constraints as those encountered in the customer application. You will find [on Github](https://github.com/alexisjanvier/universal-react/releases/tag/step-1) the code of this clean and fresh application, not yet including Redux and or asynchronous calls to recover data.

It is built with the following dependencies:

```json
// in package.json
"dependencies": {
  "date-fns": "^1.28.5",
  "lodash.debounce": "^4.0.8",
  "material-ui": "^1.0.0-alpha.21",
  "material-ui-icons": "^1.0.0-alpha.19",
  "prop-types": "^15.5.10",
  "query-string": "^4.3.4",
  "react": "^15.6.1",
  "react-dom": "^15.6.1",
  "react-router-dom": "^4.1.1",
  "typeface-roboto": "0.0.31"
},
```

And a simple React Router V4 routing:

```js
// in src/shared/app/index.js
<Switch>
  <Route exact path="/" component={HomePage} />
  <Route path="/playlists/:playlistId(pl-[a-z]{0,4})" component={PlaylistPage} />
  <Route path="/playlists" component={PlayListsPage} />
  <Route path="/search-album" component={SearchAlbumPage} />
  <Route path="/albums/:albumSlug" component={AlbumPage} />
</Switch>
```

### Visualizing The Benefits

The target is to optimize the production code, by generating smaller JavaScript files. We will therefore have to find tools enabling to show us this optimization. And [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) seems to be an excellent candidate for that.

For the moment Webpack is generating only one file for the whole application:

```js
// in webpack.config.js
  entry: {
    client: `${srcPath}/client/index.js`,
  },

  output: {
    path: distPath,
    filename: '[name].js',
    publicPath: '/assets/',
  },
```

To visualize the composition of this single file with the `webpack-bundle-analyzer`, we just have to add it to the webpack configuration,

```js
// in webpack.config.js
if (process.env.NODE_ENV  ===  'analyse') {
  plugins.push(new BundleAnalyzerPlugin());
}
```

And launch Webpack into the right environment:

```bash
    NODE_ENV=analyse ./node_modules/.bin/webpack --config webpack.config.js -p
```

The result is a fat file (274Kb gzipped) in which we find the names of all the node modules, and our own code (the small vertical bar to the right!).

![startingApplicationBundle.png](/images/blog/code-splitting/startingApplicationBundle.png)

So we will have to split this fat file into several smaller ones, fetched only when needed. That's a neat way to visualize code splitting.

## First Split

We first split the bundle into 2 separate chunks: dependencies on one side (`vendors.js`), and the business code on the other side (`clients.js`). Here is the Webpack configuration:

```js
// in webpack.config.js
entry: {
  client: `${srcPath}/client/index.js`,
  vendor: ['react', 'react-dom', 'react-router-dom'],
},
output: {
  path: distPath,
  filename: '[name].js',
  publicPath: '/assets/',
},
```

Let's analyze these 2 chunks generated by Webpack:

![Capture d'écran de 2017-09-14 18-28-48.png](/images/blog/code-splitting/console1.png)

![vendorChunkStep1.png](/images/blog/code-splitting/vendorChunkStep1.png)

It makes sense: Webpack has created a `vendors. js` file as we asked it, but it also created the `client. js` file including all `import` present in our code. As result, we almost doubled the weight of Javascript :(

To fix that, we'll use the [CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/) which deduplicates the modules specified in the `vendor` entry by not including them in `client.js` file anymore.

This is the final Webpack configuration:

```js
// in webpack.config.js
const { BundleAnalyzerPlugin } =  require('webpack-bundle-analyzer');
const  path  =  require('path');
const  webpack  =  require('webpack');
const  srcPath  =  path.resolve(__dirname, 'src');
const  distPath  =  path.resolve(__dirname, 'dist');

const  plugins  = [
  new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    minChunks: Infinity,
  }),
];

if (process.env.NODE_ENV  ===  'analyse') {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
  context: srcPath,
  target: 'web',

  entry: {
    client: `${srcPath}/client/index.js`,
    vendor: ['react', 'react-dom', 'react-router-dom'],
  },

  output: {
    path: distPath,
    filename: '[name].js',
    publicPath: '/assets/',
  },

  resolve: {
    modules: ['node_modules', 'src'],
    extensions: ['*', '.js', '.json'],
  },

  module: {
    rules: [
      {
        test:  /\.js$/,
        exclude:  /(node_modules)/,
        loader: 'babel-loader',
        query: { compact: false },
      },
    ],
  },

  plugins,
  devtool: 'source-map',
};
```

And the final result:

![vendorChunkStep2.png](/images/blog/code-splitting/vendorChunkStep2.png)

![vendorChunkStep3.png](/images/blog/code-splitting/vendorChunkStep3.png)

Much better! `CommonsChunkPlugin` is able to do much more things to optimize our code. I suggest you read the post ["webpack bits: Getting the most out of the CommonsChunkPlugin"](https://medium.com/webpack/webpack-bits-getting-the-most-out-of-the-commonschunkplugin-ab389e5f318) if you want to go deeper into the subject.

(*The code of this step is available on the tag [step-2](https://github.com/alexisjanvier/universal-react/releases/tag/step-2) in the GitHub repository*)

Now we'll have to split the `client.js` file. But before that, we will implement the Server-Side Rendering.

## Setting Up Server-Side-Rendering

One of the advantages of React is to have the SSR "out of the box". This is done thanks to the `renderToString` method, which makes it possible to render our React application as a ... string, in Node.js.

The behaviour of React Router V4 particularly interests us: To make SSR possible, RRV4 has a specific router, the [`<StaticRouter>`](https://reacttraining.com/web/api/StaticRouter), that we use on the server instead of the [`<BrowserRouter>`](https://reacttraining.com/web/api/BrowserRouter) used on the client side.

The code will be organized into three separate folders.

![Capture d'écran de 2017-09-15 09-10-43.png](/images/blog/code-splitting/folders.png)

### Shared Folder

This is where you will find all the business code of our application, including the routing.

```js
// in src/shared/app/index.js
const App = () => (
  <div>
    <MainMenu />
    <Switch>
      <Route  exact  path="/"  component={HomePage} />
      <Route  path="/playlists/:playlistId(pl-[a-z]{0,4})"  component={PlaylistPage} />
      <Route  path="/playlists"  component={PlayListsPage} />
      <Route  path="/search-album"  component={SearchAlbumPage} />
      <Route  path="/albums/:albumSlug"  component={AlbumPage} />
    </Switch>
  </div>
);
```

### Client Folder

This is where you will find all the browser-specific code. For the moment, it's just calling our application in the router dedicated to browsers.

```js
// in src/client/index.js
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';

import App from '../shared/app';

class Main extends Component {
    render() {
        return (
            <Router>
                <App {...this.props} />
            </Router>
        );
    }
}

```

### Server Folder

It's an `express` server. One of its route renders the application into a string. The `<StaticRouter>` router makes it possible to choose the state of the application to render according to the request. This string is injected into an html template to generate the final server response. The client then uses the client code linked in this response to become a Single-Page React Application again.

```js
// in src/server/index.js
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import App from '../shared/app';
// render is used to inject html in a globale template
import render from './render';

const app = express();
// Serve client.js and vendor.js
app.use('/assets', express.static('./dist'));

app.get('*', (req, res) => {
    const context = {};

    const appWithRouter = (
        <StaticRouter location={req.url} context={context}>
            <App />
        </StaticRouter>
    );

    if (context.url) {
        res.redirect(context.url);
        return;
    }

    const html = ReactDOMServer.renderToString(appWithRouter);

    res.status(200).send(render(html));
});

app.listen(3000, () => console.log('Demo app listening on port 3000'));

```

And it all works out pretty well! The easiest way to test it is to disable JavaScript on the browser.

![testSSR.gif](/images/blog/code-splitting/testSSR.gif)

(*The code of this step is available on the tag [step-3](https://github.com/alexisjanvier/universal-react/releases/tag/step-3)*)

## Code Splitting Step 2

And once again, webpack comes into play. If we refer to the [documentation](https://webpack.js.org/guides/code-splitting/), there are three general approaches to code splitting available:

>
>*   Entry Points: Manually split code using [`entry`](https://webpack.js.org/configuration/entry-context) configuration.
>*   Prevent Duplication: Use the [`CommonsChunkPlugin`](https://webpack.js.org/plugins/commons-chunk-plugin) to dedupe and split chunks.
>*   Dynamic Imports: Split code via inline function calls within modules.
>

Good news, we have already applied the first two approaches. So the dynamic approach remains to be applied. Basically, webpack can isolate the code called dynamically (asynchronously) in a chunk. It can also generate the code to call the right chunk at the right time.

To call code dynamically, we will have to use the syntax [`import()`](https://webpack.js.org/api/module-methods#import-) (that conforms to the [ECMAScript proposal](https://github.com/tc39/proposal-dynamic-import)) or the WebPack-specific syntax [`require.ensure`](https://webpack.js.org/api/module-methods#require-ensure).

Which would give for a React component:

```js
import React from 'react'

class Home extends React.Component {
  state = { Component: null }

  componentWillMount() {
    import('./Home').then(Component => {
      this.setState({ Component })
    })
  }

  render() {
    const { Component } = this.state
    return Component ? <Component {...props} /> : null
  }
}
```

*(This example comes from the blog post [Introducing loadable-components](https://medium.com/smooth-code/introducing-loadable-components-%EF%B8%8F-646dd3ab0aa6))*

Because we don't want to have to transform all our components, we use a [Higher-Order Component](https://facebook.github.io/react/docs/higher-order-components.html): [loadable-components](https://www.npmjs.com/package/loadable-components).

Thus, we no longer call our page components synchronously in routing, but asynchronously by mapping them into this HOC. That's how Webpack can create a chunk by road.

`src/shared/app/index.js` does not change.

```js
// in src/shared/app/index.js
import React from 'react';
import { Route, Switch } from 'react-router-dom';

import * as Routes from './routes';
import MainMenu from './mainMenu';

const App = () => (
    <div>
        <MainMenu />
        <Switch>
            <Route exact path="/" component={Routes.HomePage} />
            <Route path="/playlists/:playlistId(pl-[a-z]{0,4})" component={Routes.PlaylistPage} />
            <Route path="/playlists" component={Routes.PlayListsPage} />
            <Route path="/search-album" component={Routes.SearchAlbumPage} />
            <Route path="/albums/:albumSlug" component={Routes.AlbumPage} />
        </Switch>
    </div>
);
export default App;
```

But everything happens in `src/shared/app/routes.js`:

```js
// src/shared/app/routes.js
import loadable from 'loadable-components';

export const AlbumPage = loadable(() => import('../albums/AlbumPage'));
export const HomePage = loadable(() => import('../home/HomePage'));
export const PlaylistPage = loadable(() => import('../playlists/PlaylistPage'));
export const PlayListsPage = loadable(() => import('../playlists/ListPage'));
export const SearchAlbumPage = loadable(() => import('../albums/SearchPage'));
```

We must make Babel compatible with the `import()` syntax by adding [the dynamic-import-webpack plugin](https://github.com/airbnb/babel-plugin-dynamic-import-webpack)

```json
// in .babelrc
{
    "plugins": ["dynamic-import-webpack"],
    "presets": [
        "react",
        [
            "env",
            {
                "targets": {
                    "browsers": ["last 1 version", "ie >= 11"]
                }
            }
        ]
    ]
}

```

And now it's time to see the final result:

```bash
NODE_ENV=analyse ./node_modules/.bin/webpack --config webpack.client.config.js -p
Hash: 6ab25e3738d87ca6f2d5
Version: webpack 3.3.0
Time: 5715ms
     Asset       Size  Chunks             Chunk Names
      0.js    36.5 kB       0  [emitted]
      1.js    36.9 kB       1  [emitted]
      2.js    11.6 kB       2  [emitted]
      3.js    20.7 kB       3  [emitted]
      4.js  747 bytes       4  [emitted]
 client.js     102 kB       5  [emitted]  client
 vendor.js     191 kB       6  [emitted]  vendor
index.html  409 bytes          [emitted]

```

![vendorChunkWithCodeSpliting.png](/images/blog/code-splitting/vendorChunkWithCodeSpliting.png)

Here we are, our code is now divided into as many chunks as there are pages!

![codeSplitting.gif](/images/blog/code-splitting/codeSplitting.gif)

(*The code of this step is available on the tag [step-4](https://github.com/alexisjanvier/universal-react/releases/tag/step-4)*)

But does it work with SSR?

![CS-SSR-KO.gif](/images/blog/code-splitting/CS-SSR-KO.gif)

Nope, not yet :(

## Making Code Splitting And Server-Side Rendering Work together

The explanation is easy to find: the code of our page components is now called asynchronously. However, the server-side route is synchronous. So Node can render all the code called in a classic synchronous way (as the menu bar), but not the asynchronous content of the pages.

To make it work, we use the `getLoadableState` method provided by `loadable-components`. It allows us to make a pre-rendering of the application (including asynchronous calls), and extract the references of the chunks needed to render the requested page. We also have to make the express route asynchronous (with `async` and `await`).

```js
// in src/server/index.js
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { getLoadableState } from 'loadable-components/server';

import App from '../shared/app';
import render from './render';


const app = express();
app.use('/assets', express.static('./dist'));

app.get('*', async (req, res) => {
    const context = {};

    const appWithRouter = (
        <StaticRouter location={req.url} context={context}>
            <App />
        </StaticRouter>
    );

    if (context.url) {
        res.redirect(context.url);
        return;
    }

    const loadableState = await getLoadableState(appWithRouter);
    const html = ReactDOMServer.renderToString(appWithRouter);

    res.status(200).send(render(html, loadableState));
});

app.listen(3000, () => console.log('Demo app listening on port 3000'));

```

The reference to the chunk used by the application according to the request is injected into the global template by the `getScriptTag()` method of the `loadableState` object generated during pre-rendering:

```js
// in src/server/render.js
export default (html, loadableState) => `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Get real playlists to share with Spotify</title>
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <link rel="icon" type="image/png" href="/assets/favicon.ico" />
        </head>
        <body>
            <div id="root">${html}</div>
            <script src="/assets/vendor.js"></script>
            <script src="/assets/client.js"></script>
            ${loadableState.getScriptTag()}
        </body>
    </html>
`;
```

`loadableState.getScriptTag()` makes it possible to insert the `<script>window.__LOADABLE_COMPONENT_IDS__ = [1];</script>` tag into the server response (here `[1]` is the homepage's chunk identifier). The client code uses this information to load the right chunk, using the `loadComponents` method provided by the `loadable-components'.

```js
// in src/client/index.js
import { loadComponents } from  'loadable-components';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';

import App from '../shared/app';

const Main = (props) => (
    <Router>
        <App {...props} />
    </Router>
);

loadComponents().then(() => {
    render(
        <Main />
        document.getElementById('root'),
    );
});

```

Let's re-test after applying these changes (*available on the tag [step-5](https://github.com/alexisjanvier/universal-react/releases/tag/step-5)*)

![CS-SSR-OK.gif](/images/blog/code-splitting/CS-SSR-OK.gif)

**\o/**

## Redux and Saga implementation

Adding Redux does create any problem, whether with the React Router V4, oor with code splitting. But using Saga is not without difficulty, mainly for server-side rendering.

n the POC app, we use Sagas to make a simple call to the Github API. We fetch a list of the latest public gists (this API call does not require any personal key, making it easier to share the code of this POC). The call is made from the homepage. The difficulty is to wait for the saga to be resolved on the server side before rendering the HTML string. We can do it with:

* a first asynchronous pre-rendering that launches the sagas (this is what we are already doing with `const loadableState = await getLoadableState(appWithRouter)` used to make the code splitting work in SSR),
* dispatching [the `END` event](https://github.com/redux-saga/redux-saga/issues/255), which allows us to break the `while(true)` saga's loop inside watchers.

I am not going deeper on this point, because it has already been done by my dear colleague [Julien](https://twitter.com/juliendemangeon?lang=fr) in his blog post [React Isomorphique en pratique](https://marmelab.com/blog/2016/12/21/react-isomorphique-en-pratique.html).

But here's what the server-side code looks like:

```js
app.get('*', async (req, res) => {
    const store = configureStore();
    const context = {};

    const appWithRouter = (
        <Provider store={store}>
            <StaticRouter location={req.url} context={context}>
                <App />
            </StaticRouter>
        </Provider>
    );

    if (context.url) {
        res.redirect(context.url);
        return;
    }

    let loadableState = {};

    // .done is resolved when store.close() send an END event
    store.runSaga(sagas).done.then(() => {
        const html = ReactDOMServer.renderToString(appWithRouter);
        const preloadedState = store.getState();

        return res.status(200).send(render(html, loadableState, preloadedState));
    });

    // Trigger sagas for component to run
    // https://github.com/yelouafi/redux-saga/issues/255#issuecomment-210275959
    loadableState = await getLoadableState(appWithRouter);

    // Dispatch a close event so sagas stop listening after they're resolved
    store.close();
});

```

The complete code is available on [master branch](https://github.com/alexisjanvier/universal-react).

## Conclusion

The target of the POC is reached: we have a working application using React, React Router V4, Redux, and Saga. The code is split into several chunks, and these chunks are only called when necessary (depending on the routing). The stack works in server side rendering, too. And that' great.

However, some issues are not completely resolved. The important choice of the HOC component allowing to call existing components asynchronously wasn't thought through properly. It is true that `loadable-components` was meeting specifications. But there are many others: [react-universal-component](https://github.com/faceyspacey/react-universal-component), [react-loadable](https://github.com/thejameskyle/react-loadable)... We want to test all of them in production conditions to be serene about this choice.

Second, server side rendering is an obvious strategy for SEO. But about performance, the arrival of [stream rendering](https://www.youtube.com/watch?v=UhdGiVy3_Nk) in the latest React version makes us want to continue experimenting further upstream before starting on a major optimization project.

But when it comes to optimisation, there are countless ways forward: web workers, lazyloading, pure component, preact ... For example, I suggest you to read the excellent article [A React And Preact Progressive Web App Performance Case Study: Treebo](https://medium.com/dev-channel/treebo-a-react-and-preact-progressive-web-app-performance-case-study-5e4f450d5299).