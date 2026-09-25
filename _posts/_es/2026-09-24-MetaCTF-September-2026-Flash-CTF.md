---
title: MetaCTF September 2026 Flash CTF
categories: [CTF, Capture the Flag]
published: true
lang: es
---

MetaCTF Flash CTF es un _capture the flag_ mensual organizado por [SkillBit](https://skillbit.com/), en el que encontraremos distintos retos divididos en varias categorías. En esta ocasión logré resolver 6 de los 7 retos.

<div style="text-align:center">
  <img src="https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/1.png" alt="SkillBit logo" class="blog-image" onclick="expandImage(this)">
</div>

### [](#header-3)Binary Exploitation

#### [](#header-4)Careless Talk

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/2.png){:class="blog-image" onclick="expandImage(this)"}

Al extraer y ejecutar el binario [careless-talk](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/careless-talk.zip), nos daremos cuenta de que nos pregunta por un _watchword_ que no conocemos. Lo primero que podemos hacer es utilizar `strings` para buscar cadenas de texto imprimibles.

```bash
strings careless-talk
```

Nos daremos cuenta de que hay dos cadenas que contienen la flag y solo es cuestión de reconstruirla.

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/3.png){:class="blog-image" onclick="expandImage(this)"} 

Como dato curioso, también podemos encontrar la cadena `s1l3nt_s3rv1c3_1942` dentro del binario. Si la utilizamos como _watchword_, el programa también nos devuelve la flag directamente.

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/4.png){:class="blog-image" onclick="expandImage(this)"} 

```
SkillBit{c4r3l355_t4lk_c05t5_l1v35}
```

### [](#header-3)Forensics

#### [](#header-4)Carry On

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/5.png){:class="blog-image" onclick="expandImage(this)"} 

Al abrir el [archivo adjunto](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/carry-on.zip) no vamos a observar nada relevante, no obstante, la descripción del reto nos da una pista bastante importante con la frase _walk out_. Podemos hacer uso de `binwalk`, una herramienta para analizar archivos binarios e identificar y extraer archivos embebidos.

```bash
binwalk -e checkpoint-plan.png
```

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/6.png){:class="blog-image" onclick="expandImage(this)"}

Se nos creará una carpeta dentro de la cual estará todo lo que se encontraba dentro de la imagen. Entre los archivos extraídos encontraremos un `note.txt` que contiene la flag en texto claro.

```
SkillBit{0n3_f1l3_c4n_c4rry_4n0th3r}
```

#### [](#header-4)Registry101

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/7.png){:class="blog-image" onclick="expandImage(this)"} 

Al extraer [evidence.zip](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/evidence.zip), encontraremos una copia de los archivos y registros de un sistema Windows.

El nombre del reto, `Registry101`, nos da una primera pista sobre dónde debemos buscar. Además, la descripción menciona que Peter niega haber accedido a unos _documentos importantes_, así que podemos empezar buscando evidencia de documentos abiertos recientemente.

Dentro de la evidencia encontramos el hive del usuario `admin` junto con sus transaction logs:

```
C/Users/admin/NTUSER.DAT
C/Users/admin/ntuser.dat.LOG1
C/Users/admin/ntuser.dat.LOG2
```

Podemos revisar `RecentDocs`, ya que esta clave contiene información sobre documentos abiertos recientemente. Para ello podemos utilizar `python-registry`.

```python
#!/usr/bin/env python3

from Registry import Registry

reg = Registry.Registry("C/Users/admin/NTUSER.DAT")

path = r"Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs"

key = reg.open(path)

print(f"[+] {path}")

for value in key.values():
    print(f"{value.name():<20} {value.value()!r}")

for subkey in key.subkeys():
    print(f"\n[{subkey.name()}]")
    for value in subkey.values():
        print(f"{value.name():<20} {value.value()!r}")
```

Entre las entradas encontraremos diferentes tipos de documentos:

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/8.png){:class="blog-image" onclick="expandImage(this)"}

Sin embargo, no encontramos nada que parezca una flag, así que podemos seguir investigando los archivos relacionados con este hive.

Como también tenemos los transaction logs asociados al hive, podemos investigar si contienen información adicional. Estos logs pueden contener escrituras del Registry que todavía no están reflejadas en el estado actual del hive que estamos viendo en `NTUSER.DAT`.

Podemos extraer las cadenas en UTF-16LE de ambos logs utilizando `strings`:

