---
title: Explore - Hack The Box
published: true
---

En esta ocasión vamos a estar resolviendo la máquina _Explore_ de _Hack The Box_. Es una máquina _Android_ de nivel de dificultad fácil en la intrusión, y medio en la escalada de privilegios según figura en la plataforma.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/1.png)

### [](#header-3)Fase de Reconocimiento

Primeramente vamos a lanzar una _traza ICMP_ para saber si la máquina está activa.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/2.png)

Una vez comprobamos que la máquina está activa (pues nos devuelve una respuesta), podemos también determinar en base al valor del _TTL_, frente a que tipo de máquina nos estamos enfrentando, en este caso el valor del _TTL_ es `63`, por lo que podemos intuir que nos estamos enfrentado ante una máquina _Linux_. Recordemos que algunos de los valores referenciales son los siguientes:

| Sistema Operativo (OS) | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |

Si nos damos cuenta, en esta ocasión, el valor del _TTL_ es `63` y no `64` como nos indica la tabla anterior, esto se debe a que en el entorno de máquinas de _Hack The Box_, no nos comunicamos directamente con la máquina a vulnerar, sino que existe un intermediario por lo que el _TTL_ disminuye en una unidad.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-20-Explore---Hack-The-Box/3.png)
