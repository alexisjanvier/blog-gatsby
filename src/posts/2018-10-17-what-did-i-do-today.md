---
title: Journal intime d'un développeur
slug: "qu-est-ce-que-j-ai-fait-aujourd-hui"
marmelab:
date: "2018-11-03"
description: "Une chose que j’aime particulièrement dans mon métier de développeur, c’est que l’on apprend tout le temps : un pattern, une lib, une obscure astuce de configuration… Dans le feu de l’action, on se réjouit, mais quelques jours après, souvent, on les oublie. C’est dans ces moments-là que l’on se dit que l’on aurait bien fait prendre des notes."
tags:
- cli
- tool
---

C’est une bonne habitude que de noter toutes ces petites choses apprises au jour le jour. Pourtant ce n’est pas toujours facile d’intégrer un moyen de prise de notes dans ce quotidien. J’ai déjà essayé pas mal d’outils : jrnl, mais je n’ai jamais réussi à me souvenir des commandes, boostnote que je n’utilise pas lorsque je code, car c’est une fenêtre en plus, ou encore gist mais je n’arrive pas à le tenir organisé…
Et puis j'ai reçu ce lien [did.txt file](https://theptrk.com/2018/07/11/did-txt-file/) dans ma newsletter [changelog](https://changelog.com/).

## did.txt

