---
title: Blue - Practical Ethical Hacking
categories: [Windows]
published: true
lang: es
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/1.png){:class="blog-image" onclick="expandImage(this)"}

Hoy vamos a resolver la máquina _Blue_ del curso [Practical Ethical Hacking](https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course) de TCM Security. Esta máquina forma parte del capstone intermedio del curso, y en este write-up me enfocaré en cubrir varias técnicas de explotación y escalada de privilegios, desde el reconocimiento inicial hasta la obtención de privilegios de administrador.

El objetivo de este artículo es reforzar lo aprendido hasta ahora, pero también ofrecer una guía más completa, explorando distintos enfoques y metodologías que podrían ser útiles para quienes buscan profundizar más en el proceso.

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 <IP del host>
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

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

Rápidamente podemos determinar que estamos frente a un _Windows 7 Ultimate 7601 Service Pack 1_ de _64 bits_. Además, podemos observar que el firmado del _SMB_ __no__ es requerido en este host. En un entorno de `Active Directory`, esta configuración podría dar lugar a ataques como `NTLM Relay`; sin embargo, en este escenario particular no representa un vector de ataque relevante.

En cuanto a los dialectos soportados, podemos ver que `SMBv1` se encuentra habilitado, por lo que el host podría ser vulnerable a `EternalBlue`, siempre que el sistema no haya sido debidamente parcheado.

Por último, podemos observar que las _null sessions_ están habilitadas. Esto permite establecer una sesión anónima contra el servicio `SMB`, lo cual facilita la enumeración de recursos compartidos y, dependiendo de los permisos configurados, podría permitir la interacción con dichos recursos, en caso de que existan privilegios de lectura o escritura.

##### [](#header-5)Nmap

Si quisiéramos seguir enumerando con `Nmap` podríamos hacerlo, pero esta vez lanzando una serie de scripts de descubrimiento específicos. El parámetro `-sC` que utilizamos anteriormente durante nuestro escaneo de versiones y servicios, ejecuta por defecto los scripts `smb2-security-mode`, `smb-security-mode` y `smb-os-discovery`. Si obtenemos una respuesta del script `smb-security-mode`, podemos inferir que `SMBv1` está habilitado. No obstante, si queremos estar completamente seguros de los dialectos soportados, podemos incluir el script `smb-protocols`:

```bash
nmap --script smb-protocols,smb2-security-mode,smb-security-mode,smb-os-discovery -p 139,445 <IP del host>
```

Similar a los resultados obtenidos con _NetExec_, este escaneo con `Nmap` nos proporciona información sobre los protocolos soportados, la configuración de seguridad de _SMB_, y la versión del sistema operativo.

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/4.png){:class="blog-image" onclick="expandImage(this)"}

##### [](#header-5)Metasploit

Finalmente, como alternativa, podemos usar `Metasploit` para realizar la enumeración del servicio `SMB`. El módulo auxiliar `smb_version` nos permitirá listar los dialectos soportados y el estado del firmado _SMB_: 

```
msfconsole
use auxiliary/scanner/smb/smb_version
set RHOST <IP del host>
run
```

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/5.png){:class="blog-image" onclick="expandImage(this)"}

Una vez ejecutado, podemos confirmar nuevamente los dialectos soportados por el servidor, el dialecto preferido, la configuración del firmado _SMB_, y la versión del sistema operativo.

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/6.png){:class="blog-image" onclick="expandImage(this)"}

#### [](#header-4)SMB Shares

Con todo esta información en mente, podemos profundizar aún más en el servicio `SMB`. Dado que las _null sessions_ están habilitadas, podemos establecer una sesión anónima contra el servidor e intentar enumerar recursos compartidos a nivel de red; y en caso de que los permisos lo permitan, también podríamos interactuar con dichos recursos. Para esta tarea utilizaremos `SMBMap`:

```bash
smbmap -H <IP del host>
```

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/7.png){:class="blog-image" onclick="expandImage(this)"}

En este caso, únicamente podemos listar los recursos existentes, pues no contamos con permisos suficientes para interactuar con ellos, ya que el acceso está restringido.

#### [](#header-4)EternalBlue

Esto nos deja con un último vector potencial a evaluar: determinar si la implementación de `SMBv1` presente en el sistema se encuentra sin parchear y, por lo tanto, es vulnerable a `MS17-010`, o `EternalBlue`. Para verificar la presencia de esta vulnerabilidad, utilizaremos dos enfoques distintos.

##### [](#header-5)Nmap

Podemos continuar utilizando scripts de descubrimiento de `Nmap`, esta vez orientados a la detección de vulnerabilidades. En este caso, emplearemos el script `smb-vuln-ms17-010`, para comprobar si el host es susceptible a esta vulnerabilidad:

```bash
nmap --script smb-vuln-ms17-010 -p 445 <IP del host>
```

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/8.png){:class="blog-image" onclick="expandImage(this)"}

El resultado del escaneo confirma que el host es vulnerable a `MS17-010`, por lo que podemos explotar esta vulnerabilidad.

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

Al igual que con _Nmap_, confirmamos que el host es vulnerable a `MS17-010`, por lo que a explotación resulta viable.

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-02-20-Blue-Practical-Ethical-Hacking/10.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Fase De Explotación

Con este mismo módulo, más adelante en caso de que quisiéramos usar herramientas automatizadas, podríamos realizar la explotación. Sin embargo, como siempre, yo discourage usar herramientas automatizadas ya que perdemos bastante el control sobre lo que está pasando por detrás, de modo que no aprendemos; sin embargo, más adelante cubriré ambas metodologías y me enfocaré mucho más en la vía manual
