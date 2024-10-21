---
title: Devel - Hack The Box
categories: []
published: true
lang: es
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

En esta ocasión vamos a resolver la máquina _Devel_ de _Hack The Box_. Es una máquina _Windows_ de nivel de dificultad fácil tanto en la intrusión como en la escalada de privilegios.

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.5
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `127`, por lo que podemos intuir que estamos ante una máquina _Windows_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `127` y no `128` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un nodo intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.5 -R
``` 

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/3a.png){:class="blog-image" onclick="expandImage(this)"}

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.5
```

En caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.5
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
nmap -sC -sV -p 21,80 10.10.10.5
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `HTTP` y `FTP` (File Transfer Protocol).

### [](#header-3)Fase De Explotación

Podemos empezar por enumerar el servicio `HTTP`. Para ello, podemos hacer uso de `WhatWeb`, una herramienta que se encarga de identificar las tecnologías web que se están utilizando. Esto incluye gestores de contenido (CMS), librerías, plugins, o incluso el sistema operativo en el que se está alojando el servidor web.

```bash
whatweb http://10.10.10.5
```

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

No hay nada que llame especialmente nuestra atención, salvo que la página está montada con `IIS` (Internet Information Services), un servidor web desarrollado por _Microsoft_ para alojar sitios en sistemas _Windows_, así como que la página parece estar bajo construcción.

Dado que no podemos obtener más información útil desde la terminal, tendremos que visitar la página desde nuestro navegador. Únicamente veremos el logo de `IIS` versión 7, por lo que no parece haber mucho que hacer aquí de momento. 

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

Lo siguiente que podemos hacer es enumerar el servicio `FTP`. Para esto, utilizaremos un _null session_, ya que no contamos con credenciales.

```bash
ftp anonymous@10.10.10.5
```

Al conectarnos, podemos observar lo que parece ser la estructura de archivos del sitio web alojado en `IIS`. Encontramos un directorio `aspnet_client` y archivos como `iisstart.htm` y `welcome.png`. 

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

Esto lo podemos corroborar descargando alguno de estos archivos y visualizándolos en nuestro equipo. Podemos, por ejemplo, probar con la imagen `welcome.png`. Dado que se trata de un archivo que no es de texto, cambiaremos el modo de transferencia a _binary_, lo que garantiza que el archivo se transfiera sin modificaciones, manteniendo su integridad byte por byte. 

```bash
binary
get welcome.png
```

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

Confirmamos que estamos frente a la misma imagen que habíamos visto desde nuestro navegador,  lo que sugiere una posible vía de subida de archivos al servidor web. A modo de prueba, podemos subir un archivo a través del `FTP` y ver si se muestra en el sitio web. En mi caso, probé con una imagen.

```bash
put <nombreArchivo>
```

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

Vemos que la imagen se muestra correctamente en la página web, así que podemos probar subir una _reverse shell_ al servidor. Algo que debemos tener en cuenta es que `IIS` utiliza `ASP`/`ASP.NET` para ejecutar scripts del lado del servidor. `ASP.NET` es la versión más moderna del framework `ASP` y se basa en el framework `.NET`, que es la plataforma de desarrollo de _Microsoft_ para crear aplicaciones. Por lo tanto, _la reverse shell_ que subiremos deberá estar en formato `.aspx` para que el servidor la interprete y ejecute correctamente.

Dicho esto, podríamos generar la _reverse shell_ con `MSFvenom` o buscar una disponible públicamente en GitHub. En mi caso, utilizaré la [shell](https://github.com/borjmz/aspx-reverse-shell/blob/master/shell.aspx) del usuario `borjmz`. Solo deberemos cambiar nuestra IP y puerto donde se indica, y luego subir la _shell_.

```bash
put shell.aspx
```

Podemos dirigirnos a [http://10.10.10.5/shell.aspx](http://10.10.10.5/shell.aspx) o, desde la propia consola, ejecutarla con:

```bash
curl http://10.10.10.5/shell.aspx
```

De todos modos, conseguiremos una shell dentro de la máquina víctima como el usuario `IIS APPPOOL\web`, por lo que tendremos que escalar privilegios.

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Escalada De Privilegios

Podemos comenzar enumerando el sistema operativo utilizando `systeminfo` para conocer su versión y verificar si tiene parches aplicados.

```bash
systeminfo
```

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

Encontramos que la versión del sistema operativo es `6.1.7600 Build 7600`, y no tiene ningún parche aplicado. Al buscar más información sobre esta versión, descubrimos que es vulnerable a `MS11-046`, una vulnerabilidad causada por el _Microsoft Windows Ancillary Function Driver_ (_AFD.sys_), que al ejecutarse en modo kernel privilegiado, no valida correctamente el input proporcionado por usuarios de bajos privilegios.

Podemos buscar en línea algún exploit para aprovechar esta vulnerabilidad. Hay una versión ya compilada que es la que [usaremos](https://www.exploit-db.com/exploits/40564). Recordemos que tenemos una vía potencial para subir archivos a través del servicio `FTP`, y podemos aprovecharla buscando en qué ruta se encuentran los archivos que vimos anteriormente. Por ejemplo, podemos realizar una búsqueda recursiva en el sistema para verificar dónde está almacenada la imagen `welcome.png` que habíamos visualizado previamente.

```bash
dir /s welcome.png
```

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

Sabiendo que los archivos se encuentran en la ruta `C:\inetpub\wwwroot`, podemos subir el exploit mediante `FTP`, y una vez que el archivo esté dentro de la máquina víctima, podremos ejecutarlo directamente desde ahí.

```bash
binary
put MS11-046.exe
```

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

Al ejecutarlo, obtendremos privilegios elevados, convirtiéndonos en `NT AUTHORITY\SYSTEM`, lo que nos permitirá listar las flags de los dos usuarios en el sistema.

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}