```bash
strings -el C/Users/admin/ntuser.dat.LOG1 > log1_strings.txt
strings -el C/Users/admin/ntuser.dat.LOG2 > log2_strings.txt
```

La opción `-el` indica a `strings` que busque cadenas de 16 bits en _little-endian_, un formato utilizado por muchas cadenas almacenadas en los datos del Registry de Windows.

Como acabamos de observar que `RecentDocs` contiene archivos con extensiones `.docx`, `.xlsx`, `.txt` y `.xml`, podemos utilizar estas extensiones para filtrar los resultados.

```bash
grep -Ei '\.(docx|xlsx|txt|xml)$' log1_strings.txt
grep -Ei '\.(docx|xlsx|txt|xml)$' log2_strings.txt
```

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/9.png){:class="blog-image" onclick="expandImage(this)"}

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/10.png){:class="blog-image" onclick="expandImage(this)"}

Entre los resultados encontraremos dos nombres que llaman la atención:

```
IU1ldGFDVEZ7RjFyNXRfc3QzcF8=.docx
Ml9yM2cxc3RyeV80YW5kNn0=.xlsx
```

Ambas cadenas tienen el formato de Base64, así que podemos probar a decodificarlas:

```bash
echo -n "IU1ldGFDVEZ7RjFyNXRfc3QzcF8=Ml9yM2cxc3RyeV80YW5kNn0=" | base64 -d; echo
```

Al decodificar la cadena obtenemos la flag:

```
MetaCTF{F1r5t_st3p_2_r3g1stry_4and6}
```

### [](#header-3)Other

#### [](#header-4)Git Sleuth

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/11.png){:class="blog-image" onclick="expandImage(this)"}

Antes de conectarnos al reto, podemos revisar los [archivos proporcionados](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/gitsleuth.zip) para entender qué archivos se generan y cómo se preparan.

En `challenge.py` podemos ver que los comandos introducidos por el usuario se ejecutan utilizando `subprocess.run()`:

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/12.png){:class="blog-image" onclick="expandImage(this)"}

Esto significa que cada comando que introduzcamos será ejecutado como un comando de Git. Además, existe una lista de caracteres y palabras que no podemos utilizar, por lo que estamos limitados a los comandos de Git que no sean bloqueados.

Por otra parte, en `exec.sh` podemos ver que se crean 500 archivos `.txt` dentro de `/tmp`, todos con el mismo contenido. Después, copia `/flag.txt` a otro archivo con un nombre generado aleatoriamente:

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/13.png){:class="blog-image" onclick="expandImage(this)"}

Esto significa que tendremos 501 archivos `.txt` en `/tmp`: 500 con la misma flag falsa y uno con la flag real. Como todos tienen nombres aleatorios, no podemos saber directamente cuál contiene la flag que buscamos.

Primero, inicializamos un repositorio en `/tmp`:

```
-C /tmp init
```

Después, añadimos todos los archivos:

```
-C /tmp add .
```

Y comprobamos que los archivos se han añadido correctamente con:

```
-C /tmp status
```

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/14.png){:class="blog-image" onclick="expandImage(this)"}

Una vez añadidos, podemos obtener los archivos junto con el hash del blob que contiene su contenido:

```
-C /tmp ls-files -s
```

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/15.png){:class="blog-image" onclick="expandImage(this)"}

Como los 500 archivos que contienen la misma flag falsa tienen exactamente el mismo contenido, todos tendrán el mismo hash, por lo que podemos buscar entre los resultados el hash que aparece una sola vez: ese será el hash del blob que contiene la flag real.

```bash
tail -n +9 output.txt | awk '{print $2}' | uniq -u | xargs
```

![16](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/16.png){:class="blog-image" onclick="expandImage(this)"}

Podemos consultar directamente el contenido de este blob:

```
-C /tmp cat-file -p 35ab8c9e8787383f759aae2db4ee654c73080548
```

![17](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2026-09-24-MetaCTF-September-2026-Flash-CTF/17.png){:class="blog-image" onclick="expandImage(this)"}

Esto nos devolverá la flag:

```
SkillBit{R3m3mb3r_t0_4lw4ys_3sc4p3_G1t_C0mm4nds}
```

### [](#header-3)Reverse Engineering

#### [](#header-4)CoilVM

### [](#header-3)Web Exploitation

#### [](#header-4)Track Me
