---
title: Devel - Hack The Box
categories: [Windows, FTP, File Transfer Protocol, IIS, Internet Information Services, Reverse Shell, ASP.NET, ASPX, Kernel Exploit, MS11-046, Microsoft Windows Ancillary Function Driver, AFD.sys]
published: true
lang: en
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

This time we are going to solve _Hack The Box's_ _Devel_ machine. It is an easy-level _Windows_ machine, both in terms of exploitation and privilege escalation.

### [](#header-3)Reconnaissance Phase

First, we’re going to launch an _ICMP traceroute_ to check if the machine is active.

```
ping -c 1 10.10.10.5
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Once we verify that the machine is active (as it returns a response), we can also determine what type of machine we are dealing with based on the _TTL_ value; in this case, the machine’s _TTL_ value is `127`, so we can infer that we are dealing with a _Windows_ machine. Remember, some of the reference values are as follows:

| Operating System (OS)  | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

If we notice, in this case, the _TTL_ value is `127` instead of `128` as indicated in the table above. This is because, in the _Hack The Box_ environment, we are not communicating directly with the target machine; instead, there is an intermediary node, which causes the _TTL_ to decrease by one unit.

```
ping -c 1 10.10.10.5 -R
``` 

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/3b.png){:class="blog-image" onclick="expandImage(this)"}

Next, we will use the _Nmap_ tool to determine which ports are open, as well as identify the version and services running on the asset. To determine which ports are open, we can do the following:

```bash
nmap -p- --open -T5 -v -n 10.10.10.5
```

If the scan takes too long to complete, we have this alternative:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.5
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
nmap -sC -sV -p 21,80 10.10.10.5
```

Below is an explanation of the parameters used in the version and service scan with _Nmap_:

| Parameter | Explanation |
|:----------|:------------|
| \-sC | Basic enumeration scripts |
| \-sV | Version and services running on the found ports |
| \-p | Specify which ports we want to analyze (those found open in the previous step) |

Based on the information reported by _Nmap_, we can see that the target machine has open ports related to `HTTP` and `FTP` (File Transfer Protocol).

### [](#header-3)Exploitation Phase

We can start by enumerating the `HTTP` service. To do this, we can use `WhatWeb`, a tool that identifies the web technologies being used. This includes content management systems (CMS), libraries, plugins, or even the operating system hosting the web server.

```bash
whatweb http://10.10.10.5
```

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

There’s nothing particularly interesting, except that the website is hosted on `IIS` (Internet Information Services), a web server developed by _Microsoft_ to host sites on _Windows_ systems, and that the website appears to be under construction.

Since we can’t gather more useful information from the terminal, we will need to visit the website from our browser. We will only see the `IIS` version 7 logo, so there doesn't seem to be much to do here at the moment.

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

The next thing we can do is to enumerate the `FTP` service. For this, we’ll use a _null session_, as we don't have credentials.

```bash
ftp anonymous@10.10.10.5
```

Upon connecting, we can see what appears to be the file structure of the website hosted on `IIS`. We find a directory called `aspnet_client` and files like `iisstart.htm` and `welcome.png`.

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

We can verify this by downloading one of these files and viewing it on our system. For instance, we can try with the `welcome.png` image. Since this is a non-text file, we will switch the transfer mode to _binary_, which ensures that the file is transferred without modifications, preserving its integrity byte by byte.

```bash
binary
get welcome.png
```

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

We confirm that we are seeing the same image we previously viewed in the browser, suggesting a possible file upload path to the web server. As a test, we can upload a file via `FTP` and see if it appears on the website. In my case, I tested with an image.

```bash
put <fileName>
```

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

We see that the image appears correctly on the webpage, so we can attempt to upload a _reverse shell_ to the server. One thing to keep in mind is that `IIS` uses `ASP`/`ASP.NET` for server-side script execution. `ASP.NET` is the more modern version of the `ASP` framework and is based on the `.NET` framework, which is _Microsoft’s_ development platform for creating applications. Therefore, the _reverse shell_ we upload will need to be in `.aspx` format so that the server can interpret and execute it correctly.

That said, we could generate the _reverse shell_ with `MSFvenom` or find one publicly available on GitHub. In my case, I’ll use the [shell](https://github.com/borjmz/aspx-reverse-shell/blob/master/shell.aspx) by user `borjmz`. We just need to change our IP and port where indicated, and then upload the _shell_.

```bash
put shell.aspx
```

We can go to [http://10.10.10.5/shell.aspx](http://10.10.10.5/shell.aspx) or execute it from the console with:

```bash
curl http://10.10.10.5/shell.aspx
```

Either way, we will get a shell inside the target machine as the user `IIS APPPOOL\web`, so we’ll need to escalate privileges.

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Privilege Escalation

We can start by enumerating the operating system using `systeminfo` to find its version and check whether patches have been applied.

```bash
systeminfo
```

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

We find that the operating system version is `6.1.7600 Build 7600`, with no patches applied. Upon further research, we discover that this version is vulnerable to `MS11-046`, a vulnerability caused by the _Microsoft Windows Ancillary Function Driver_ (_AFD.sys_), which, when running in privileged kernel mode, fails to properly validate input provided by low-privileged users.

We can search online for an exploit to take advantage of this vulnerability. There is already a compiled version available, which is the one we will [use](https://www.exploit-db.com/exploits/40564). Since we have a potential way to upload files via the `FTP` service, we can leverage this by searching for the path where the files we saw earlier are located. For instance, we can perform a recursive search on the system to verify where the `welcome.png` image we saw earlier is stored.

```bash
dir /s welcome.png
```

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

Knowing that the files are located in the `C:\inetpub\wwwroot` directory, we can upload the exploit via `FTP`, and once the file is on the target machine, we will be able to execute it directly from there.

```bash
binary
put MS11-046.exe
```

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

By executing it, we will gain elevated privileges, becoming `NT AUTHORITY\SYSTEM`, which will allow us to list the flags for both users on the system.

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-30-Devel-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}
