---
title: "Un serveur en deux deux"
slug: "un-serveur-en-deux-deux"
marmelab:
date: "2018-10-17"
description: "Comment lancer un projet docker-compose sur un serveur publique en moins de 10 min"
tags:
- devops
---

# Un serveur en deux-deux

Pour un projet, il a fallu que nous lancions rapidement un serveur de staging (agilité oblige) en attendant la mise à disposition du serveur de staging final. Sans être aussi rapide qu'avec un service comme [Zeit Now](https://zeit.co/now) ou l'utilisation d'un [ngrock](https://ngrok.com/), on peut sur AWS lancer un serveur fonctionnel en moins de 10 minutes.

## Création d'une instance Amazon Lightsail

Généralement, on opte pour une instance EC2. Mais nous avons voulu tester [Lightsail](https://lightsail.aws.amazon.com), entre autre parce que l'instance minimale est plus puissante qu'une EC2 minimale, que c'est gratuit le premier mois et que le tarif reste raisonnable pour la suite (3.5$/m)
Nous avons donc lancer une instance minimal: 512 Mo, 1vCPU et un SSD de 20GO, avec l'OS [Amazon Linux](https://aws.amazon.com/fr/amazon-linux-ami/).

La provision du serveur prend moins de 3 min et on peut se connecter en ssh grâce à la clé .pem générée.

## Ajout d'une IP fixe
Pas d'url vers l'instance, contrairement à un EC2. Par contre, une IP fixe gratuite. Facile d'y associé n'import quel domaine ou sous-domaine. Mais cela ne tiendra pas dans le demi-heure : tant pis, je me contenterais d'une IP pour cette demo.

## Création d'un swap

512 Mo, c'est vraiment très juste pour lancer un docker-compose un peu chargé. Du coup, il faut aider un peu la mini-instance en créant un fichier de swap.

On se connect en root `sudo -s`. Puis on créé un fichier de swap de 1Go (1024 * 1024MB => 1048576)

```bash
dd if=/dev/zero of=/swapfile1 bs=1024 count=1048576
chown root:root /swapfile1
chmod 0600 /swapfile1
```

Il ne reste plus qu'à l'activation

```bash
mkswap /swapfile1
swapon /swapfile1
```

On peut aussi l'ajouter du fichier au fstab (pour conserver le swap en cas de redemarage de l'instance)

```bash
# in /etc/fstab
/swapfile1 none swap sw 0 0
```

Vérification de l'activation du swap `free -m`
```
             total       used       free     shared    buffers     cached
Mem:           483        474          8          0         12        394
-/+ buffers/cache:         68        415
Swap:         1023          0       1023
```

From [Linux Add a Swap File - HowTo - nixCraft](https://www.cyberciti.biz/faq/linux-add-a-swap-file-howto/)

## Installationn de Docker

Le projet de demo étant prêt pour être lancer avec docker-compose, il faut installer Docker et docker-compose

```bash
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user
```

Pour valider l'installation, on se login/logout de l'instance et on peut lancer un `docker info`.

Ne reste plus qu'à installer docker-compose :

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Autres utilitaires

Pour simplifier le gestion de ce serveur de demo, j'installe un minimum d'outils de monitoring: htop et ctop.

```bash
sudo yum install -y htop
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.1/ctop-0.7.1-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop
```

Et pour récupperer mon projet sur Github, j'installe git

```bash
sudo yum install -y git 
```

## Tadam

Encore un fois, le projet est conçu pour fonctionner dans docker compose, ne me reste donc plus qu'à faire : 

```bash
git clone https://monprojet.git
cd monprojet
make install
make run
```

Tadam, 20 min, démo en route
