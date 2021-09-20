---
title: Explore - Hack The Box
published: true
---

En esta ocasión vamos a estar resolviendo la máquina _Explore_ de _Hack The Box_. Es una máquina _Android_ de nivel de dificultad fácil en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/2.png)

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_, en este caso el valor del _TTL_ de la máquina es `63`, por lo que podemos intuir que estamos ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/3.png)

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo, para ello podemos realizar lo siguiente:

```
nmap -p- --open -T5 -v -n 10.10.10.247 -oG allPorts
```

Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```  
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.247 -oG allPorts
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:

* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat`
* v - _Verbose_, reporta lo encontrado por consola
* n - No aplicar _resolución DNS_
* sS - Escaneo _TCP SYN_
* min-rate - Emitir paquetes no más lentos que -valor- por segundo
* vvv - Triple _verbose_, para obtener mayor información por consola
* Pn - No aplicar _host discovery_
* oG - Exportar el escaneo en formato "_grepeable_"

Una vez hemos detectado los puertos que se encuentran abiertos en el activo, podemos pasar a determinar la versión y servicios que corren bajo estos puertos.

```  
nmap -sC -sV -p 2222,42135,42607,59777 10.10.10.247 -oN targeted
```

A continuación se explican los parámetros utilizados en el escaneo versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* oN - Exportar el escaneo en formato _Nmap_

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que nos encontramos frente a un teléfono móvil, y nuestra primera gran pista para la siguiente fase es el puerto `42135`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/4.png)

### [](#header-3)Fase De Explotación

Para explotar el servicio `ES File Explorer`, empezaremos buscando algun _exploit_ que se encuentre en _Exploit Database_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/5.png)

En este caso _SearchSploit_ no mostró nada interesante, sin embargo, si revisamos manualmente en la página de _Exploit Database_, podemos encontrar un script que nos permite leer archivos alojados en el servicio de `ES File Explorer` de versión 4.1.9.7.4, por esta razón es importante no quedarnos conformes únicamente con el primer resultado.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/6.png)

Sin embargo, tampoco será este el script con el que trabajaremos; en esta ocasión estaremos utilizando un proyecto de _GitHub_ del usuario _fs0c131y_, este se llama [ESFileExplorerOpenPortVuln](https://github.com/fs0c131y/ESFileExplorerOpenPortVuln).

Para empezar a trabajar con este repositorio bastará con clonarlo en nuestra máquina.

```  
git clone https://github.com/fs0c131y/ESFileExplorerOpenPortVuln
```

Una vez lo tengamos descargado, podemos empezar a revisar que información se alojaba en el servicio `ES File Explorer`.

Después de un rato estando listando el contenido almacenado en el teléfono móvil, encontramos entre las fotografías, una llamada `creds`, lo cual nos hace pensar a que se refiere a credenciales con las que posteriormente autenticarnos.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/7.png)

Por lo que procedemos a descargar esta imagen.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/8.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/9.png)

Si recordamos, otro servicio que detectamos con _Nmap_, fue el servicio _SSH_ en el puerto 2222.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/10.png)

Por lo que procederemos a autenticarnos con las credenciales encontradas:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/11.png)
