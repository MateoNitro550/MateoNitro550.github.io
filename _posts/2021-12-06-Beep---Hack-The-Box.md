---
title: Beep - Hack The Box
published: true
---

El día de hoy vamos a resolver la máquina _Beep_ de _Hack The Box_. Es una máquina _Linux_ de nivel de dificultad media en la intrusión, y media en la escalada de privilegios según figura en la plataforma. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/1.png)

Esta máquina nos permite realizar, tanto la intrusión, como la escalada de privilegios, de distintas maneras, por lo que es genial para aprender algunas técnicas de explotación, las cuales vamos a cubrir.

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.7
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/2.png)

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `63`, por lo que podemos intuir que estamos ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.247 -R                               
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/3.png)

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```
nmap -p- --open -T5 -v -n 10.10.10.7
```

Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

``` 
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.7
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:

* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat`
* v - _Verbose_, reporta lo encontrado por consola
* n - No aplicar _resolución DNS_
* sS - Escaneo _TCP SYN_
* min-rate - Emitir paquetes no más lentos que <<valor>> por segundo
* vvv - Triple _verbose_, para obtener mayor información por consola
* Pn - No aplicar _host discovery_

Una vez hemos detectado los puertos que se encuentran abiertos en el activo, podemos pasar a determinar la versión y servicios que corren bajo estos puertos.

```  
nmap -sC -sV -p 22,25,80,110,111,143,443,878,993,995,3306,4190,4445,4559,5038,10000 10.10.10.7
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* p - Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior)

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos algunos puertos relacionados con `HTTP` y `HTTPS`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/4.png)

Debido a que la máquina cuenta con estos puertos abiertos, podríamos intentar aplicar `fuzzing`, no obstante, no vamos a encontrar nada interesante. 

Lo siguiente que podemos hacer es determinar ante que nos estamos enfrentando, para ello podemos hacer uso de `WhatWeb`, herramienta que se encarga de identificar que tecnologías web se están empleando, véase gestores de contenido (CMS), librerias o plugins, o finalmente el sistema operativo que se está utilizando para alojar el servidor web.

```
whatweb http://10.10.10.7
```

```
whatweb https://10.10.10.7
```

```
whatweb https://10.10.10.7:10000
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/5.png)

Como podemos observar, no hay nada especialmente relevante, a excepción de ese error relacionado con _SSL_ que aparece cuando visitamos la página a través del puerto `443`, el cual no es nada grave, y de hecho lo veremos en un momento. 

En vista de que ya no nos es posible trabajar desde la terminal, tendremos que visitar estas páginas desde nuestro navegador.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/6.png)

Vemos que al abrir la primera página desde nuestro navegador (y por consiguiente la segunda, pues se está aplicando un redirect como pudimos ver en lo reportado por `WhatWeb`), nos salta un aviso de que la conexión no es segura, y esto se debe a que el _certificado SSL_ que se está empleando, es autofirmado, por lo que se lo considera inseguro. En esta ocasión, y como sabemos que la página web pertenece a _HackTheBox_, haremos caso omiso a la advertencia y procederemos a la página web.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/7.png)

Lo primero que llama nuestra atención es `Elastix`, el cual es un software encargado de unificar servicios PBX IP, correo electrónico, mensajería instantánea, fax entre otros, el cual va bastante de la mano con `Asterisk`.

Respecto a la tercera página web, el navegador nuevamente nos avisará del _certificado SSL_ autofirmado, aviso, el cual una vez más obviaremos.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/8.png)

Una vez dentro, 

### [](#header-3)Fase De Explotación

Como mencioné en un inicio, la máquina _Beep_ cuenta con varios vectores para realizar la fase de explotación; de hecho, para dos de ellos ni siquiera hace falta la fase de escalada de privilegios.

### [](#header-4)Fase De Explotación - Local File Inclusion

ABC

### [](#header-4)Fase De Explotación - Shellshock

DEF

### [](#header-4)Fase De Explotación - File Upload Bypass

GHI

### [](#header-3)Escalada De Privilegios

JKL
