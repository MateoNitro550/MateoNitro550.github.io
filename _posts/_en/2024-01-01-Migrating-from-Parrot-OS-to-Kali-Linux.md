---
title: Migrating from Parrot OS to Kali Linux
categories: [Parrot OS, VMware, Kali Linux, Linux Setup, ArcticTones]
published: true
lang: en
---

Lately, I've been experiencing frequent random crashes with __Parrot OS 5.3__ on my __VMware Workstation Pro__ virtual machine.

Initially, I thought these issues might be due to the __22H2__ update of Windows, as I had read some posts mentioning potential incompatibilities. However, after exploring this possibility, I didn't notice any improvements.

* [Vmware 17 Pro very slow on Windows 11 22H2](https://communities.vmware.com/t5/VMware-Workstation-Pro/Vmware-17-Pro-very-slow-on-Windows-11-22H2/td-p/2946164)
* [VM machines freezes randomly after a while in VMware Workstation Pro 17.5](https://www.reddit.com/r/vmware/comments/17fc6t9/vm_machines_freezes_randomly_after_a_while_in/)

Later, I considered that the update of __VMware__ to version __17.5__ might be the cause, as the crashes became more frequent on my desktop computer. Interestingly, on my laptop, where I didn't update __VMware__ to this version, I also started experiencing crashes, although much less frequently.

I even suspected that the framework I was using for a project might be the source of the problems, as the crashes seemed to be related to its crashes.

After months of dealing with these issues and finding no solution, I decided to perform a full update of __Parrot OS__ using the `parrot-upgrade` command. However, during this process, several error messages appeared, and eventually, the virtual machine failed to boot due to a __kernel panic__. I chose not to try to solve this problem and instead backed up my files using a __live USB__ with the Parrot ISO.

Seeing that many users were facing similar difficulties with __Parrot OS__ and opting to migrate to __Kali Linux__, I made the same decision. I downloaded the [pre-configured image](https://www.kali.org/get-kali/#kali-virtual-machines) of __Kali Linux__ for __VMware__, making the process easier without the need for additional installations.

![1](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-01-09-Migrando-de-Parrot-OS-a-Kali-Linux/1.png){:class="blog-image" onclick="expandImage(this)"} 

I simply opened the `.vmx` configuration file with __VMware__, and the virtual machine was ready to run.

![2](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-01-09-Migrando-de-Parrot-OS-a-Kali-Linux/2.png){:class="blog-image" onclick="expandImage(this)"} 

The transition to __Kali Linux__ was swift, and the experience was quite straightforward.

![3](https://raw.githubusercontent.com/MateoNitro550/MateoNitro550.github.io/main/assets/2024-01-09-Migrando-de-Parrot-OS-a-Kali-Linux/3.png){:class="blog-image" onclick="expandImage(this)"} 

Soon after, I began configuring the same Linux setup I had in __Parrot OS__, which you can find in the following link to my [repository](https://github.com/MateoNitro550/ArcticTones).

This change has significantly improved stability and the overall user experience, providing me with a more reliable environment to continue my work and projects.
