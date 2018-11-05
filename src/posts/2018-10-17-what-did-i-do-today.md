---
title: Qu'est-ce que j'ai fait aujourd'hui ?"
slug: "qu-est-ce-que-j-ai-fait-aujourd-hui"
marmelab:
date: "2018-11-03"
description: "Une chose que j’aime particulièrement dans mon métier de développeur, c’est que l’on apprend tout le temps de nouvelles choses : un nouveau pattern, une nouvelle lib, une obscure astuce de configuration… Mais dans le feu de l’action on se réjouit mais quelques jours après, souvent on l’oublie. Et on se dit que l’on aurait bien fait de la noter."
tags:
- cli
- tool
---

C’est très clairement une bonne habitude que de noter toutes ces petites choses apprises au jour le jour. Pourtant ce n’est pas toujours facile d’intégrer un outil de notes dans ce quotidien. J’ai déjà essayé pas mal d'outils' : jrnl mais je n’ai jamais réussi à me souvenir des commandes, boostnote que je n’utilise pas lorsque je code car c’est encore une fenêtre en plus, ou encore gist mais je n’arrive pas à le tenir organisé…

Et puis j'ai reçu ce lien [did.txt file](https://theptrk.com/2018/07/11/did-txt-file/) dans ma newsletter [changelog](https://changelog.com/).

## did.txt

Voici comment [Patrick](https://theptrk.com/about/) introduit son article:

> Goal: create an insanely simple “did” file accessible by terminal

Et clairement, c'est très simple et diablement efficace. Il s'agit juste d'ajouter un alias dans son `.bash_profile` ou son `.zshrc` :

```bash
alias did="vim +'normal Go' +'r!date' ~/did.txt"
```

En une commande, on ouvre dans son terminal - sans quitter son environnement de travail donc - un fichier avec la date du jour dans lequel il ne reste plus qu'à noter cette petite chose que vous venez d'apprendre.

![Did : la commande d'origine](:storage/did/did_init.gif)

Et ça m'a beaucoup plu cette idée d'avoir un nouvel outil construit avec ce que l'on a déjà sous la main sur le système. C'est très simple. 

Sans doute un peu trop simple. Par exemple, voici ce qui se passe si on utilise deux fois la commande dans le même journée :

![Sans doute trop simple](:storage/did/did_init_pbl.gif)

En fait, très rapidement deux problèmes ont émergé me faisant penser que je n'intégrerais pas cette commande `did`à mon quotidien :

- **Toutes les notes sont dans un seul fichier**, et comme il s'agit de notes quotidiennes, ce fichier risque de devenir beaucoup trop long pour être exploitable. L'intérêt de prendre des notes, c'est de pouvoir les relire !
- **Le fichier est en `.txt`**, ce qui limite très fortement la mise en forme des notes, entre autres les extraits de code.

Qu'à cela ne tienne, j'étais en vacance ce jour de newsletter, ce post documente comment j'ai adapté cette bonne idée à ce dont j'avais besoin en tachant de garder la même simplicité que le `did` initial et en continuant à n'utiliser que ce qui était déjà disponible dans la console.


## Un journal par semaine

Pas trop de détails, man, tldr et --help ont été mes amis. Google aussi.
Pourquoi quotidien ?

```bash
export DID_PATH=~/.did

function did(){
    export LC_ALL=C
    if [ ! -f ${DID_PATH}/$(date +%Y-%V).md ]; then
        echo "# Week $(date +"%V (%B %Y)") \n\n## $(date +"%A %Y-%m-%d")" > ${DID_PATH}/$(date +%Y-%V).md
    fi
    FILE_EDITION_DATE="$(stat -c "%y"  ${DID_PATH}/$(date +%Y-%V).md)"
    NOW="$(date +"%Y-%m-%d")"
    if [ ${FILE_EDITION_DATE:0:10} != ${NOW} ]
    then
        echo "\n## $(date +"%A %Y-%m-%d")\n" >> ${DID_PATH}/$(date +%Y-%V).md
    fi
    unset LC_ALL
    vim +'normal Go' ${DID_PATH}/$(date +%Y-%V).md
}
```

### Une fonction plutôt qu'un alias

[Bash Shell: Check File Exists or Not - nixCraft](https://www.cyberciti.biz/faq/unix-linux-test-existence-of-file-in-bash/)

### La commande `date`

### La commande `stat`

### La locale du terminal

### La variable d'environnement `DID_PATH`

Conjointenement avec direnv

![la nouvelle commande did](:storage/did/did.gif)

Première conclusion [Complexity is creepy: It’s never just “one more thing.”](https://medium.com/@kadavy/complexity-is-creepy-its-never-just-one-more-thing-79a6a89192db)

- Avec le `did` initial, j'ouvrais toujours le même fichier. Mais maintenant que `did` ouvre le journal de la semaine courante, **comment je vais visualiser mes notes de la semaine dernière** ?
- Si je veux ouvrir un journal passé, **comment je vais savoir quels journaux existent** ?
- Avec le `did` inital, je pouvais faire une recherche avec `vim` au sein de mon unique fichier. Mais maintenant, **comment je vais retouver une note au sein de tous les journaux** ?

## Visualiser un journal spécifique : `didv`

paramètre de commande
bat

```bash
function didv(){
    if [ $1 ]
    then
         vmd ${DID_PATH}/${1}.md
    else
        if [ ! -f ${DID_PATH}/$(date +%Y-%V).md ]; then
            LC_ALL=C echo "# Week $(date +"%V (%B %Y)") \n\n## $(date +"%A %Y-%m-%d")" > ${DID_PATH}/$(date +%Y-%V).md
        fi
        vmd ${DID_PATH}/$(date +%Y-%V).md
    fi
}
```

## Lister les journaux hebdomadaires : `didl`

Retrouver la mois depuis le numero de semaine

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
    export LC_ALL=C
    for file in `ls ${DID_PATH}/*.md | sort -Mr`; do
        filenameRaw="$(basename ${file})"
        filename="${filenameRaw%.*}"
        echo "${filename} ($(week2Month ${filename}))"
    done
    unset LC_ALL
}
```

## Faire une recherche dans les journaux hebdomadaires : `dids`

commande date encore
commande ls
commande split

```bash
function dids(){
    export LC_ALL=C
    if [ $1 ]
    then
        for file in `ls ${DID_PATH}/*.md | sort -Vr`; do
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

## Formater les notes : `markdown`
Du python, une dépendance. Mais c'est plus joli Je suis un punk
[View Markdown Files in your Terminal](https://tosbourn.com/view-markdown-files-terminal/)
[vmd](https://github.com/axiros/terminal_markdown_viewer)
[GitHub - cpascoe95/vmd: Terminal Markdown Viewer](https://github.com/cpascoe95/vmd)


## Les commandes finales

Gists justement !

## Conclusion
Très fun, et tout (ou presque) là ! 50 lignes pour un outil qui marche ! Importance de bien connaitre son outil de travail, man ou tldr.
Le suite : publier en ligne, puisque c'est du markdown !
low dev, vs low tech