Voici comment [Patrick](https://theptrk.com/about/) introduit son article:

> Goal: create an insanely simple “did” file accessible by terminal

Effectivement, c'est très simple et diablement efficace. Il s'agit juste d'ajouter un alias dans son `.bash_profile` ou son `.zshrc` :

```bash
alias did="vim +'normal Go' +'r!date' ~/did.txt"
```

Une commande `did` ouvre dans le terminal - on ne quitte donc pas son environnement de travail - un fichier avec la date du jour au sein duquel il ne reste plus qu'à transcrire cette petite chose que vous venez d'apprendre.

![Did : la commande d'origine](/images/did/did_init.gif)

Et ça m'a beaucoup plu cette idée d'avoir un nouvel outil construit avec ce que l'on a déjà sous la main sur le système. Mais il est sans doute un peu trop simple. Par exemple, voici ce qui se passe si on utilise deux fois la commande dans la même journée :

![Sans doute trop simple](/images/did/did_init_pbl.gif)

En fait, très rapidement deux problèmes ont émergé me faisant penser que je n’intégrerais pas cette commande `did` à mon quotidien :

- **Toutes les notes sont dans un seul fichier**, et comme il s’agit de notes quotidiennes, ce fichier risque de devenir beaucoup trop long pour être exploitable. L’intérêt de prendre des notes, c’est de pouvoir les relire !
- **Le fichier est en `.txt`**, limitant fortement les possibilités de mise en forme des notes, comme les extraits de code.

Qu’à cela ne tienne, j’étais en vacance ce jour de newsletter, ce post documente comment j’ai adapté cette bonne idée à ce dont j’avais besoin en tachant de garder la même simplicité que le `did` initial et en continuant à n’utiliser que ce qui était déjà disponible dans la console.


## Un journal par semaine

Je travaille en cycle (sprint) de deux semaines, aussi la découpe de l’unique fichier en plusieurs journaux hebdomadaires s’est tout de suite imposée.

Je ne vais pas rentrer dans les détails de l’implémentation, voici le résultat (presque) final :

```bash
export DID_PATH=~/.did

function did(){
    export LC_ALL=C
    if [ ! -f ${DID_PATH}/$(date +%Y-%V).txt ]; then
        echo "Week $(date +"%V (%B %Y)") \n\n$(date +"%A %Y-%m-%d")" > ${DID_PATH}/$(date +%Y-%V).txt
    fi
    FILE_EDITION_DATE="$(stat -c "%y" ${DID_PATH}/$(date +%Y-%V).txt)"
    NOW="$(date +"%Y-%m-%d")"
    if [ ${FILE_EDITION_DATE:0:10} != ${NOW} ]
    then
        echo "\n$(date +"%A %Y-%m-%d")\n" >> ${DID_PATH}/$(date +%Y-%V).txt
    fi
    unset LC_ALL
    vim +'normal Go' ${DID_PATH}/$(date +%Y-%V).txt
}
```

L'option `--help`, [`man`](https://fr.wikipedia.org/wiki/Man_(Unix)) et Google ont été mes amis pour arriver à ce résultat. Voici tout de même les points qui me semblent importants.

- **Une fonction plutôt qu'un alias** : avec l'introduction d'une logique de type *si le journal existe, alors, sinon*, il a fallu remplacer le simple alias par une fonction shell. `if [ ! -f ${DID_PATH}/$(date +%Y-%V).txt ]; then`
- **La commande `date`** : c'est la commande que j'ai le plus testée. Ici elle est simplement utilisée pour formater la date courante. Par exemple `date +%Y-%V`
- **La commande `stat`** : elle permet de récupérer beaucoup d'information sur un fichier, comme la date de dernière modification `stat -c "%y" ${DID_PATH}/$(date +%Y-%V).txt`. C'est ce qui m'a permis de savoir si le fichier avait déjà été édité dans la journée ou non, pour décider s’il fallait rajouter ou non cette date à la fin du fichier.
- **La locale du terminal** : la commande `date` est sensible à la locale du terminal. J'avais donc des mois et des jours en français. Pour pouvoir tenir mes notes en anglais, il a fallu changer la locale du terminal le temps de l'exécution de la commande avec un `LC_ALL=C`
- **La variable d'environnement `DID_PATH`** : cette variable est très logique, puisqu'elle simplifie l'écriture du script et permet de changer facilement le répertoire de stockage des journaux. Mais elle a un effet de bord génial : en utilisant [direnv](https://direnv.net/), cela va permettre de créer des notes spécifiques par projet !


![la nouvelle commande did](/images/did/did.gif)

Cette nouvelle commande fait le boulot puisque l’on utilise maintenant un fichier par semaine au lieu d'un unique fichier. Mais cette amélioration illustre assez bien l'article de David Kadavy [*La complexité est flippante : ce n'est jamais "juste une chose de plus"*](https://medium.com/@kadavy/complexity-is-creepy-its-never-just-one-more-thing-79a6a89192db).

En effet, ma *chose de plus* apporte son lot de questions :

- Avec le `did` initial, j'ouvrais toujours le même fichier. Mais maintenant que `did` ouvre le journal de la semaine courante. **Comment vais-je visualiser mes notes de la semaine dernière** ?
- Si je veux ouvrir un journal passé. **Comment vais-je savoir quels journaux existent** ?
- Avec le `did` initial, je pouvais faire une recherche avec `vim` au sein de mon unique fichier. Mais maintenant. **Comment vais-je retrouver une note au sein de tous les journaux** ?

## Visualiser un journal spécifique : didv (view)

```bash
function didv(){
    if [ $1 ]
    then
         cat ${DID_PATH}/${1}.txt
    else
        if [ ! -f ${DID_PATH}/$(date +%Y-%V).txt ]; then
            LC_ALL=C echo "# Week $(date +"%V (%B %Y)") \n\n## $(date +"%A %Y-%m-%d")" > ${DID_PATH}/$(date +%Y-%V).txt
        fi
        cat ${DID_PATH}/$(date +%Y-%V).txt
    fi
}
```

Cette commande est plus simple que `did`, mais elle introduit l'utilisation des arguments d'une commande shell: `if [ $1 ]`.
`didv` permet d'ouvrir le journal courant et `didv 2018-32` le journal de la semaine 32.
C'est `cat`qui se charge de l'affichage du fichier.

![Visualiser les journaux avec didv](/images/did/didv_txt.gif)

## Lister les journaux hebdomadaires : didl (list)

Je pensais que la mise en place de la liste des journaux serait la fonctionnalité la plus rapide à mettre en place. J'ai de manière pragmatique tester les commandes `ls` et `tree` : 

![Liste des journaux avec ls et tree](/images/did/ls_tree.gif)

Mais deux choses me dérangeaient : 

- je ne voulais pas afficher l'extension du fichier (par exemple `2018-32` plutôt que `2018-32.txt`),
- je voulais afficher le mois correspondant au numéro de semaine pour rendre la liste plus lisible.

Et afficher [le mois à partir du numéro de semaine](https://en.wikipedia.org/wiki/ISO_week_date#Calculating_the_week_number_of_a_given_date) avec la commande `date` fut la partie la plus compliquée de cette journée amélioration de `did` !

```bash
function week2Month(){
    export LC_ALL=C
    year=$(echo $1 | cut -f1 -d-)
    week=$(echo $1 | cut -f2 -d-)
    local dayofweek=1 # 1 for monday
    date -d "$year-01-01 +$(( $week * 7 + 1 - $(date -d "$year-01-04" +%w ) - 3 )) days -2 days + $dayofweek days" +"%B %Y"
    unset LC_ALL
}

function didl(){
    for file in `ls ${DID_PATH}/*.txt | sort -Vr`; do
        filenameRaw="$(basename ${file})"
        filename="${filenameRaw%.*}"
        echo "${filename} ($(week2Month ${filename}))"
    done
}
```

![didl](/images/did/didl.gif)

## Faire une recherche dans les journaux hebdomadaires : dids (search)

Dernière commande à implémenter : faire une recherche dans les journaux. Et c'est `grep` qui est mis à contribution.

```bash
function dids(){
    export LC_ALL=C
    if [ $1 ]
    then
        for file in `ls ${DID_PATH}/*.txt | sort -Vr`; do
            NB_OCCURENCE="$(grep -c @${1} ${file})"
            if [ ${NB_OCCURENCE} != "0" ]
            then
                filenameRaw="$(basename ${file})"
                filename="${filenameRaw%.*}"
                echo -e "\n\e[32m=> ${filename} ($(week2Month ${filename}), ${NB_OCCURENCE} results) \e[0m" && grep -n -B 1 ${1} ${file}
            fi
        done
    else
         echo "You must add a something to search..."
    fi
    export LC_ALL=C
}
```

Pour pouvoir taguer mes notes (et donc limiter la recherche aux tags), j'ai décidé d'utiliser le préfixe `@`, ce qui permet de faire `NB_OCCURENCE="$(grep -c @${1} ${file})"`. Ensuite, l'affichage des résultats n'utilise plus le préfixe, ce qui permet d'afficher les lignes correspondant à la recherche au sein du fichier tagué.

![dids](/images/did/dids_tag.gif)

## Formater les notes : `markdown`
Du python, une dépendance. Mais c'est plus joli Je suis un punk
[View Markdown Files in your Terminal](https://tosbourn.com/view-markdown-files-terminal/)
[vmd](https://github.com/axiros/terminal_markdown_viewer)
[GitHub - cpascoe95/vmd: Terminal Markdown Viewer](https://github.com/cpascoe95/vmd)


## Les commandes finales

`gist:alexisjanvier/bfe71d18f68434e29c08637e4d837c74`

## Conclusion
Très fun, et tout (ou presque) là ! 50 lignes pour un outil qui marche ! Importance de bien connaitre son outil de travail, man ou tldr.
Le suite : publier en ligne, puisque c'est du markdown !
low dev, vs low tech
