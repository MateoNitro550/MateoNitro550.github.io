---
title: Migrando de Parrot OS a Kali Linux
categories: [Parrot OS, VMware, Kali Linux, Entorno de Trabajo, ArcticTones]
published: true
lang: es
---

Últimamente he experimentado cuelgues aleatorios de forma frecuente con __Parrot OS 5.3__ en mi máquina virtual __VMware Workstation Pro__.

En un principio, pensé que estos problemas podrían deberse a la actualización __22H2__ de Windows, ya que había leído algunos posts que mencionaban posibles incompatibilidades. Sin embargo, después de explorar esta posibilidad, no noté mejoras.

* [Vmware 17 Pro very slow on Windows 11 22H2](https://communities.vmware.com/t5/VMware-Workstation-Pro/Vmware-17-Pro-very-slow-on-Windows-11-22H2/td-p/2946164)
* [VM machines freezes randomly after a while in VMware Workstation Pro 17.5](https://www.reddit.com/r/vmware/comments/17fc6t9/vm_machines_freezes_randomly_after_a_while_in/)

Luego, consideré que la actualización de __VMware__ a la versión __17.5__ podría ser la causa, ya que los cuelgues se volvieron más frecuentes en mi computadora de escritorio. Curiosamente, en mi laptop, donde no actualicé __VMware__ a esta versión, también comencé a experimentar cuelgues, aunque con mucha menos frecuencia.

Incluso llegué a sospechar que el framework con el que estaba trabajando para un proyecto podría ser la fuente de los problemas, ya que los cuelgues parecían estar relacionados con los _crashes_ del mismo.

Después de meses lidiando con estos problemas y sin encontrar una solución, decidí realizar una actualización completa de __Parrot OS__ utilizando el comando `parrot-upgrade`. Sin embargo, durante este proceso, surgieron varios mensajes de error y, finalmente, la máquina virtual dejó de arrancar debido a un __kernel panic__. Opté por no intentar solucionar este problema y, en su lugar, realicé un respaldo de mis archivos utilizando un __live USB__ con la ISO de Parrot.

Al observar que varios usuarios enfrentaban dificultades similares con __Parrot OS__ y optaban por migrar a __Kali Linux__,  tomé la misma decisión. Descargué la [imagen preconfigurada](https://www.kali.org/get-kali/#kali-virtual-machines) de __Kali Linux__ para __VMware__, lo que facilitó el proceso al no tener que realizar ninguna instalación adicional.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2024-01-09-Migrando-de-Parrot-OS-a-Kali-Linux/1.png)

Simplemente abrí el archivo de configuración `.vmx` con __VMware__, y la máquina virtual estaba lista para ser ejecutada.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2024-01-09-Migrando-de-Parrot-OS-a-Kali-Linux/2.png)

El cambio a __Kali Linux__ fue rápido y la experiencia resultó bastante sencilla. 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2024-01-09-Migrando-de-Parrot-OS-a-Kali-Linux/3.png)

Al poco tiempo empecé a configurar el mismo entorno de trabajo que tenía previamente en __Parrot OS__, el cual pueden encontrar en el siguiente enlace a mi [repositorio](https://github.com/MateoNitro550/ArcticTones).

Este cambio ha mejorado significativamente la estabilidad y la experiencia de uso, proporcionándome un entorno más fiable para continuar con mi trabajo y proyectos.
