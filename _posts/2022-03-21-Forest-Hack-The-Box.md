---
title: Forest - Hack The Box
categories: [Windows,]
published: false
---

El día de hoy vamos a resolver la máquina _Forest_ de _Hack The Box_. Es una máquina _Windows_ de nivel de dificultad medio en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/1.png)

### [](#header-3)Fase De Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

```
ping -c 1 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/2.png)

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

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/3.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/4.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/5.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/6.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/7.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/8.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/9.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/10.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/11.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/12.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/13.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/14.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/15.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/16.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/17.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/18.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/19.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/20.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/21.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/22.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/23.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/24.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/25.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/26.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/27.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/28.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/29.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/30.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/31.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/32.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/33.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/34.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2022-03-21-Forest-Hack-The-Box/35.png)
