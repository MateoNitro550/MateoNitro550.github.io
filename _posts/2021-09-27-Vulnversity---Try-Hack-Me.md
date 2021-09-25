---
title: Vulnversity - Try Hack Me
published: true
---

El día de hoy vamos a resolver la máquina _Vulnversity_ de _Try Hack Me_. Esta es una máquina fácil tanto en la intrusión como en la escalada de privilegios, por lo que no supondrá ninguna complicación a la hora de realizarla.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-27-Vulnversity---Try-Hack-Me/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo. Es importante aclarar que así como menciona la plataforma de _Try Hack Me_, existen diversos [cheatsheets](https://www.stationx.net/nmap-cheat-sheet/) que podemos encontrar en internet, cuyo principal objetivo es darnos a conocer cuales son todas las posiblidades que nos ofrece la herramienta.

No obstante, recordemos que varias herramientas por defecto tienen incluidas un `manual` o con un comando `--help`.

```
man nmap
```

```
nmap --help
```

Entre las preguntas que nos realiza la plataforma en esta primera fase, se encuentra:

* ¿Cuántos puertos abiertos existen?
* ¿Qué sistema operativo tiene la máquina ante la que nos estamos enfrentando?
* ¿En qué puerto está corriendo el servidor web?
* ¿Qué versión de squid proxy está corriendo en la máquina?

Todas estas preguntas son fáciles de responder si realizamos un buen escaneo con _Nmap_. 

Para determinar que puertos están abiertos podemos realizar lo siguiente:
  
```
nmap -p- --open -T5 -v -n <dirección IP> -oG allPorts
```
 
Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:
  
``` 
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn <dirección IP> -oG allPorts
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:
  
* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido  ", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat`
* v - _Verbose_, reporta lo encontrado por consola
* n - No aplicar _resolución DNS_
* sS - Escaneo _TCP SYN_
* min-rate - Emitir paquetes no más lentos que -valor- por segundo
* vvv - Triple _verbose_, para obtener mayor información por consola
* Pn - No aplicar _host discovery_
* oG - Exportar el escaneo en formato "_grepeable_"

Para determinar la versión y servicios que corren bajo estos puertos podemos realizar lo siguiente:

```  
nmap -sC -sV -p 21,22,139,445,3128,3333 <dirección IP> -oN targeted
```
  
A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* p - Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior)
* oN - Exportar el escaneo en formato _Nmap_

Con estos dos escaneos bastará para responder a las preguntas planteadas con anterioridad, sin embargo nos quedan dos preguntas más, las cuales son:

* ¿Cuántos puertos se escanearán si utilizamos el parámetro -p-400?
* Utilizando el parámetro -n, ¿qué no se está resolviendo?

Para responder a estas dos preguntas bastará con haber leído el `manual` de _Nmap_, o bien, haber utilizado su parámetro `--help`. En este caso, si colocamos un número después de `-p-`, se escaneará tantos puertos hayamos indicado; y en el caso del parámetro `-n`, no se aplicará resolución DNS.

Una vez hemos determinado que puertos están abiertos, así como identificado la versión y servicios que corren en el activo, otro paso importante dentro de la fase de reconocimiento, es el _fuzzing_; cabe aclarar que este solo se realiza cuando la máquina víctima está corriendo un servidor web.

_Try Hack Me_ nos recomienda utilizar _GoBuster_, sin embargo, prefiero personalmente el uso de _Wfuzz_; en caso de no contar con esta herramienta instalada, bastará con realizar lo siguiente:
  
```
sudo apt install wfuzz
```

Para pasar a la fase de explotación, lo que nos solicita la plataforma es encontrar una ruta potencial de la página web, que nos permita una subida de archivos, para lo cual debemos de _fuzzear_ la página web, para ello realizaremos lo siguiente:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-27-Vulnversity---Try-Hack-Me/2.png)

Como podemos observar, existen cinco direcciones a las cuales podemos acceder, sin embargo, solamente una de ellas llama nuestra atención, la dirección `internal`, ya que en _images_, _css_, _js_ y _fonts_ parece ser donde está alojado el contenido de la página web. Y en efecto, al entrar en la dirección `internal`, podemos observar que tenemos un panel que nos permite realizar una subida de archivos, con la cual nos entablaremos una _reverse shell_.


![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-27-Vulnversity---Try-Hack-Me/3.png)

### [](#header-3)Fase De Explotación

Al encontrarnos una ruta potencial que nos permite una subida de archivos, lo primero que vamos a intentar es entablarnos una _reverse shell_; podemos descargar una [aquí](https://pentestmonkey.net/tools/web-shells/php-reverse-shell). Una vez la hayamos descargado, tenemos que modificar un valor, el de la _dirección IP_, y si queremos, el valor del _puerto_ también.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-27-Vulnversity---Try-Hack-Me/4.png)

Sin embargo, cuando intentamos subir nuestra _reverse shell_, nos aparecerá un mensaje indicándonos que la extensión de nuestro archivo no es permitida.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/asse  ts/2021-09-27-Vulnversity---Try-Hack-Me/5.png)

Por lo que tendremos que buscar una extensión que no nos de problema alguno. Si realizaramos este proceso de forma manual, sería algo bastante tedioso, por lo que vamos a utilizar _Burpsuite_ para poder realizar una ataque de tipo _Sniper_.


