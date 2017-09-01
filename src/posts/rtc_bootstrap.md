---
title: "Bootstraping du projet ES6"
slug: "bootstrapping_du_projet_en_es6"
date: "2016-02-09"
tags:
    - "es6"
    - "babel"
    - "webpack"
description: "L’application « Road to Caen » va donc être codée en ES6. L’idée est d’écrire du JavaScript qui ne pourra pas être nativement interprété par le navigateur, mais devra passer par une première phase de transpilation d’ES6 en ES5. Pour cela, il va falloir bootstrapper le projet avec pas mal d’outils (cause chez quelques-uns d’une certaine fatigue…)."
---

**Prérequis**

Le projet va être développé avec :

- `node.js` version 5.5.0
- `npm` version 3.3.12

J'utilise [nvm](https://github.com/creationix/nvm) pour gérer différentes versions de `node`, avec un peu de configuration de `npm` pour accélérer l'installation des modules, et fixer leur version :

```bash
npm config set progress=false
npm config set save-prefix='~'
```

# Transpilation avec Babel

Je vais utiliser [Babel](https://babeljs.io/) pour transpiler le code ES6 en ES5. La version 6 a introduit une nouvelle organisation du projet. Il faut maintenant installer au minimum **babel-core**, sur lequel vont s'appuyer tous les autres modules.

```bash
npm install babel-core –save-dev
```

Ensuite, il faut installer **babel-cli** permettant entre autres de vérifier l'environnement avec **babel-doctor** ainsi que **babel-node** qui lui permet de lancer des scripts ES6 avec node avec une transpilation dynamique (on a ainsi un **REPL ES6**).

```bash
npm install babel-cli –save-dev
```

Enfin, Babel utilise maintenant un système de **presets** permettant de ne transpiler que ce qui sera nécessaire au code final en fonction de son environnement d'exécution, en l'occurrence le navigateur.

```bash
npm install babel-preset-es2015
```

```json
# package.json

  "devDependencies": {
    "babel-cli": "~6.5.1",
    "babel-core": "~6.5.1",
    "babel-preset-es2015": "~6.5.0"
  },
  "babel": {
    "presets": [
      "es2015"
    ]
  }
```

***Remarque :*** *J'ai configuré le preset de Babel directement dans le fichier `package.json`. Il est également possible de réaliser cette configuration dans un fichier `.babelrc`.*

Je conseille la lecture de l'article de [Jean-Charles Sisk](https://twitter.com/jcse), [« ***Clearing up the Babel 6 Ecosystem ***»](https://medium.com/@jcse/clearing-up-the-babel-6-ecosystem-c7678a314bf3#.nfrmt64p8) pour avoir plus de détail sur Babel 6.

Maintenant, il faut choisir si l'on veut utiliser Babel :

- **dynamiquement** directement au niveau du navigateur,
- **statiquement** au niveau du serveur en générant un fichier .js transpilé, fichier qui sera ensuite appelé par le navigateur.

C'est la solution que je vais utiliser (expliquant la déclaration des modules Babel en dépendance de développement, puisque Babel ne sera jamais présent dans le js de production).
Et pour cela, nous allons devoir passer par un autre outil : [**Webpack**](https://webpack.github.io/).

# Webpack
Webpack est un « *module bundler* » permettant de gérer notre code es6 écrit en module et générer un fichier final js utilisable dans le navigateur, en effectuant au passage la transpilation ES6 avec Babel.

 > webpack takes modules with dependencies and generates static assets representing those modules.

Webpack fait d'ailleurs bien plus que cela comme cela sera vu plus tard. Pour le moment, installons le afin de faire un premier test de transpilage de deux modules ES6.
Tous les fichiers de cette phase de bootstraping sont créés dans le répertoire `/src` et utilisent la syntaxe ES6 pour la gestion des modules.

```
├── src
│   ├── css
│   │   └── main.css
│   ├── index.html
│   └── js
│       ├── main.js
│       └── paris.js
```

```html
<!-- src/index.html -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Road to Caen</title>
</head>
<body>

<h1>Road to Caen - version 0.1.0</h1>

<div id="start_here"></div>
<script src="js/main.js"></script>
</body>
</html>
```

```js
// src/js/main.js

import city from './paris';

document.getElementById('start_here').innerHTML = `For the moment, you are in ${city}`;
```

```js
// src/js/city.js

export default 'Paris';
```

Si l'on essaye d'ouvrir index.html directement dans le navigateur, on a logiquement une erreur :

![De l'ES6 dans le navigateur](/images/rtc_bootstrap/rtc_bootstrap_es6_in_browser_error.png)

On va donc configurer webpack pour effectuer un build du fichier `main.js` dans le répertoire `/build`, obligant au passage à installer deux plugins:

```bash
npm install webpack babel-loader copy-webpack-plugin –save-dev
```

- **babel loader** est un plugin webpack permettant d'utiliser Babel dans Webpack
- **copy-webpack-plugin** est un plugin webpack permettant de copier un fichier d'un répertoire à un autre, éventuellement en le renommant.

Je ne vais pas rentrer dans les détails de webpack (vous pouvez pour cela lire xxx ou xxx), mais le grand principe est :

- de déclarer une ou plusieurs sources d'entrée (`entry`),
- de déclarer une ou plusieurs sources de sortie (`output`) correspondant aux entrées,
- des loaders pour les différents types d'assets traités (dans l'exemple à suivre, on utilise par exemple le **babel-loader** pour transpiler les fichiers js traités).

On déclare aussi des plugins pour des cas particuliers, comme le plugin **copy-webpack-plugin** permettant de copier le fichier `/src/index.html` dans le répertoire cible `/build/`.

```js
# Fichier de configuration de webpack webpack.config.js à la racine du projet

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const dirJs = path.resolve(__dirname, 'src/js');
const dirHtml = path.resolve(__dirname, 'src');
const dirBuild = path.resolve(__dirname, 'build');

module.exports = {
    entry: path.resolve(dirJs, 'main.js'),
    output: {
        path: dirBuild,
        filename: 'js/main.js',
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: dirHtml + '/index.html'
            },
        ]),
    ],
    stats: {
        colors: true,
    },
};
```

```bash
./node_modules/.bin/webpack
```

On retrouve au final un fichier `index.html` et `main.js` dans le répertoire `/build/`, que l'on peut charger sans erreur dans un navigateur.

# Un serveur de développement

On arrive donc à transpilet notre ES6 dans un fichier unique fichier js, et c'est déjà chouette. Mais on ne va pas lancer un build à chaque modifications du code...
Pour éviter cela, on va installer le **webpack-dev-server**, et en profiter pour faire un makefile afin de faciliter le lancement des commandes (`make build` pour lancer un transpilation et `make run-dev` pour le lancement du serveur de dev), et permettre à d'éventuels autre participants au projet de pouvoir facilement installer tout l'environnement de développement (`make install`).

```bash
npm install webpack-dev-server –save-dev
```

```makefile
# makefile

.PHONY: default install run test build clean-build

default: run-dev

install:
	@npm install

clean-build:
	@rm -rf ./build/*

build: clean-build
	@./node_modules/.bin/webpack

run-dev: clean-build
	@./node_modules/.bin/webpack-dev-server --hot --inline --port=8080
```

***Remarque*** : *on pourrait aussi utiliser `npm` pour lancer ces commandes et éviter le `node_modules/.bin` vers les exécutables des outils. Mais par habitude, ce sera make.*

Le **webpack-dev-server** est très rapide (il charge le code en mémoire) et permet de faire du *live-reload* (option `–hot`). On transpile maintenant bien le code ES6 en js lisible par le navigateur à la volée.
Mais on ne gère que le js, alors que l'on veut aussi avoir du css.

# Webpack et le css

Pour gérer le css, on ajoute un nouveau plugin et un nouveau loader (pour du css simple, mais on pourra aussi par la suite "*pre-processer*" du **sass** par exemple, grace à d'autres loaders).

```bash
npm install style-loader --save-dev
```

```js
# webpack.config.js

...
module: {
    loaders: [
    {
        test: /\.css$/,
        loader: "style!css",
    },
    ...
```

L'étrangeté, c'est l'appel du css dans le `main.js`, et pas dans l'`index.html` :

```js
# src/js/main.js

import '../css/main.css';
```
Mais c'est comme cela que l'on va pouvoir gérer nos css avec Webpack, comme un module js.

# Gestion des différents environnements

 Il faut maintenant encore améliorer les choses afin de gérer :

- un **sourcemap** lorsque l'on est en développement (on trouve sur la page [Source maps: languages, tools and other info](https://github.com/ryanseddon/source-map/wiki/Source-maps:-languages,-tools-and-other-info) plein d'informations sur les sourcemaps)
- la génération d'un fichier js optimisé (minimisé) et d'un fichier css séparé pour le site de production,
- quelques variables permettant de bien distinguer l'environnement de développement et celui de production, comme le titre de la page, le nom du css et du js finale,
- la gestion du ***cache busting*** des assets.


 Pour cela on va utiliser quelques nouveaux modules et plugins webpack :

- [**config**](https://github.com/lorenwest/node-config) permettant de gérer des fichiers de configuration différents entre le dev et la prod,
- [**html-webpack-plugin**](https://github.com/ampedandwired/html-webpack-plugin) permettant de mieux gérer nos sorties webpack à partir d'un template html,
- [**extract-text-webpack-plugin**](https://github.com/webpack/extract-text-webpack-plugin) permettant de générer un fichier css final.

Le plugin **html-webpack-plugin** est tout simplement génial, et je vous renvoie vers l'article de [Jonathan Petitcolas](http://www.jonathan-petitcolas.com/) pour découvrir tout son potentiel : [Webpack HTML plug-in in a nutshell](http://marmelab.com/blog/2016/01/26/webpack-html-plugin-in-a-nutshell.html).
Le module **config** va lui permettre de gérer un fichier de configuration (`config/default.js`) accessible depuis le code, et l'on va pouvoir surcharger cette configuration selon les environnements de node **NODE_ENV**.

```bash
npm install config  html-webpack-plugin  extract-text-webpack-plugin –save-dev
```

```js
# webpack.config.babel.js

import path from 'path';
import plugins from './webpack/plugins';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const dirJs = path.resolve(__dirname, 'src/js');
const dirHtml = path.resolve(__dirname, 'src');
const dirBuild = path.resolve(__dirname, 'build');

module.exports = {
    entry: path.resolve(dirJs, 'main.js'),
    output: {
        path: dirBuild,
        filename: 'js/road_to_caen.js', // On génère un fichier js final nommé
    },
    module: {
        loaders: [
            {
                test: /\.js$/, // le loader des fichiers js
                loader: 'babel-loader', // on transpile l'ES6 avec Babel
                exclude: /node_modules/,
            },
            {
                test: /\.css$/, // le loader des css
                // Ici on traite différemment le css selon l'environnement : en dev on l'inject avec le javascript
                // en prod, on génère un fichier css distinct grace au extract-text-webpack-plugin
                loader: process.env.NODE_ENV === 'dev' ? 'style!css' : ExtractTextPlugin.extract("style-loader", "css-loader"),
            },
        ],
    },
    plugins: plugins(process.env.NODE_ENV, dirHtml), // On appel un fichier de conf des plugin distinct en passant l'environnement
    stats: {
        colors: true,
    },
    // On va créer un fichier sourcemap si l'on est en environnement de développement
    devtool: process.env.NODE_ENV === 'dev' ? 'source-map' : false,
};
```

```js
# webpack/plugin.js

import config from 'config'; // on appel le module de configuration
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

export default (env, dirHtml) => {
    const pluginsArray = [
        // Avoid publishing files when compilation fails
        new webpack.NoErrorsPlugin(),
        new HtmlWebpackPlugin({
            hash: env === 'prod', // ici, on génère le cache busting des assets si l'on est en prod
            title: config.app_name, // définit une variable utilisable dans le template html. On recupère le titre depuis la config
            template: dirHtml + '/index.html',
        }),
    ];
    if (env === 'prod') {
        pluginsArray.push(
            // Ici on configure le plugin permettant de générer le fichier css de production
            new ExtractTextPlugin('css/road_to_caen.css', {
                allChunks: true,
            })
        );
    }

    return pluginsArray;
};
```

***Remarque*** : *Le fichier de configuration de webpack a été renommé en `webpack.config.babel.js`: c'est ce qui permet d'utiliser de l'ES6 dans ce fichier js :).*

```js
# src/index.html

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <!-- On utilise la variable options de webpack -->
    <title><%= htmlWebpackPlugin.options.title %></title>
    <!-- Plus besoin d'appeller le fichier css, webpack va injecter l'appel pour la production -->
</head>
<body>

<h1>Road to Caen - version 0.1.0</h1>

<div id="start_here"></div>
<!-- Plus besoin d'appeller le fichier js, webpack va injecter l'appel pour la production -->
</body>
</html>

```

```js
# build/index.html - le fichier html final de production

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <!-- On a bien le nom de production défini dans le fichier config/prod.js -->
    <title>Road to Caen</title>
    <!-- L'appel au fichier css final est bien fait, avec du cache busting. Ce fichier est bien minifié  -->
<link href="css/road_to_caen.css?e79fbcf65e16662aa388" rel="stylesheet"></head>
<body>

<h1>Road to Caen - version 0.1.0</h1>

<div id="start_here"></div>
<!-- L'appel au fichier js final est bien fait, avec du cache busting. Ce fichier est bien minifié -->
<script src="js/road_to_caen.js?e79fbcf65e16662aa388"></script></body>
</html>
```

```makefile
# makefile

.PHONY: default install run test build clean-build

default: run-dev

install:
    @npm install

clean-build:
    @rm -rf ./build/*

build: clean-build
    # On défini l'environnement de node comme prod pour le build de production
    # On ajoute l'option -p (production) pour la minification des assets
    # --progress permet de visualiser l'avancement du build sur la console
    @NODE_ENV=prod ./node_modules/.bin/webpack -p --progress

run-dev: clean-build
    # On défini l'environnement de node comme dev pour le webpack-dev-server
    @NODE_ENV=dev ./node_modules/.bin/webpack-dev-server --hot --inline --port=8080
```

# Les tests unitaires

On y est presque ! Mais il manque encore les tests unitaires qui seront réalisés avec [mocha](https://mochajs.org/) et [chai](http://chaijs.com/).

```bash
npm install mocha chai --save-dev
```

```makefile
# makefile

test-unit:
    # On indique à mocha ou trouver les fichiers de test : src/js/**/*.spec.js
    # On ajoute un compileur à mocha, pour pouvoir écrire les tests en ES6 : --compilers js:babel-core/register
    # On configure la sortie de console de mocha avec --reporter spec --ui bdd
    @NODE_ENV=test node_modules/.bin/mocha src/js/**/*.spec.js --compilers js:babel-core/register --reporter spec --ui bdd --timeout 5000

```

Concernant les fichiers de tests unitaires, je trouve cela plus pratique et plus cohérent de créer le fichier à côté du fichier testé unitairement en rajoutant un `.spec`, plutôt que de les mettre dans un répertoire `/tests` distinct.

```
├── src
│   ├── css
│   │   └── main.css
│   ├── index.html
│   └── js
│       ├── main.js
│       ├── paris.js
│       └── paris.spec.js
```

```js
# src/js/paris.spec.js

import city from './paris';
import { assert } from 'chai';

describe('city', () => {
    it('should export "Paris" as city', () => {
        assert.equal(city, 'Paris');
    });
});
```

# Les tests fonctionnels

Pour que les tests soient complets, il manque encore les tests fonctionnels. Pour les réaliser, je vais utiliser [Nightwatch](http://nightwatchjs.org/).
Mais tout d'abord, pour faire des tests fonctionnels, on va avoir besoin d'un build de prod et d'un serveur permettant à Nightwatch d'appeler une URL à tester.

L'exposition http des fichiers statiques finaux sera assurée par [http-server](https://github.com/indexzero/http-server).  Lors de l'execution des tests, il va falloir gérer :

- 1) le lancement du serveur des statiques
- 2) le lancement d'un serveur [selenium](http://www.seleniumhq.org/)
- 3) l'execution des tests
- 4) l'arrêt du selenium
- 5) l'arrêt du serveur de statiques

Cela peut se gérer via les `PID` des instances de serveurs

```bash
start-static-server: static-server.PID
static-server.PID:
	@echo "Starting static server"
	@cd ./build && { ../node_modules/.bin/http-server -p 8081 & echo $$! > ../$@; } && cd ..
stop-static-server: static-server.PID
	@kill `cat $<` && rm $<
```

Mais je n'aime pas trop cette solution, qui présente entre l'autre l'inconvéniant de laisser trainer des fichiers `.PID` en cas d'échec des tests, empêchant la relance des serveurs après correctif.
J'ai trouvé une solution plus élégante consistant à utiliser [PM2](http://pm2.keymetrics.io/) pour gérer les serveurs lors des tests. J'ai soumis cette solution à mes [éminents collègues marmelabien](http://marmelab.com/) et en fonction de leurs retours, je ferais un petit post spécifique sur l'utilisation de PM2 en environnement de développement et de tests.
Mais voici ce que cela donne pour *Road to Caen* :

```bash
npm install nightwatch selenium-standalone pm2 --save-dev
```

```json
# rtc_functional_test.json : le fichier de configuration des serveurs de PM2

{
  "apps" : [{
    "name"       : "rtc-static-server", // le nom du serveur
    "script"     : "./node_modules/.bin/http-server", // l'appel au serveur
    "args"       : ["./build", "-p 8088", "--silent"], // les options
    "instances"  : 1
  }]
}

```

```json
# nightwatch.json : le fichier de configuration de Nightwatch

{
    "src_folders": ["./test-functional/"], // repertoire des tests fonctionnels
    "output_folder": "./test-functional/reports", // repertoire des rapports de tests
    "custom_commands_path": "",
    "custom_assertions_path": "",
    "globals_path": "",

    "selenium": {
        "start_process": true, // Nightwatch se charge de lancer et d'eteindre selenium !
        "server_path": "./node_modules/selenium-standalone/.selenium/selenium-server/2.48.2-server.jar",
        "log_path": "",
        "host": "127.0.0.1",
        "port": 4444,
        "cli_args": {
            "webdriver.chrome.driver": "./node_modules/selenium-standalone/.selenium/chromedriver/2.21-x64-chromedriver",
            "webdriver.ie.driver": ""
        }
    },

    "test_settings": {
        "default": {
            "launch_url": "http://localhost:8088",
            "selenium_port": 4444,
            "selenium_host": "localhost",
            "silent": true,
            "firefox_profile" : false,
            "desiredCapabilities": {
                "browserName": "chrome",
                "javascriptEnabled": true,
                "acceptSslCerts": true
            },
            "screenshots": {
                "enabled": true,
                "path": "./test-functional/screen-caps"
            },
            "desiredCapabilities": {
              "browserName": "firefox",
              "javascriptEnabled": true,
              "acceptSslCerts": true
            }
        },
        "firefox": {
            "desiredCapabilities": {
                "browserName": "firefox",
                "javascriptEnabled": true
            }
        },
        "chrome": {
            "desiredCapabilities": {
                "browserName": "chrome",
                "javascriptEnabled": true
            }
        }
    }
}

```

```makefile
# makefile
.PHONY: default install run test build clean-build

install:
    @npm install
    # On lance l'installation du serveur selenium
    @node_modules/.bin/selenium-standalone install --version=2.48.2


test-functional: clean-build
    # lancement du build des fichiers statiques finaux identiques à la prod
    @make build
    # lancement du serveur statique avec pm2 en indiquant le fichier de configuration du serveur
    @node_modules/.bin/pm2 start rtc_functional_tests.json
    # lancement de nightwatch, qui va se charger de l'instance de selenium
    @node_modules/.bin/nightwatch
    # arret du serveur statique
    @node_modules/.bin/pm2 stop rtc-static-server
```

```js
# test-functional/home.spec.js : fichier de tests de l'accueil du site

module.exports = {
    'Display Home': function (client) {
        client
            .url('http://localhost:8088')
            .pause(1000);

        client.expect.element('body').to.be.present.before(1000);
        client.expect.element('#start_here').text.to.equal('For the moment, you are in Paris');

        client.end();
    },
};
```

***Remarque*** : *Je n'ai pas encore trouver comment écrire les tests fonctionnels en ES6 :(*

# La touche finale: le « code styling »

Pour terminer cet environnement de développement ES6, on va ajouter un dernier outil permettant d'être cohérent sur le code styling du projet : [ESLint](http://eslint.org/)

```bash
npm install eslint eslint-config-airbnb eslint-plugin-mocha --save-dev
```

Eslint se configure dans un fichier `.eslintrc` :

```json
{
    "extends": "airbnb",
    "env": {
        "mocha": true,
    },
    "rules": {
        "indent": [2, 4],
    },
}
```

J'utilise le preset airbnb, qui gère bien l'ES6, mais aussi la syntaxe particulière de Redux. Je ne lance pas de tests directement avec ESLint, mais j'utilise avec [ATOM](https://atom.io/) le plugin [linter-eslint](https://atom.io/packages/linter-eslint).

# Conclusion

Alors, [***JavaScript fatigue***](https://medium.com/@ericclemmons/javascript-fatigue-48d4011b6fc4#.6bg742tti) ? Il est vrai que cette phase de bootstraping est assez longue, et oblige à voir et comprendre pas mal d'outils. Un `ls` dans le répertoire des `node_modules` est plutôt impressionnant ! On est tenté de se dire : *tout ça pour générer un (encore) pauvre fichier js final ?*
Eh bien oui, mais j'oppose à cela plusieurs remarques.

Tout d'abord, on est en présence d'un environnement de développement complet permettant :

- d'écrire en ES6 du code qui sera lisible sur tout les navigateurs,
- de générer des assets finaux optimisés,
- de disposer d'un serveur de développement très rapide assurant le live-reload,
- d'écrire des tests unitaires et fonctionnels,
- de s'assurer de la cohérence de la syntaxe du projet.

![L'environnement final](/images/rtc_bootstrap/rtcBootstrapOk.gif)

Ensuite, toutes ces librairies et autres modules envahissant le répertoire `node_modules` ne sont là **que pour l'environnement de développement**. Rien de cela n'est visible au final sur ce qui sera mis en production.
C'est donc une espèce d'usine Lego à produire du code final optimisé, pas de la surcharge de code.

Et ceci nous oblige en tant que développeur a bien connaître et si possible à maitriser ces outils, plutôt que de les avoir comme une boite noire intégrée à un IDE :)

En plus, un simple `make install`, et "***tadam***", tout est prêt !

Si vous voulez voir un autre bootstraping encore plus complet, car intégrant un serveur back en [Koa](http://koajs.com/) et un front en [React](https://facebook.github.io/react/)/[Redux](http://redux.js.org/), vous pouvez jeter un coup d'oeil à ce dépôt : [marmelab/javascript-boilerplate](https://github.com/marmelab/javascript-boilerplate).

Tout le code du bootstrap de `Road to Caen` est également disponible sur Github : [alexisjanvier/road-to-caen](https://github.com/alexisjanvier/road-to-caen/releases/tag/v0.1.0)

La prochaine étape, donc le prochain post, abordera la question du **déploiement continu du projet**.
