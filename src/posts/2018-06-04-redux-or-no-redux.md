---
title: "Avec ou sans Redux ?"
slug: "avec-ous-sans-redux"
marmelab:
date: "2018-06-04"
description: "Redux est un outil fantastique, mais convient-t-il à toutes les situations ? Sans doute pas."
tags:
- react
- redux
- render prop
- react context
---

Chez Marmelab on aime beaucoup [Redux](https://redux.js.org/). Il faut dire que cela a été une vrai moment d'évolution dans notre manière de penser nos applications (store immutable, sensibilisation à la programmation fonctionnelle, gestion asynchrone des call API avec les sagas, ...). A tel point que l'on a tendance à l'intégrer de facto dans notre stack en démarrage de projet.
Mais est-ce toujours une bonne idée ? Pas certain ...

## Un exemple

Prenons une application très simple de gestion de meetup. L'objectif est :

* de pouvoir visualiser une liste des propositions de talks,
* de pouvoir visualiser une liste les souhaits de talks émis par les membres,
* de pouvoir visualiser une liste la liste des membres du meetup.

Les données sont obtenues via une API REST et l'application tout comme l'API sont protégées par un login/password.

L'application est bootstrappée avec [CRA](https://github.com/facebook/create-react-app) à laquelle on ajoute :

* redux
* redux-saga
* react-router-redux

Voici à quoi ressemble un tel projet :

(*Remarque: pour vous connectez, utilisez `login/password`*)

<iframe src="https://codesandbox.io/embed/m5n2xjl6pj?module=" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

 On a donc un `App.js` qui se charge de monter le store redux `<Provider store={store}>` et les routes `<ConnectedRouter history={history}>` :

 ```js
// in App.js
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

...

 export const App = ({ store, history }) => (
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <Container>
                <Header />
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/talks" component={Talks} />
                    <Route path="/wishes" component={Wishes} />
                    <Route path="/members" component={Members} />
                    <Route path="/login" component={Authentication} />
                    <Route component={NoMatch} />
                </Switch>
            </Container>
        </ConnectedRouter>
    </Provider>
);
 ```

Chaque composant *métier* (les composants rendus par une route, comme `<Route path="/talks" component={Talks} />` est organisé selon la structure bien connue des utilisateurs de redux :

* les actions,
* les reducers,
* les sagas.

Par exemple pour la page des talks :

``` bash
├── talks
│   ├── actions.js
│   ├── reducer.js
│   ├── sagas.js
│   └── Talks.js
 ```

Le composant de page est très simple :

 ```js
 // in talks/Talks.js
export const Talks = ({ isLoading, talks }) => (
    <div>
        <h1>Talks</h1>
        {isLoading && <Spinner />}
        {talks && talks.map(talk => <h2 key={talk.id}>{talk.title}</h2>)}
    </div>
);

const mapStateToProps = ({  talks }) => ({
    isLoading: talks.isLoading),
    talks: talks.data,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Talks);
```

Les données `talks` ne sont pas appelées au `ComponentWillMount` comme on pourrait s'y attendre mais grâce à une saga à l'écoute du routeur :

```js
// in talks/sagas.js
import { put, select, takeLatest } from 'redux-saga/effects';
import { LOCATION_CHANGE } from 'react-router-redux';

import { loadTalks } from './actions';
import { hasData } from './reducer';

export function* handleTalksLoading() {
    if (yield select(hasData)) {
        return;
    }

    yield put(loadTalks());
}

export const sagas = function*() {
    yield takeLatest(
        action =>
            action.type === LOCATION_CHANGE &&
            action.payload.pathname === '/talks',
        handleTalksLoading,
    );
};
```

Donc au changement de route `action.type === LOCATION_CHANGE` si la nouvelle route correspond à la section des talks `action.payload.pathname === '/talks'` et que les données ne sont pas déja présentes `if (yield select(hasData))` on lance une action avec la fonction `loadTalks` :

```js
// in talks/actions.js
import { createAction } from 'redux-actions';

export const LOAD_TALKS = 'LOAD_TALKS';
export const loadTalks = createAction(
    LOAD_TALKS,
    payload => payload,
    () => ({
        request: {
            url: '/talks',
        },
    }),
);
```

Cette action contenant l'url permettant d'obtenir les données sur les talks dans ses `meta` va être interceptée par une `saga` générique de fetch `action => !!action.meta && action.meta.request`:

```js
// in /services/fetch/fetchSagas.js
import { call, put, takeEvery, select } from 'redux-saga/effects';
import { createAction } from 'redux-actions';

import { appFetch as fetch } from './fetch';

export const fetchError = (type, error) =>
    createAction(
        `${type}_ERROR`,
        payload => payload,
        () => ({
            disconnect: error.code === 401,
        }),
    )(error);

export const fetchSuccess = (type, response) =>
    createAction(`${type}_SUCCESS`)(response);

export function* executeFetchSaga({ type, meta: { request } }) {
    const token = yield select(state => state.authentication.token);
    const { error, response } = yield call(fetch, request, token);
    if (error) {
        yield put(fetchError(type, error));
        return;
    }

    yield put(fetchSuccess(type, response));
}

export const sagas = function*() {
    yield takeEvery(
        action => !!action.meta && action.meta.request,
        executeFetchSaga,
    );
};

```

Une fois le fetch réussi `fetchSuccess`, on lance une dernière action indiquant la réussite de la récupération des données `createAction('${type}_SUCCESS')(response)`, action utilisée au niveau du `reducer` des talks :

```js
// in talks/reducers.js
export const reducer = handleActions(
    {
        [LOAD_TALKS]: state => ({
            ...state,
            loading: true,
        }),
        [LOAD_TALKS_SUCCESS]: (state, { payload }) => ({
            ...state,
            loading: false,
            data: payload,
        }),
    },
    defaultState,
);
```

Et tout cela marche très bien. C'est plutôt malin, et pourquoi pas un peu élégant. L'utilisation des `meta` des actions permet de partager des comportements génériques au sein de l'application (le fetch, mais aussi la gestion des erreurs, la deconnexion, ...).

> Vous pouvez trouver le code *complet* sur [GitHub](https://github.com/alexisjanvier/javascript-playground/releases/tag/cra-with-redux)

### Mais ...

**C'est malin, mais c'est surtout très complexe !** Pas facile de s'y retrouver en arrivant sur l'application tant un certain nombre de comportements relèvent de la *magie*. Car si on récapitule, on obtient les données des talks via une saga branchée sur le routeur qui envoi une action de type fetch intercepté par une autre saga générique qui en cas de succès émet une autre action, action interceptée par le reduceur de la page ayant émit la toute première action de la chaine... 
C'est peut-être dû à une utilisation *hors des cloues de redux*, mais c'est aussi le résultat de plusieurs projets réalisés sur cette stack, avec l'expérience d'écritures répetitives d'actions et de reducers. 

Car en dehors de la complexité potentiellement induite par son utilisation, un reproche que l'on peut faire à redux, c'est que cette librairie nécessite beaucoup de *plomberie*. 

Analysons l'application d'exemple avec ses trois pages, sa home et sa page de login :

 ```bash
 ❯ cloc services/cra_webapp/src
      32 text files.
      32 unique files.
       0 files ignored.

github.com/AlDanial/cloc v 1.74  T=0.06 s (581.6 files/s, 17722.1 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                      31            150              1            819
CSS                              1              0              0              5
-------------------------------------------------------------------------------
SUM:                            32            150              1            824
-------------------------------------------------------------------------------
 ```
 
31 fichiers, 819 lignes de code, c'est déja beaucoup. Nous pourrions certainenement simplifier un peu tout cela, au risque de rendre le code moins générique.

Mais posons nous surtout la question de savoir si redux est ici bien nécessaire ?   

<blockquote class="twitter-tweet" data-lang="fr"><p lang="en" dir="ltr">Flux libraries are like glasses: you’ll know when you need them.</p>&mdash; Dan Abramov (@dan_abramov) <a href="https://twitter.com/dan_abramov/status/704304462739939328?ref_src=twsrc%5Etfw">29 février 2016</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


Différentes parties de l'application peuvent-elle modifier les même données, nécessitant de maintenir un état prédictible de nos données ? Non, on doit juste afficher des données provenant de l'API.      
A-t-on des composants enfouis dans le DOM dont l'interaction doit modifier les données ? Non, on a juste besoin des données à l'affichage de la page.

On doit donc sûrement pouvoir se passer de Redux, décrit officiellement comme :

> Redux is a predictable state container for JavaScript apps.

## Obtenir les données sans redux

Ou plutôt sans `redux-saga`, chargé de rendre disponibles les données nécessaires à l'affichage de nos pages au niveau du `store` de Redux. On pourrait sans doute implémenter toute la logique de fetch au niveau de chaque page. Mais ce serait dupliquer une mécanique très répétitive. Il faut donc trouver une manière de générique de réaliser ce fetch sans introduire trop de complexité. Et la pattern de [**render prop**](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce) est particulièrement adaptée à cela !

Nous allons créer un composant `DataProvider` permettant d'encapsuler toute la logique du fetch de donnée :

```javascript
// in DataProvider.js
import React, { Component, Fragment } from 'react';
import { Redirect } from 'react-router';
import { appFetch } from './services/fetch';

export class DataProvider extends Component {
    static propTypes = {
        render: PropTypes.func.isRequired,
        url: PropTypes.string.isRequired,
    };

    state = {
        data: undefined,
        error: undefined,
    };

    fetchData = async props => {
        const token = window.sessionStorage.getItem('token');
        try {
            const data = await appFetch({ url }, token);
            this.setState({
                data: data.response,
                error: null,
            });
        } catch (error) {
            this.setState({
                error,
            });
        }
    };

    componentWillMount() {
        return this.fetchData(this.props);
    }

    render() {
        const { data, error } = this.state;
        const { location } = this.props;

        if (error) {
            return error.code >= 401 && error.code <= 403 ? (
                <Redirect to="/login" />
            ) : (
                <p>Erreur lors du chargement des données</p>
            );
        }


        return (
            <Fragment>
                {data ? (
                    <p>Aucune donnée disponible</p>
                ) : (
                    this.props.render({
                        data,
                    })
                )}
            </Fragment>
        );
    }
}
```

Ce composant va donc réaliser un fetch sur l'url qui lui sera passé en prop au `componentWillMount`. Il va se charger de la gestion des erreurs et de l'absence de donnée. Par contre, si il obtient des données, il *passe le main* à la fonction qui lui est donnée en prop `render` pour assurer son affichage (`this.props.render({ data })`).

Utilisons maintenant ce composant sur notre page de talks :

```javascript
// in talks/Talks.js
import React from 'react';
import PropTypes from 'prop-types';

import { DataProvider } from '../DataProvider';

export const TalksView = ({ talks }) => (
    <div>
        <h1>Talks</h1>
        {talks && talks.map(talk => <h2 key={talk.id}>{talk.title}</h2>)}
    </div>
);

TalksView.propTypes = {
    talks: PropTypes.array,
};

export const Talks = () => (
    <DataProvider
        url="/talks"
        render={({ data }) => <TalksView talks={data} />}
    />
);

```

On a donc deux composants :
 * le composant `TalksView` qui ne se charge que de l'affichage de données passés en props, peu lui importe d'ou vient cette donnée,
 * le composant `Talks`, notre `DataProvider` qui va utiliser notre `TalksView` pour afficher la donnée récuperé depuis l'url passée en props (`render={({ data }) => <TalksView talks={data} />}`).

C'est simple, efficace et lisible !

Nous pouvons maintenant supprimer complêtement redux de notre application (`redux`, `redux-saga`, `redux-router`).
Relançons l'analyse de notre projet après avoir remplacer `redux` par notre `DataProvider` :

```bash
❯ cloc services/cra_webapp/src
      16 text files.
      16 unique files.
       0 files ignored.

github.com/AlDanial/cloc v 1.74  T=0.04 s (418.9 files/s, 13404.6 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                      15             64              1            442
CSS                              1              0              0              5
-------------------------------------------------------------------------------
SUM:                            16             64              1            447
-------------------------------------------------------------------------------
```
 
> Vous pouvez trouver ce code *complet* sur [GitHub](https://github.com/alexisjanvier/javascript-playground/releases/tag/cra-without-redux)

Nous sommes donc passés de 819 lignes de code à 442 lignes, presque moitié moins. Pas mal !

> Il existe une excellente librairie reprenant ce principe de data provider : [react-request: Declarative HTTP requests for React](https://github.com/jamesplease/react-request)

## Se passer du Store de redux

En l'état, on obtient donc les données de chaque page grâce au data provider. Mais notre application requière une authentification nous permettant d'obtenir les informations sur l'utilisateur via un `json-web-token`. Comment va-t-on pouvoir transmettre ce JWT aux différents `dataProvider` sans le store Redux ? Et bien en utilisant le state de notre composant de plus haut niveau, le `App.js` et en le transmettant en tant que `props` aux composants enfants qui en ont besoin (`PrivateRoute.js`, `Header.js`)

```javascript
// in App.js
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { Authentication } from './authentication/Authentication';
import { Header } from './components/Header';
import { PrivateRoute } from './PrivateRoute';
import { Talks } from './talks/Talks';


export class App extends Component {
    state = {
        user: null,
    };

    decodeToken = token => {
        const user = decode(token);
        this.setState({ user });
    };

    componentWillMount() {
        const token = window.sessionStorage.getItem('token');

        if (token) {
            this.decodeToken(token);
        }
    }

    handleNewToken = token => {
        window.sessionStorage.setItem('token', token);
        this.decodeToken(token);
    };

    handleLogout = () => {
        window.sessionStorage.removeItem('token');
        this.setState({ user: null });
    };

    render() {
        const { user } = this.state;
        return (
            <Router>
                <div>
                    <Header user={user} onLogout={this.handleLogout} />
                    <Switch>
                        <PrivateRoute
                            path="/talks"
                            render={() => (
                                <Talks />
                            )}
                            user={user}
                        />
                        <Route
                            path="/login"
                            render={({ location }) => (
                                <Authentication
                                    location={location}
                                    onNewToken={this.handleNewToken}
                                />
                            )}
                        />
                    </Switch>
                </div>
            </Router>
        );
    }
}

```

```javascript
// in PrivateRoute.js
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router';

/**
 * This Route will redirect the user to the login page if needed.
 */
export const PrivateRoute = ({ user, ...rest }) =>
    user ? (
        <Route {...rest} />
    ) : (
        <Redirect
            to={{
                pathname: '/login',
                state: { from: rest.location },
            }}
        />
    );

PrivateRoute.propTypes = {
    user: PropTypes.object,
};
```

```javascript
// in components/Header.js
import React from 'react';
import PropTypes from 'prop-types';

import { Navigation } from './Navigation';

export const Header = ({ user, onLogout }) => (
    <header>
        <h1>JavaScript Playground: meetups</h1>
        {user && <Navigation onLogout={onLogout} />}
    </header>
);

Header.propTypes = {
    user: PropTypes.object,
    onLogout: PropTypes.func.isRequired,
};

```

Disons le tout de suite, stocker le `JWT` dans le `session storage` est une **très mauvaise pratique**, mais permettait ici d'ilustrer simplement le propos.

L'application étant très simple, passer nore `user` en `props` au enfant n'est pas très problématique. Le composant `Header` fait un peu le passe plat, mais ce n'est pas très pénalisant. Qu'en est-il pour une application plus conséquente ? Et bien, cela peut devenir très pénible. C'est d'ailleur un des cas ou il devient légitime de se poser la question de l'utilisation de redux ! 

Mais il existe maintenant une solution plus simple permettant de transmettre des informations depuis un composant vers un autre composant plus profond du DOM : `React Context`.

### React Context

[Context - React](https://reactjs.org/docs/context.html)
La méthode `React.createContext` va nous permettre de générer un :
* `Provider` depuis lequel on va gérer la donnée
* `Consumer` qui sera capable de lire la donnée

On peut noter au passage que le `Consumer` utilise la pattern de `render prop`.

```javascript
// in App.js
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import { decode } from 'jsonwebtoken';

...

export const UserContext = React.createContext({
    user: null,
    onLogout: () => true,
});

export class App extends Component {
    ...

    render() {
        const { user } = this.state;
        return (
            <UserContext.Provider
                value={{
                    user,
                    onLogout: this.handleLogout,
                }}
            >
                <Router>
                    <Container>
                        <Header />
                        <Switch>
                            <PrivateRoute
                                exact
                                path="/"
                                render={({ location }) => (
                                    <Home location={location} />
                                )}
                            />
                        ...
```

```javascript
// in PrivateRoute.js
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router';

import { UserContext } from './App';

const PrivateRouteWithoutContext = ({ user, ...rest }) =>
    user ? (
        <Route {...rest} />
    ) : (
        <Redirect
            to={{
                pathname: '/login',
                state: { from: rest.location },
            }}
        />
    );

PrivateRouteWithoutContext.propTypes = {
    user: PropTypes.object,
};

export const PrivateRoute = props => {
    return (
        <UserContext.Consumer>
            {({ user }) => (
                <PrivateRouteWithoutContext user={user} {...props} />
            )}
        </UserContext.Consumer>
    );
};

```

```javascript
// in components/Header.js
import React from 'react';
import PropTypes from 'prop-types';

import { UserContext } from '../App';
import { Navigation } from './Navigation';

export const HeaderWithoutContext = ({ user, onLogout }) => (
    <header>
        <h1>JavaScript Playground: meetups</h1>
        {user && <Navigation onLogout={onLogout} />}
    </header>
);

HeaderWithoutContext.propTypes = {
    user: PropTypes.object,
    onLogout: PropTypes.func.isRequired,
};

export const Header = () => {
    return (
        <UserContext.Consumer>
            {({ user, onLogout }) => (
                <HeaderWithoutContext user={user} onLogout={onLogout} />
            )}
        </UserContext.Consumer>
    );
};
```

<iframe src="https://codesandbox.io/embed/o77qv75rmq?module=%2Fsrc%2FApp.js" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

[Release cra-with-react-context · alexisjanvier/javascript-playground · GitHub](https://github.com/alexisjanvier/javascript-playground/releases/tag/cra-with-react-context)

## Conclusion
 
 Intégrer `Redux` dans votre toolbox de démarage de projet est sans doute une idées à revoir. Si `Redux` est un outils puissant, il ne correspond pas à tout les cas d'utilisation et repond à une complexité de projet particulière. Il existe maintenant des outils et des pattern permettant de repondre simplement aux problématiques de factorisation de comportements (les render props) ou de partage de state (react contexte).
