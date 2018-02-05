---
title: "Un monorepo pour les petits projets"
slug: "monorepo"
date: "2018-02-04"
description: "Plébiscitée sur les grosses bases de code, l’utilisation d’un monorepo sur un projet de librairies est un indéniable plus. Mais qu’en est-il sur les projets plus standards ?"
tags:
- Git
- Project
---

Si le terme ***monorepo*** fait très technique, pour autant il traduit parfaitement un concept simplissime : utiliser un seul repository pour plusieurs projets.

Et j’ai vu passer pas mal de posts de blog ces derniers temps sur le sujet, provenant le plus souvent de grosses boites ayant d’innombrables projets et d’innombrables développeurs, et donc d’innombrables dépôts de code. Le passage en monorepo pour ce type d’environnement est certainement très intéressant, mais très éloigné de mon quotidien.

De même, le principe de cette approche n’est pas une découverte : on utilise depuis longtemps un unique repository pour gérer toutes les parties d’un même projet (une api back, un application cliente, une appli d’administration).

Mais c’est en participant à la nouvelle branche d’admin-on-rest, renommée [react-admin]() que j’ai découvert de nouveaux outils dédiés au monorepo. Dans le cadre d’un projet open-source de librairie, on essaye de découper le code en plusieurs petites parties pour en faciliter l’utilisation, par exemple en évitant à l’utilisateur final de charger une librairie énorme dont il n’utiliserait que quelques fonctionnalités. Mais qui dit plusieurs parties dit beaucoup d’interdépendance entre chaque partie (et l’enfer du `npm link’) et plusieurs distributions (plusieurs repo ? :) ). 

Sont donc apparus dans le monde du javascript des outils comme les workspaces Yarn ou le projet Lerna.   
Si ils sont d’un indéniable intérêt pour les projets de types librairies, peuvent-ils apporter quelque chose au quotidien de projets plus classique orienté client ?



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
