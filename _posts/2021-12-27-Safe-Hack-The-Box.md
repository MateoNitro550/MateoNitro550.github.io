---
title: Safe - Hack The Box
published: true
---

Hoy vamos a resolver la máquina _Safe_ de _Hack The Box_. Es una máquina _Linux_ de nivel de dificultad media en la intrusión, y media en la escalada de privilegios según figura en la plataforma. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.147
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/2.png)

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `63`, por lo que podemos intuir que estamos ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.147 -R                               
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/3.png)

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.147
```

Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash 
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.147
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:

* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat`
* v - _Verbose_, reporta lo encontrado por consola
* n - No aplicar _resolución DNS_
* sS - Escaneo _TCP SYN_
* min-rate - Emitir paquetes no más lentos que \<valor\> por segundo
* vvv - Triple _verbose_, para obtener mayor información por consola
* Pn - No aplicar _host discovery_

Una vez hemos detectado los puertos que se encuentran abiertos en el activo, podemos pasar a determinar la versión y servicios que corren bajo estos puertos.

```bash
nmap -sC -sV -p 22,80,1337 10.10.10.147
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* p - Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior)

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abierto un puerto relacionado con `HTTP`; asimismo, encontramos abierto el puerto `1337`, relacionado con el protocolo `WASTE`, el cual permite el intercambio de archivos de forma cifrada.

Debido a que la máquina cuenta con el puerto `80` abierto, podríamos intentar aplicar `fuzzing`, no obstante, no vamos a encontrar nada interesante. 

Lo siguiente que podemos hacer es determinar ante que nos estamos enfrentando, para ello podemos hacer uso de `WhatWeb`, herramienta que se encarga de identificar que tecnologías web se están empleando, véase gestores de contenido (CMS), librerias o plugins, o finalmente el sistema operativo que se está utilizando para alojar el servidor web.

```
whatweb http://10.10.10.147
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/4.png)

Como podemos observar, no hay nada especialmente relevante a excepción del título de la página, el cual es el mensaje por defecto que aparece cuando montamos una página web haciendo uso del servidor `Apache`, por lo que podemos irnos haciendo a la idea, de que la entrada a la máquina, no será vía web.

En vista de que ya no nos es posible trabajar desde la terminal, tendremos que visitar estas páginas desde nuestro navegador.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/5.png)

En efecto, lo primero que vemos al abrir la página web, es la página por defecto que viene cuando montamos una página web mediante el servidor `Apache`, por lo que, podemos inspeccionar el código fuente, en busca de alguna pista; para verlo de manera más cómoda podemos hacer `Ctrl + U`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/6.png)

Si nos percatamos, en las primeras líneas del código fuente, hay un comentario que nos menciona que `myapp`, alojado en el puerto `1337`, lo podemos descargar; para ello, podemos intentar añadir `/myapp`, al final del url.

_Los comentarios en HTML, siempre tienen la siguiente estructura:_

```
<!-- Este es un comentario a modo de prueba -->
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/7.png)

Al añadir `/myapp`, al final del url, se nos va a descargar un archivo que lleva por nombre, `myapp`, el cual vamos a empezar a analizar. 

### [](#header-3)Fase De Explotación

Lo primero que debemos hacer, es saber que es `myapp`, para ello podemos usar el comando `file`.

```
file myapp
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/8.png)

Nos damos cuenta de que el archivo `myapp`, es un binario, por lo que procederemos a ejecutarlo para saber qué hace:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/9.png)

Al ejecutar el binario `myapp`, nos reporta por consola la hora actual, además de imprimir el mismo mensaje que introduzcamos; esto no nos es de ayuda, por lo que podríamos intentar extraer las cadenas de caracteres que se encuentran dentro del binario con el comando `strings`, sin embargo, no hay nada interesante.

Lo siguiente que podríamos intentar, sería realizar un `Buffer Overflow`, para ello, cuándo el binario `myapp`, nos pregunte por una cadena de caracteres, debemos ingresar una que sea bastante larga.

Una manera rápida con la cual podemos conseguir cadenas de caracteres cuan largas queramos, sería haciendo uso de `Python`.

```bash
python -c 'print "A"*365'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/10.png)

Si nos percatamos, al introducir nuestra cadena de _365 letras A_, el binario `myapp`, deja de funcionar como debería, esto se debe a un `Segmentation Fault` (_Fallo de Segmentación_), los cuales se dan cuando 'algo', intenta acceder a una parte de la memoria a la que no debería; es importante mencionar que no estamos sobrescribiendo la memoria, estamos sobrescribiendo la dirección de retorno con las _letras A_ que desbordan el buffer, nuestro 'algo'. 



### [](#header-3)Escalada De Privilegios

DEF
