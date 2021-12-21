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

Como podemos observar, no hay nada especialmente relevante, a excepción de ese error relacionado con _SSL_ que aparece cuando visitamos la página a través del protocolo `HTTPS`, el cual no es nada grave, y de hecho lo veremos en un momento. 

En vista de que ya no nos es posible trabajar desde la terminal, tendremos que visitar estas páginas desde nuestro navegador.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/6.png)

Vemos que al abrir la primera página desde nuestro navegador (y por consiguiente la segunda, pues se está aplicando un redirect como pudimos ver en lo reportado por `WhatWeb`), nos salta un aviso de que la conexión no es segura, y esto se debe a que el _certificado SSL_ que se está empleando, es autofirmado, por lo que se lo considera inseguro. En esta ocasión, y como sabemos que la página web pertenece a _HackTheBox_, haremos caso omiso a la advertencia y procederemos a la página web.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/7.png)

Lo primero que llama nuestra atención es `Elastix`, el cual es un software encargado de unificar servicios PBX IP, correo electrónico, mensajería instantánea, fax entre otros, el cual va bastante de la mano con `Asterisk`.

Respecto a la tercera página web, el navegador nuevamente nos avisará del _certificado SSL_ autofirmado, aviso, el cual una vez más obviaremos.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/8.png)

Una vez dentro, lo primero que vemos es un panel que nos pide autenticar para tener acceso a `Webmin`, una herramienta que permite la administración de servicios basados en _Unix_. 

### [](#header-3)Fase De Explotación

Como mencioné en un inicio, la máquina _Beep_ cuenta con varios vectores para realizar la fase de explotación; de hecho, para dos de ellos ni siquiera hace falta la escalada de privilegios.

### [](#header-4)Fase De Explotación - Local File Inclusion

Lo primero que se nos puede ocurrir a la hora de encontrar un panel de login, sería probar contraseñas por defecto (un error bastante común aún hoy en día). Sin embargo ninguna de las [siguientes](https://www.elastix.org/community/threads/default-passwords-not-password.8416/) credenciales nos es de ayuda para logearnos en el servicio de `Elastix`

La siguiente idea que podemos probar, sería buscar algún tipo de _exploit_ para el servicio `Elastix`; para ello utilizaremos _SearchSploit_.

```
searchsploit Elastix
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/9.png)

En este caso _SearchSploit_ nos muestra algunos _exploits_ interesantes, sin embargo nos vamos a quedar con el que nos permite realizar un [_Local File Inclusion (LFI)_](https://mateonitro550.github.io/Local-File-Inclusion-(LFI)), vulnerabilidad que ya revisamos.

En este caso no nos haría falta descargar el _exploit_, ya que lo más probable es que nos indique en que ruta podemos aplicar el _LFI_.

```
searchsploit -x php/webapps/37637.pl
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/10.png)

En efecto, pero antes de intentar explotar este _LFI_, debemos confirmar si en primer lugar existe la primera ruta, `/vtigercrm/`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/11.png)

Una vez confirmamos que la ruta existe, podemos pasar a explotar el _LFI_. Si nos percatamos, se está haciendo uso de un _null byte_, así como de varios _directory path traversal_, esto con el fin de leer el archivo `/etc/amportal.conf`, pero perfectamente podríamos listar cualquier otro archivo del sistema.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/12.png)

Leer esto así es un poco complicado, así que podríamos hacer `Ctrl + U`, para verlo de mejor manera.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/13.png)

El archivo `/etc/amportal.conf`, como su nombre mismo indica, es un archivo de configuración para el portal de gestión de `Asterisk`.

Si recordamos, otro servicio que detectamos con _Nmap_, fue el servicio _SSH_ en el puerto `22`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/14.png)

Por lo que procederemos a autenticarnos con las credenciales encontradas:

```
ssh root@10.10.10.7
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/15.png)

Al intentar conectarnos por _SSH_, vemos que la conexión no se puede establecer debido a que no existe un algoritmo de encriptación en común entre la máquina víctima, y nuestra máquina de atacante. Para solucionar este problema, debemos forzar a nuestra máquina usar alguno de los algoritmos que se nos presenta, pese a ser considerados como menos seguros.

```
ssh -o KexAlgorithms=diffie-hellman-group-exchange-sha1 root@10.10.10.7
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/16.png)

Al habernos conectado a la máquina directamente como root, no es necesario realizar la escalada de privilegios, por lo que podríamos listar sin ningún problema tanto la flag del usuario con bajos privilegios, como la del usuario con máximos privilegios.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-06-Beep-Hack-The-Box/17.png)

### [](#header-4)Fase De Explotación - Shellshock

[shellshock](https://mateonitro550.github.io/Shellshock)

Al igual que intentamos probar contraseñas por defecto en el panel de login del servicio `Elastix`, podemos hacer lo mismo en el panel de autenticación del servicio `Webmin`, pero al igual que ocurrió antes, las [siguientes](https://help.eset.com/era_deploy_va/64/en-US/index.html?webmin.htm) credenciales no nos permiten ingresar.

### [](#header-4)Fase De Explotación - File Upload Bypass

GHI

### [](#header-3)Escalada De Privilegios

JKL
