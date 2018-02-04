---
title: "Un monorepo pour les petits projets"
slug: "monorepo"
date: "2018-02-04"
description: "Plébiscitée sur les grosses bases de code, l’utilisation d’un monorepo sur un projet de librairies est un indéniable plus. Mais qu’en est-il sur les projets plus standards ?"
tags:
- Git
- Project
---

J'ai vu passer pas mal de post de blog sur le sujet, et c'est aussi une technique mise en place sur la prochaine version de admin-on rest (branch next, renommer react-admin) pour laquelle Gildas est très entousiaste : le monorepo. L'idée est simple : plutôt que de gerer les différentes partie d'unn projet (un back et un front pour une appli, ou ses microservices, ou ses librairie) dans des repo séparer, on gère tout son code dans un seul repository. Certain l'utilise sur des base de code énormes (google, facebook, ...), d'autres possédant une très grannd nombre de repo (des librairie comme jest). Mais est-ce un avantage pour un projet plus classique ?

Comme souvent, pratique des grosses bases de codes (microservices, kafka, ...), mais qu'est ce que cela apporte à mon quotidien de dev sur des projets plus standards ?

## Typologie de projet
Je part une typologie de projet que je rencontre pas mal en ce moment : deux fronts (un pour l'admin et un pour l'application cliente) et un back (un express pour servir une api). Et générallement tout est en js ! 
Ce n'est pas un problème que de séparer ces trois partie au sein du même repo (c'est ce que je fais déja), mais chaque "projet" possède souvent ses propres dépendances, sa propre conf de style, et ses propres tests.
Les outils développés pour les approches monorepo peuvent-il amélirer les choses

## Yarn workspace
Interêt : partage des dépendances. Interdépendances

Marce à suivre : create-reacte-app et graphcool init : creation du packahe.json et téléchargement des dep à l'instanciation.
Donc une fois que c'est fait, suppression des node_modules et des yarn lock.
Creation du packahe.json à la racine, puis yarn install.

NOTE : Refaire, puis comparer la taille dans les trois repo, puis sur le monorepo.

## Eslint et prettier

Ajout de prettier, dans la workspace (je sias pas si c'est une bonne pratique ?)
Et un eslintrc.json au la racine !

yarn add -DW prettier eslint-plugin-prettier eslint-config-prettier

## Les tests et Jest

Jest multi project mais marche pas avec react-create-app

Solution Lerna comme lanceur de test, mais overkill pour mon cas

Donc un jest qui va chercher partout, sauf que galère avec le create-reacct-app aussi

donc au final un makefile

```makefile
.PHONY: build help

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

test-admin:
	cd services/administration && NODE_ENV="test" CI=true yarn test

test-configurator:
	cd services/configurator && NODE_ENV="test" CI=true yarn test

test: test-admin test-configurator

```


## Conclusion

Bin sur le principe, pas grand chose si on a déja ses services dans un seul repo.
Un petit plus pour le poids, mais sinon, lint et tests identique (surtout avec des bootstrapper et leur auto-config). Pareil pour le déploiement pas aborder ici.

Non, cela semble vraiment super pour des projets de lib ou lerna semble un gros plus (déploiement npm, gestion des dépendances entre les partties de la lib, tests non bootstrappés, etc) ...
Et peut-être pour les bases de codes gigantestque et les équipes de dev très nombreuse ... mais ca, je ne sais pas.

 ========
 
 Pas de dépenance entre les versions des projets
 Super pour des lib + LERNA
 Quels outils de déploiements.
 
 ==========
 
 References
 https://yarnpkg.com/en/docs/workspaces
 https://lernajs.io/
 https://github.com/facebook/create-react-app/issues/2461
 
 https://www.npmjs.com/package/eslint-config-react-app
 https://prettier.io/docs/en/eslint.html
