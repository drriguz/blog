---
title: Compile OpenJDK8 on MacOSX
date: 2018-04-09
categories:  
    - 刨根问底
    - 探索分析
tags:
    - OpenJDK
    - Series-JDK-Source
---
纯手工编译[OpenJDK8](http://openjdk.java.net/projects/jdk8u/)。在Mac上尝试了一下，因为编译这玩意需要XCode4*，而现在XCode都升级到9了，虽然可以下载旧版的XCode，但试了一下貌似不太兼容。于是在Virtualbox中装lubuntu来编译一下玩玩。在Virtualbox使用NAT网络做端口转发的时候，竟然发现不支持主机的22端口（貌似是[权限的问题](https://apple.stackexchange.com/questions/235518/ssh-to-virtualbox-mac-host-linux-guest-using-nat)），改为10240则Ok。
<!--more-->
```bash
sudo apt-get install mercurial
sudo apt-get install lrzsz
hg clone http://hg.openjdk.java.net/jdk8u/jdk8u
cd jdk8u
sh get_source.sh
```
可能遇到的问题：
```
...
jdk:   abort: stream ended unexpectedly (got 8159 bytes, expected 29096)
...
WARNING: hotspot exited abnormally (255)
WARNING: jdk exited abnormally (255)
WARNING: nashorn exited abnormally (255)
```
解决办法是重试N次get_source.sh就可以了。

切换到最新的release tag：
```
hg tags
hg up jdk8u162-b12
```

安装依赖项：
```
sudo apt-get install build-essential
sudo apt-get install libasound2-dev libcups2-dev libfreetype6-dev
sudo apt-get install libx11-dev libxext-dev libxrender-dev libxtst-dev libxt-dev
sudo apt-get update
sudo apt-get upgrade

sudo add-apt-repository ppa:openjdk-r/ppa  
sudo apt-get update   
sudo apt-get install openjdk-7-jdk  
# refer https://github.com/hgomez/obuildfactory/wiki/How-to-build-and-package-OpenJDK-8-on-Linux
```
然后开始编译吧：
```
bash ./configure --with-target-bits=64 --with-freetype-include=/usr/include/freetype2/ --with-freetype-lib=/usr/lib/x86_64-linux-gnu
```

Ubuntu16下面必须指定freetype的路径，按照OpenJDK Build README里面所说，期望的路径是```Expecting the freetype libraries under lib/ and the headers under include/. ```.而且特别指出:
```
*The build is now a "configure && make" style build
*Any GNU make 3.81 or newer should work
*The build should scale, i.e. more processors should cause the build to be done in less wall-clock time
*Nested or recursive make invocations have been significantly reduced, as has the total fork/exec or spawning of sub processes during the build
*Windows MKS usage is no longer supported
*Windows Visual Studio vsvars*.bat and vcvars*.bat files are run automatically
*Ant is no longer used when building the OpenJDK
*Use of ALT_* environment variables for configuring the build is no longer supported
```
因此有些文章上面设置ant, ALT_BOOTDIR等步骤不适用编译jdk8.为了提高编译速度，在虚拟机中设置了使用4个cpu核心。我们需要指定编译使用的cpu数来提高编译速度。
```
make clean
rm -rf build
bash ./configure --with-target-bits=64 --with-freetype-include=/usr/include/freetype2/ --with-freetype-lib=/usr/lib/x86_64-linux-gnu --with-jobs=4
```
这样配置完后的输出如下:
```
A new configuration has been successfully created in
/home/riguz/jdk/jdk8u/build/linux-x86_64-normal-server-release
using configure arguments '--with-target-bits=64 --with-freetype-include=/usr/include/freetype2/ --with-freetype-lib=/usr/lib/x86_64-linux-gnu --with-jobs=4'.

Configuration summary:
* Debug level:    release
* JDK variant:    normal
* JVM variants:   server
* OpenJDK target: OS: linux, CPU architecture: x86, address length: 64

Tools summary:
* Boot JDK:       java version "1.7.0_95" OpenJDK Runtime Environment (IcedTea 2.6.4) (7u95-2.6.4-3) OpenJDK 64-Bit Server VM (build 24.95-b01, mixed mode)  (at /usr/lib/jvm/java-7-openjdk-amd64)
* C Compiler:     gcc-5 (Ubuntu 5.4.0-6ubuntu1~16.04.9) 5.4.0 version 5.4.0 (at /usr/bin/gcc-5)
* C++ Compiler:   g++-5 (Ubuntu 5.4.0-6ubuntu1~16.04.9) 5.4.0 version 5.4.0 (at /usr/bin/g++-5)

Build performance summary:
* Cores to use:   4
* Memory limit:   1997 MB
* ccache status:  not installed (consider installing)
```
这里有个performance的提示，就是ccache。但是这玩意安装之后貌似[识别错误](https://bugs.openjdk.java.net/browse/JDK-8067132)，索性不要了。然后就可以开始编译了
```
make images
```
尴尬的是虚拟机磁盘空间(10G)不够，幸亏可以动态调整一下
```
VBoxManage modifyhd ~/VirtualBox\ VMs/lubuntu/lubuntu.vdi --resize 20480
# 完了之后需要进入到系统，用分区工具调整分区大小，可能需要删除swap分区，扩展/后再重建swap分区
sudo apt-get install gparted
gparted
```
images目标会```create complete j2sdk and j2re images```，花费了大约10分钟时间:
```
----- Build times -------
Start 2018-04-11 10:03:36
End   2018-04-11 10:13:47
00:00:23 corba
00:00:15 demos
00:04:49 hotspot
00:01:02 images
00:00:15 jaxp
00:00:20 jaxws
00:02:26 jdk
00:00:28 langtools
00:00:13 nashorn
00:10:11 TOTAL
-------------------------
```
生成的文件在build/*/images中
```
riguz@riguz-VirtualBox:~/jdk/jdk8u/build/linux-x86_64-normal-server-release/images/j2sdk-image$ cd bin/
riguz@riguz-VirtualBox:~/jdk/jdk8u/build/linux-x86_64-normal-server-release/images/j2sdk-image/bin$ ls
appletviewer  javadoc       jdeps       jsadebugd     pack200      servertool
extcheck      javah         jhat        jstack        policytool   tnameserv
idlj          javap         jinfo       jstat         rmic         unpack200
jar           java-rmi.cgi  jjs         jstatd        rmid         wsgen
jarsigner     jcmd          jmap        keytool       rmiregistry  wsimport
java          jconsole      jps         native2ascii  schemagen    xjc
javac         jdb           jrunscript  orbd          serialver
riguz@riguz-VirtualBox:~/jdk/jdk8u/build/linux-x86_64-normal-server-release/images/j2sdk-image/bin$ ./java -version
openjdk version "1.8.0-internal"
OpenJDK Runtime Environment (build 1.8.0-internal-riguz_2018_04_11_10_03-b00)
OpenJDK 64-Bit Server VM (build 25.71-b00, mixed mode)
```
最后就是测试了。测试需要安装jtreg，注意一定要指定JT_HOME.

```
sudo apt-get install jtreg
cd test && make PRODUCT_HOME=`pwd`/../build/*/images/j2sdk-image JT_HOME=/usr/bin/jtreg all
```
