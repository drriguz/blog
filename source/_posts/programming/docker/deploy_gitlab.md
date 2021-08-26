---
title: 搭建Gitlab私服
date: 2017-06-18
categories:  
    - 闲话编程
    - 容器化
tags:
	- Docker
---

我们利用Gitlab搭建一个内网的git私服，可以为团队提供git服务。首先是需要pull下来Gitlab的镜像了。
<!--more-->
```bash
sodu docker pull gitlab/gitlab-ce
```
这个镜像大概有300多M，如果下载太慢，请参照上一篇文章说的加速的配置。下载完成后，就需要来跑起来了，参照[官方文档](https://docs.gitlab.com/omnibus/docker/)。
```bash
sudo docker run --detach \
    --hostname 192.168.56.101
    --publish 1443:443 --publish 1080:80 --publish 1022:22 \
    --name gitlab \
    --restart always \
    --volume /home/docker/gitlab/etc:/etc/gitlab \
    --volume /home/docker/gitlab/logs:/var/log/gitlab \
    --volume /home/docker/gitlab/data:/var/opt/gitlab \
    gitlab/gitlab-ce:latest
```

注意到这里我们填的IP地址是192.168.56.101，这是宿主机的地址（宿主机现在我改成NAT和Host两个网卡了，因为桥接网卡在酒店IP不稳定....)，另外把端口映射出来了。这样在我的Mac上也可以通过192.168.56.101:1080来访问。

启动gitlab后就可以通过 http://192.168.56.101:1080 来访问了，默认的用户名是root，第一次进入会设置root密码。

*备注*
经过一番折腾，如果不使用默认端口（80，443）等配置的时候有些问题没有解决，于是为了简单起见，最终使用80端口。
---

*以下是可选操作，如果生成独立IP在Mac上访问虚拟机内的Docker也会存在麻烦，仅供参考*

我们把几个数据目录挂在到Ubuntu上，这样即便删除Docker后，数据也还存在。现在有一个很重要的问题了，按照上面的方式是把容器的80、22、443端口映射到了宿主机的端口上，如果能给容器一个独立的IP岂不是更好？根据网上的资料来看，目前有几种办法：

* Pipework
* Weave
* Flannel

就选[Pipework](https://github.com/jpetazzo/pipework)吧，感觉会比较简单。
```bash
git clone https://github.com/jpetazzo/pipework.git
sudo cp pipework/pipework /usr/local/bin/
sudo chmod +x /usr/local/bin/pipework
sudo apt install bridge-utils
```
配置宿主机为静态IP：
```
# /etc/network/interfaces
auto enp0s3
iface enp0s3 inet static
        address 192.168.11.242
        netmask 255.255.248.0
        gateway 192.168.11.1

dns-nameservers 114.114.114.114
```
Ubuntu16.04貌似有BUG，通过重启networking服务不能改变IP地址，非要重启一下。
我们来看一下网络桥接的情况：
```bash
riguz@docker-host:~$ brctl show
bridge name	bridge id		STP enabled	interfaces
docker0		8000.02425039a299	no
```
这个docker0就是docker自动生成的桥接网卡.我们来创建一个桥接网卡：
```bash
sudo brctl addbr br0
sudo ip link set dev br0 up 
sudo ip addr add 192.168.10.1/24 dev br0
sudo pipework br0 gitlab 192.168.10.100/24@192.168.10.1
```