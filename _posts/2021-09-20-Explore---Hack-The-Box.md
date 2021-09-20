---
title: Explore - Hack The Box
published: true
---

En esta ocasión vamos a estar resolviendo la máquina _Explore_ de _Hack The Box_. Es una máquina _Android_ de nivel de dificultad fácil en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/2.png)

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar frente a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_, en este caso el valor del _TTL_ de la máquina es `63`, por lo que podemos intuir que nos estamos enfrentado ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como nos indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/3.png)

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo; para ello tenemos dos posibilidades, una de ellas en caso de que nuestro escaneo tarde demasiado en completar.

```
nmap -p- --open -T5 -v -n 10.10.10.247 -oG allPorts
```

```  
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.247 -oG allPorts
```

Aquí se explican los parámetros utilizados en el escaneo con _Nmap_:

* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un estado controlado y aquí somos todos `White Hat`
* v - Verbose, reporta lo encontrado por consola
* n - No aplicar resolución DNS
* sS - Escaneo TCP SYN
* min-rate - Emitir paquetes no más lentos que -valor- por segundo
* vvv - Triple verbose, para obtener mayor información por consola
* Pn - No aplicar host discovery
* oG - Exportar el escaneo en formato _"grepeable"_

Una vez hemos detectado los puertos que se encuentran abiertos en el activo, podemos pasar a determinar la versión y servicios que corren bajo estos puertos.

```  
nmap -sC -sV -p 2222,42135,42607,59777 10.10.10.247 -oN targeted
```

Aquí se explican los parámetros utilizados en el escaneo con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* oN - Exportar el escaneo en formato _Nmap_

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que nos encontramos frente a un teléfono móvil, y nuestra primera gran pista para la siguiente fase es el puerto `42135`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/4.png)

### [](#header-3)Fase De Explotación
