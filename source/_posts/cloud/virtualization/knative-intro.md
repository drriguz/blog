---
title: Knative简介
date: 2023-01-10
categories:  
    - 云计算
    - 容器化
---

<!-- more -->
# 准备Knative开发环境
## 准备Kubernetes环境

体验Knative时，首先需要在本机进行安装。基于以下的环境进行安装：

* Windows 11
* Docker Desktop
* minikube

之所以这样选择，是因为首先Docker Desktop最为流行，minikube（以及kind）是Knative/Tekton官方例子中推荐的选择，因此肯定是兼容的。之前更多时候我青睐于k3s，因为k3s是真正的production-ready的轻量级k8s版本，但是因为Knative有单独的网络层，在k3s上安装时需要特别处理一下，考虑到复杂性还是用minikube吧。minikube必须要Docker或者其他的运行时支持。

```bash
# 先启动docker desktop
minikube start
```

minikube启动时会下载一些镜像，因此如果没有翻墙很可能下载不了。另外有时候会出现卡死的情况，
解决方式是，删掉重新来过：

```bash
minikube delete
rm -rf ~/.minkube
minikube start
```

## 安装Knative

Knative支持一种叫quickstart的插件安装机制，可以比较方便的开启一个本地环境。完整的安装过程可以参考[官方文档](https://knative.dev/docs/getting-started/quickstart-install/)，仅列出安装的文件：

* kn.exe
* kn-func.exe
* kn-quickstart.exe

这些都需要加入到系统Path之中。然后运行安装：

```bash
kn quickstart minikube
```

这一步后还需要执行一个命令，并保证其始终运行（可以单独开一个Terminal窗口执行）：

```bash
minikube tunnel --profile knative
```

安装成功后，应该可以能够列出Knative profile:

```bash
minikube profile list
```

![](/images/Knative-profile.png)

# Hello World!
## Knative Functions
通过func命令（或者kn func）来创建一个Function，这里以Python为例：

```bash
kn func create -l python helloworld

cd helloworld
kn func run
```

这里运行时会提示提供一个registry名称，暂时可以随便输入一个即可。第一次运行需要进行构建，
这个构建过程稍微会需要一点时间。运行后，会启动8080端口，可以在浏览器访问：

![](/images/Knative-func-helloworld.png)


参考：

* https://www.archcloudlabs.com/projects/diving-into-kubernetes/
* https://www.reddit.com/r/kubernetes/comments/v1a6ay/running_kubernetes_locally_and_minikube_vs/
* https://docs.google.com/spreadsheets/d/1ZT8m4gpvh6xhHYIi4Ui19uHcMpymwFXpTAvd3EcgSm4/edit#gid=0
* https://knative.dev/docs/getting-started/quickstart-install/