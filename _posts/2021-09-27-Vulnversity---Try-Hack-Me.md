---
title: Vulnversity - Try Hack Me
published: true
---

El día de hoy vamos a resolver la máquina _Vulnversity_ de _Try Hack Me_. Esta es una máquina fácil tanto en la intrusión como en la escalada de privilegios, por lo que no supondrá ninguna complicación a la hora de realizarla.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-27-Vulnversity---Try-Hack-Me/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo. Es importante aclarar que así como menciona la plataforma de _Try Hack Me_, existen diversos [cheatsheets](https://www.stationx.net/nmap-cheat-sheet/) que podemos encontrar en internet, cuyo principal objetivo es darnos a conocer cuales son todas las posiblidades que nos ofrece la herramienta.

No obstante, recordemos que varias herramientas cuentan ya sea con un `manual` o con un comando `--help`.

```
man nmap
```

```
nmap --help
```
