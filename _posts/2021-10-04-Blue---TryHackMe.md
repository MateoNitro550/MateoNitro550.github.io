---
title: Blue - TryHackMe
published: true
---

En esta ocasión vamos a resolver la máquina _Blue_ de _TryHackMe_. Esta es una máquina fácil tanto en la intrusión como en la escalada de privilegios, por lo que no supondrá ninguna complicación a la hora de realizarla. Ya por el nombre de la máquina, podemos darnos una idea de por donde van los tiros, ¿quizá `EternalBlue`?

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-04-Blue-TryHackMe/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente, vamos a utilizar la herramienta _Nmap_ para determinar que puertos están abiertos así como identificar la versión y servicios que corren en el activo. Para determinar que puertos están abiertos podemos realizar lo siguiente:

```
nmap -p- --open -T5 -v -n <dirección IP> -oG allPorts
```
 
Y en caso de que el escaneo tarde demasiado en completar, tenemos esta otra alternativa:
  
``` 
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn <dirección IP> -oG allPorts
```

A continuación se explican los parámetros utilizados en el escaneo de puertos con _Nmap_:
  
* p - Escanea todo el rango de puertos (65535 en total)
* open - Nos indica todos aquellos puertos que están abiertos (o posiblemente abiertos)
* T5 - La plantilla de temporizado nos permite agilizar nuestro escaneo, este valor puede ir desde 0 hasta 5, cabe aclarar que a mayor sea el valor de la plantilla, "generaremos más ruido  ", pero no pasa nada ¿no? Al fin y al cabo estamos practicando en un entorno controlado y aquí somos todos `White Hat`
* v - _Verbose_, reporta lo encontrado por consola
* n - No aplicar _resolución DNS_
* sS - Escaneo _TCP SYN_
* min-rate - Emitir paquetes no más lentos que _valor_ por segundo
* vvv - Triple _verbose_, para obtener mayor información por consola
* Pn - No aplicar _host discovery_
* oG - Exportar el escaneo en formato "_grepeable_"

  
Para determinar la versión y servicios que corren bajo estos puertos podemos realizar lo siguiente:

```  
nmap -sC -sV -p 135,139,445,3389,49152,49153,49154,49158,49160 <dirección IP> -oN targeted
```
  
A continuación se explican los parámetros utilizados en el escaneo de versiones y servicios con _Nmap_:

* sC - Scripts básicos de enumeración
* sV - Versión y servicios que corren bajo los puertos encontrados
* p - Especificamos que puertos queremos analizar (los que encontramos abiertos en el paso anterior)
* oN - Exportar el escaneo en formato _Nmap_

Entre las preguntas que nos realiza la plataforma en esta primera fase, se encuentra:

* ¿Cuántos puertos están abiertos con un número de puerto inferior a 1000?
* ¿A qué es vulnerable esta máquina?

Estas preguntas son bastante fáciles de responder si realizamos un buen escaneo con _Nmap_. Para responder a la primera pregunta no hay donde perderse, bastará con introducir cuántos puertos abiertos, inferiores a 1000, hemos detectado con nuestro escaneo; recordemos que existen en total 65535 puertos posibles. Para responder a la segunda pregunta, tendremos que realizar un escaneo adicional, ya que se nos pregunta, a que ataque es vulnerable la máquina; a modo de pista, la plataforma nos da un ejemplo de respuesta: _ms08-067_.

Si recordamos, lo más relevante que encontramos con nuestro escaneo de versiones y servicios con _Nmap_, es el puerto `445`, o servicio `Samba`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-04-Blue-TryHackMe/2.png)

De modo que procederemos a utilizar los scripts específicos con los que cuenta _Nmap_, para detectar vulnerabilidades en un servicio `Samba`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-04-Blue-TryHackMe/3.png)

Para poder utilizarlos podemos hacer lo siguiente:

```  
nmap --script="smb-vuln*" -p 445 10.10.229.101 -oN smbScan
```

A continuación se explican los parámetros utilizados en el escaneo de vulnerabilidades del servicio `Samba` con _Nmap_:
  
  * --script - Proporcionamos el script que queremos emplear; en este caso, como no teníamos un script en particular a utilizar, a través de expresiones regulares, indicamos que queremos utilizar todos aquellos script que comiencen por _smb-vuln_
  * p - Especificamos a que puertos queremos aplicar este escaneo
  * oN - Exportar el escaneo en formato _Nmap_

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-10-04-Blue-TryHackMe/4.png)

Como podemos darnos cuenta, esta máquina es vulnerable a MS17-010, o también conocido como `EternalBlue`.

### [](#header-3)Fase De Explotación

ABC

### [](#header-3)Escalada De Privilegios

ABC
