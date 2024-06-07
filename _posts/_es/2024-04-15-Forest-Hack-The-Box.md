---
title: Forest - Hack The Box
categories: [Windows,]
published: true
lang: es
---

El día de hoy vamos a resolver la máquina _Forest_ de _Hack The Box_. Es una máquina _Windows_ de nivel de dificultad medio en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `127`, por lo que podemos intuir que estamos ante una máquina _Windows_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `127` y no `128` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.161 -R
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/3.png){:class="blog-image" onclick="expandImage(this)"}

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.161
```

Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.161
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
nmap -sC -sV -p 53,88,135,139,389,445,464,593,636,3268,3269,5985,9389,47001,49664,49665,49666,49667,49671,49676,49677,49684,49706,49957 10.10.10.161
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `DNS` (53), `Kerberos authentication` (88), `RPC` (135), `NetBIOS` (139), `LDAP` (389), `SMB` (445) y `WinRM` (5985). Por lo que podemos intuir nos estamos enfrentando ante un _Domain Controller_ y nos encontramos en un entorno de _Active Directory (AD)_.

Lo primero que haremos será comprobar si la máquina cuenta con recursos compartidos a nivel de red a través del uso de un _null session_, pues no contamos con credenciales; para ello podemos hacer uso de herramientas como _SMBMap_ o _smbclient_, no obstante, no podremos listar nada.

```bash
smbmap -H 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

```bash
smbclient -N -L 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

Lo siguiente que podemos probar es enumerar el protocolo `LDAP` para obtener información sobre usuarios, grupos u otros objetos en el entorno. Para realizar esto, utilizaremos la herramienta `ldapsearch`.

Nuestro primer objetivo será obtener una porción del _Distinguished Name (DN)_, una cadena única que identifica de manera exclusiva las entradas en el _Directory Information Tree (DIT)_. Nos centraremos en identificar la porción _Domain Component (DC)_, ya que este elemento representa el nivel más alto en la jerarquía del _DIT_ y servirá como base para nuestras consultas.

Utilizaremos el siguiente comando:

```bash
ldapsearch -x -h 10.10.10.161 -s base namingcontexts
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

Una vez obtenemos el _DN_, podemos empezar a realizar consultas específicas o bien, podríamos listar toda la información del _LDAP_ con el siguiente comando:

```bash
ldapsearch -x -h 10.10.10.161 -b "dc=htb,dc=local"
```

| Parámetro | Explicación |
|:----------|:------------|
| \-x | Simple authentication |
| \-h | Host |
| \-s | Search scope |
| \-b | DN base para la búsqueda |

Podemos comenzar buscando entradas que contengan la clase de objeto _user_ para listar usuarios del sistema.

```bash
ldapsearch -x -h 10.10.10.161 -b "dc=htb,dc=local" '(objectClass=user)'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

Podemos observar que en los campos _sAMAccountName_ de cada usuario, encontramos sus respectivos nombres de usuario. Teniendo un listado potencial de usuarios, podemos pensar en realizar un ataque `AS-REP Roasting`.

El `AS-REP Roasting` es un tipo de ataque contra el protocolo de autenticación `Kerberos` en entornos de _Active Directory_. Consiste en solicitar el `Ticket de Servicio de Autenticación (AS-REQ)` para un usuario sin autenticación previa, y luego intentar crackear el `Ticket de Respuesta (AS-REP)` offline para obtener la contraseña del usuario.

En lugar de buscar usuario por usuario manualmente, podemos mediante el uso de un one-liner filtrar y parsear los usuarios y guardarlos en un archivo.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

Adicional podemos borrar las dos primeras, las 3 siguientes por el AD, las SM y las Mail por Microsoft Exchange y nos quedamos con 5 usuarios.

Para utilizar el imacket necesitamos editar el /etc/hosts para que el dominio que nos sacamos con nmap nos resuelva a la ip.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

corramos el comando:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

vemos que la vaina no funca. ok, sin problema.

pasamos al rpc.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

aja hay un usuario nuevo.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/20.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/21.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/22.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/23.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/24.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/25.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/26.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/27.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/28.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/29.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/30.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/31.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/32.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/33.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/34.png){:class="blog-image" onclick="expandImage(this)"}
