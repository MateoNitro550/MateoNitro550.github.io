---
title: Local File Inclusion (LFI
published: true
---

La vulnerabilidad _Local File Inclusion_, _LFI_ por sus siglas en inglés, permite a un atacante leer archivos del servidor vulnerable. Esta afección se produce debido a malas prácticas durante la programación de una página web. 

Dependiendo de la gravedad, esta vulnerabilidad puede llevar al atacante a:
	
* RCE (Remote Code Execution)
* XSS (Cross-Site Scripting)
* DoS (Denial Of Service)

Un ejemplo muy básico sería el siguiente script en _PHP_.

```php
<?php
	$file = $_GET['filename'];
	include($file);
?>
```

Script, del que podemos abusar para leer cualquier archivo del sistema, en este caso el `/etc/passwd`.

```
localhost/lfi.php?filename=/etc/passwd
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/1.png)

Es importante aclarar que esta no es solo una vulnerabilidad de _PHP_, también está presente en otros lenguajes como lo es _JSP_ o _ASP_.

### [](#header-3)Directory Path Traversal

Es posible que en el código, se nos limite a acceder a archivos que se ubican únicamente en una ruta preestablecida en el script, en este caso `/var/www/html/`.

```php
<?php
	$file = $_GET['filename'];
	include("/var/www/html/" . $file);
?>
```

Sin embargo, podemos "escaparnos" de la ruta preestablecida si añadimos `../` en nuestra cadena de ataque, pudiendo así listar contenido más allá de `/var/www/html/`.

```
localhost/lfi.php?filename=../../../etc/passwd
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/2.png)

### [](#header-3)Null Byte

De igual manera, es posible que en el código se nos limite a acceder a archivos de determinada extensión, en este caso archivos de extensión `.php`.

```php
<?php
	$file = $_GET['filename'];
        include($file . ".php");
?>
```

De modo que cuando intentemos leer el archivo `/etc/passwd`, o cualquier otro archivo del sistema, lo que estariamos leyendo en realidad sería el archivo `/etc/passwd.php`, el cual no existe. 

Sin embargo, si añadimos el nullbyte `%00` al final de nuestra cadena de ataque, el `.php` no será tenido en cuenta, pudiendo así leer con normalidad el `/etc/passwd`, o cualquier otro archivo del sistema.

```
localhost/lfi.php?filename=/etc/passwd%00
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/3.png)

### [](#header-3)Wrappers

_PHP_ cuenta con una serie de _wrappers_, los cuales a menudo pueden ser abusados, por mencionar algunos tenemos:

#### [](#header-4)expect://

Nos permite una ejecución remota de comandos (RCE); cabe aclarar que este _wrapper_ no está activado por defecto, por lo que no siempre será posible utilizarlo.

```
localhost/lfi.php?filename=expect://whoami
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/4.png)

#### [](#header-4)filter://

Nos permite codificar archivos del sistema a través de diferentes métodos como podría ser _Base64_ o _ROT13_. 

Este _wrapper_ resulta bastante útil si necesitamos leer un archivo en _PHP_, ya que recordemos, este es un lenguaje interpretado, por lo que si intentáramos leer un archivo _PHP_ del servidor vulnerable, lo que veríamos sería simplemente el output del script.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/5.png)

```
localhost/lfi.php?filename=php://filter/convert.base64-encode/resource=filterWrapper.php
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/6.png)

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/master/assets/2021-09-13-Local-File-Inclusion-(LFI)/7.png)
