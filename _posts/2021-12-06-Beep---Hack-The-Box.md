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
ping -c 1 10.10.10.247
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/2.png)

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

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/3.png)

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```
nmap -p- --open -T5 -v -n 10.10.10.247
```

Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

``` 
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.247
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
nmap -sC -sV -p 2222,42135,42607,59777 10.10.10.247
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* p - Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior)

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que nos encontramos frente a un teléfono móvil, y nuestra primera gran pista para la siguiente fase es el puerto `42135`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/4.png)

### [](#header-3)Fase De Explotación

Para explotar el servicio `ES File Explorer`, empezaremos buscando algun exploit que se encuentre en _Exploit Database_, para ello utilizaremos _SearchSploit_ para poder seguir trabajando desde nuestra terminal.

```
searchsploit ES File Explorer                               
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/5.png)

En este caso _SearchSploit_ no mostró nada interesante, sin embargo, si revisamos manualmente en la página de _Exploit Database_, podemos encontrar un script que nos permite leer archivos alojados en el servicio de `ES File Explorer` de versión `4.1.9.7.4`, por esta razón es importante no quedarnos conformes únicamente con el primer resultado que encontremos.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/6.png)

Sin embargo, tampoco será este el script con el que trabajaremos; en esta ocasión estaremos utilizando un proyecto de _GitHub_ del usuario _fs0c131y_, este se llama [ESFileExplorerOpenPortVuln](https://github.com/fs0c131y/ESFileExplorerOpenPortVuln).

Para empezar a trabajar con este repositorio bastará con clonarlo en nuestra máquina.

``` 
git clone https://github.com/fs0c131y/ESFileExplorerOpenPortVuln
```

Una vez lo tengamos descargado, podemos empezar a revisar que información se alojaba en el servicio `ES File Explorer`.

Después de estar listando el contenido almacenado en el teléfono móvil, encontramos entre las fotografías, una llamada `creds`, lo cual nos hace pensar a que se refiere a credenciales con las que posteriormente autenticarnos.

```
python3 poc.py --cmd listPics --ip 10.10.10.247                               
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/7.png)

Por lo que procedemos a descargar esta imagen.

```  
python3 poc.py --get-file /storage/emulated/0/DCIM/creds.jpg --ip 10.10.10.247 
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/8.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/9.png)

Si recordamos, otro servicio que detectamos con _Nmap_, fue el servicio _SSH_ en el puerto `2222`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/10.png)

Por lo que procederemos a autenticarnos con las credenciales encontradas:

```  
ssh kristi@10.10.10.247 -p 2222
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/11.png)

Una vez dentro de la máquina, procederemos a buscar la primera flag. Por lo que buscaremos el archivo `user.txt` dentro de todo el sistema.

```
echo **/*user.txt*
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/12.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/13.png)

Podemos ver que en efecto esta es la flag del usuario con bajos privilegios.

Lo más común sería utilizar `find . -name user.txt` (y en este caso, redirigir todo el _stderr_ o _Standard Error_ hacia el `/dev/null`), sin embargo no conseguimos ningún resultado en esta máquina, por lo que resulta conveniente conocer otros métodos para realizar el mismo proceso.

### [](#header-3)Escalada De Privilegios

Para poder conseguir la siguiente flag (la del usuario con máximos privilegios), tenemos que percatarnos que la máquina tiene más puertos abiertos que los registrados con _Nmap_, a estos se los conoce como _puertos internos_.

```  
netstat -nlpt
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/14.png)

Si nos percatamos, la máquina utiliza el puerto `5555` para realizar varios procesos relacionados con _Android_; esto tiene sentido ya que algunos dispositivos _Android_ tienen este puerto abierto para realizar procesos relacionados con el `Android Debug Bridge` o `ADB` por sus siglas en inglés. 

Por lo que, lo que vamos a realizar es un `remote port forwarding`, para posteriormente, con el servicio `ADB` conseguir una shell de máximos privilegios con la que poder migrar al usario root y conseguir la última flag. 

En caso de no contar con el servicio `ADB` instalado, bastará con realizar lo siguiente:

```
sudo apt install adb
```

Una vez instalado el servicio `ADB`, podemos pasar a conseguir una shell con máximos privilegios dentro del dispositivo.

```
ssh -L 5555:localhost:5555 kristi@10.10.10.247 -p 2222
``` 

```
adb start-server
adb connect localhost:5555
adb devices
adb -s localhost:5555 shell
su root
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/15.png)

Una vez hemos migrado al usuario _root_, simplemente tendremos que buscar la respectiva flag.

```
echo **/*root.txt*
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore-Hack-The-Box/16.png)
