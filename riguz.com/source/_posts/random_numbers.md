---
title: 关于随机数
date: 2018-12-03
categories:  
    - Programing
    - Miscellaneous
tags:
	- Random Number
---
随机数顾名思义就是你无法确定的一个数（但是你可以设定一个范围），就好比彩票摇号一样，所有可能的组合是知道的，但是到底会摇出个什么数字出来，谁都不知道。否则我早就买彩票去了😂 那随机数是怎么生成出来的？
<!--more-->

# 随机数的定义
引用维基百科，

> 根据密码学原理，随机数的随机性检验可以分为三个标准：

> * 统计学伪随机性。统计学伪随机性指的是在给定的随机比特流样本中，1的数量大致等于0的数量，同理，“10”“01”“00”“11”四者数量大致相等。类似的标准被称为统计学随机性。满足这类要求的数字在人类“一眼看上去”是随机的。
> * 密码学安全伪随机性。其定义为，给定随机样本的一部分和随机算法，不能有效的演算出随机样本的剩余部分。
> * 真随机性。其定义为随机样本不可重现。实际上衹要给定边界条件，真随机数并不存在，可是如果产生一个真随机数样本的边界条件十分复杂且难以捕捉（比如计算机当地的本底辐射^[本体辐射是指人类生活环境本来存在的辐射，主要包括宇宙射线和自然界中天然放射性核素发出的射线。]波动值），可以认为用这个方法演算出来了真随机数。但实际上，这也只是非常接近真随机数的伪随机数，一般认为，无论是本地辐射、物理噪音、抛硬币……等都是可被观察了解的，任何基于经典力学产生的随机数，都只是伪随机数。

> 相应的，随机数也分为三类：

> * 伪随机数：满足第一个条件的随机数。
> * 密码学安全的伪随机数：同时满足前两个条件的随机数。可以通过密码学安全伪随机数生成器计算得出。
> * 真随机数：同时满足三个条件的随机数。

# Linux系统中的随机数设备

Linux以及一些类Unix系统中有随机数的特殊文件，一般如下：

* /dev/random :提供基于当前系统熵池^[指设备驱动程序或其它来源的背景噪声计算出来的某种结果]的真随机数
* /dev/urandom:是非阻塞的随机数生成器

两者都是CSPRNG^[Cryptographically Secure Pseudorandom Number Generator，加密安全的伪随机数生成器]，可以使用以下命令来输出：

```bash
od -An -N1 -i /dev/random
```

# 一些伪随机数生成算法

## 平方取中法

这个算法比较简单，由冯·诺伊曼在1946年提出。 算法步骤如下：

* 选择一个 ${\displaystyle m}$ 位数 ${\displaystyle N_{i}}$ 作为种子
* 计算 ${\displaystyle N_{i}^{2}}$
* 若 ${\displaystyle N_{i}^{2}}$不足 ${\displaystyle 2m}$个位，在前补0。在这个数选中间 ${\displaystyle m}$个位的数，即 ${\displaystyle 10^{\lfloor {\frac {m}{2}}\rfloor +1}} {\displaystyle 10^{\lfloor {\frac {m}{2}}\rfloor +1}}$至 ${\displaystyle 10^{\lfloor {\frac {m}{2}}\rfloor +m}} {\displaystyle 10^{\lfloor {\frac {m}{2}}\rfloor +m}}$的数，将结果作为 ${\displaystyle N_{i+1}}$


## 线性同余法

这个算法根据递归公式计算:

$$
X_{n+1}=\left(aX_{n}+c\right)~~{\bmod {~}}~m
$$

Java中的Random类就是使用就是这种算法。但这个不是密码学安全的随机数算法，如果要生成密码学安全的随机数，需要使用SecureRandom类来生成。

## Blum Blum Shub

采用如下的递归公式计算：

$$
x_{n+1}=x_{n}^{2}{\bmod  M}
$$

其中：$M=p\cdot q$是两个大素数p和q的乘积

例如令${\displaystyle p=11}$, ${\displaystyle q=19}$, ${\displaystyle s=3}$，则：

#. ${\displaystyle x_{0}=3^{2}{\bmod 209}=9}$
#. ${\displaystyle x_{1}=9^{2}{\bmod 209}=81}$
#. ${\displaystyle x_{2}=81^{2}{\bmod 209}=82}$
#. ${\displaystyle x_{3}=82^{2}{\bmod 209}=36}$
#. ...

除此之外，还有一些其他的随机数算法，便不过多介绍。

参考: 

* [Myths about /dev/urandom](http://www.2uo.de/myths-about-urandom/)
* [一个生成伪随机数的超级算法](http://www.cnblogs.com/Geometry/archive/2011/01/25/1944582.html)
