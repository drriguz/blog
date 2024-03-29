---
title: C#异步编程(1)：并发的实现基础
date: 2021-09-01
categories:  
    - 刨根问底
    - 并发编程
tags:
    - Async
    - Concurrent
---
从Java技术栈迁移到C#，一个最直观的不同是C#对异步编程的语法层面的支持:async/await。在此之前，我也在Javascript以及Dart等语言中使用过类似的功能，以至于我一度想当然地认为async/await是Javascript最先发明的；但当我去追根溯源的时候才发现这其实C#几乎是最早开始引入的(2012年的时候C# 5.0中正式引入)，比Javascript(ECMAScript 2017)整整领先了5年。不得不佩服，虽然没有很火，但是微软的技术前瞻性的确是做的很好的。

那异步编程到底是什么呢？我没有找到一个完全准确的释义，但是要解释清楚还是比较容易的:

* 程序执行无序等待一个任务的完成(比如I/O操作)
* 可以并发地执行多个任务

实际上，并发也即意味着任务之间不需要串行等待。我的理解是，异步编程的核心就是优雅的实现“并发”。

<!-- more -->

# 并发的实现基础

我看到一个例子比较生动的描述了同步和异步的区别。很久以前，有三个人Bob, Mary, 和Jane，他们饿得不行想吃东西，于是走到了一家餐馆里面。

这家餐馆经理Mr. Block奉行的政策是先来后到，Bob最先来到柜台，点了一个三明治。服务员说要3分钟才能做好，叫他就在那等着，于是Bob决定等。

Mary随后就进来了，也想点一个三明治，但是Bob还等着在，她只能排在Bob后面继续等。

Jane最后进来，想点一份沙拉。Bob和Mary在她的前面排着队等，但是她看到沙拉其实就在柜台后面，她想让服务员直接先给他上，但是服务员很礼貌说还没到她。于是Jane很生气，直接走了；看到Jane走了，Mary也不想等了，直接走掉了。

显然这样的服务体验是很差的，于是Mr. Block被老板给炒掉了，又雇了Mr. Defer当经理。他发现了问题的所在，他采取新的方式训练服务员。于是服务员让顾客点单之后先坐下等待，这样其他的顾客就可以在他们等待的时候同时点餐。同时，他还制定了一条新的政策，如果顾客点的是沙拉就不需要等待，因为沙拉可以立即做好。

第二天，Bob，Mary和Jane三个人又来到这家餐馆，决定再给它一次机会。Bob先进去，点了一份三明治，这次他点单之后，服务员给了他一个座位，可以坐着等了。

Mary随后进来，同样点了三明治，坐在Bob旁边等。

最后Jane进来了，点了沙拉，出乎她的意料，点的沙拉马上就好了，直接就端到旁边的空桌子上开始享用了。

由于服务好，餐馆生意越来越好，人也越来越多。这天午饭时间，一下来了40多个客人，因为天气太热，大多数人都点了沙拉，只有少数人点的是三明治。Bob又是最先进来的，点了最爱吃的三明治，但是后面三十几个人都点的沙拉。眼看着这些人点的沙拉都立马上了，三分钟也过去了，但是现在还有几个人在点沙拉，自己的三明治还没有上。终于等这些吃沙拉的人都点完了，服务员才空出来把自己的三明治送上来。

Bob今天不是特别开心，但是这个就是规矩:吃沙拉的不需要等待。这个例子比较生动的描述了同步和异步的处理方式，同步就是串行地一个一个去执行、一个任务没有完成时，下一个任务无法开始；而异步则可以同时有多个任务同时在执行，也即上一个任务还没结束，下一个任务就可以开始了。

## 任务切换和硬件并发

餐馆资源是有限的，并没有增加新的人手或者设备，为什么就能够提高收益呢？其原因就在于，资源虽然是一样的，但是其利用率不一样，显然改进工作方式之后，餐馆变得忙碌起来，等待的时间减少了，做的事情自然也就多了起来。

能够同时做多件事情，而不是串行去执行，是提高效率的关键。这就是所谓的”并发”(concurrency)。早先的计算机CPU是单核的，在某一个时刻只能执行一个任务，但是通过任务切换(task switching)的方式，仍然可以“同时”处理多个任务。也就是说，将CPU时间分片，然后分配到不同的任务上去，东敲一下、西敲一下，但是切换的时间非常快，以至于在外界看来，好像在同时做多件事情一样。

而现代的电脑普遍是多核处理器甚至有多个CPU，可以实现真正的硬件并发(hardware concurrency)。而且现在的处理器通常可以在一个核心上执行多个独立的线程(hyperthreading)，也即硬件线程(hardware threads)。例如酷睿i9-11900K 是8核心16线程。

## 用户空间和内核空间

操作系统为了支持多个应用同时运行，需要保证进程间相互隔离，以免不同的进程之间相互影响，比如修改操作系统的内存。因此操作系统将内存分配为用户空间和内核空间，并使用不同运行级别的CPU指令来控制访问权限，保证用户空间的程序不能直接读写内核空间的内存。

例如，32位的x86架构的内存寻址空间为2^32 = 4G，linux将其划分为3G(用户空间)/1G(内核空间)，windows则按照2G/2G进行划分。而对于程序来说，操作系统为其分配了虚拟地址空间(virtual address space)，并映射到物理内存上，每个进程的地址空间都是独立的(0~2^32)，从而实现了相互隔离。

内核空间可以调用系统的所有资源，但是用户空间不能直接调用系统资源；如果想访问系统资源只能通过系统调用(system call)切换到内核空间来完成，操作完成后再切换回用户空间。

除了系统调用外，中断(interrupt)也可以使得进程从用户态切换到内核态。

## 上下文切换

即便是强如i9-11900K也仅仅具有16个硬件线程，但是电脑上实际运行的线程数量肯定会超过这个数目，当超过硬件可并行的任务要执行的时候，会发生什么呢？

跟单核CPU一样，上述情况下任务切换仍将被使用。为了能够交替的运行不同的任务，操作系统需要保存当前任务的CPU状态和指令指针等，以便后面切换回来的时候可以恢复这些状态继续执行。这个过程称之为上下文切换(context switch)。

![](/images/Task-switch.png)

当发生上下文切换的时候，操作系统需要将当前任务的状态保存到PCB(process control block)中，其实就是内存中的一个区域，并加载要切换的任务的PCB。

![](/images/Context-Switching.jpg)

通过上下文切换的方式，操作系统实现了多任务处理，而根据处理策略的不同又可以分为:

* 抢占式多任务(preemptive multitasking):应用程序主动放弃执行权，通知操作系统执行下一个程序
* 协作式多任务(cooperative multitasking):进程的调度完全是由操作系统来决定的(根据进程的优先级)

通常应用程序可以分为两种:

* CPU密集型(CPU bound):大部分时间都花在计算上面，特点是CPU占用很高但是I/O设备占用低
* I/O密集型(I/O bound):I/O操作占用了很多的时间，一直在等待输入或者输出，这类任务通常CPU仍然处于比较低的负载

对于I/O密集型应用(例如Web程序)，在等待输入输出的过程中，抢占式多任务的操作系统可以将进程挂起，这样其他的进程就可以利用CPU，从而提高了CPU的利用率。

而对于CPU密集型应用，需要考虑任务切换的开销。任务越多，进行任务切换的时间也会很多，通常会采取跟硬件线程同等数量的线程来避免过多的上下文切换，同时需要想办法提高程序的执行效率。

## 编程语言对并发的支持

从应用程序编程实现的层面来看，不同的语言对并发的支持也不尽相同，首先是借助操作系统层面提供的多任务支持实现并发:

* 多进程(multiprocessing):在Unix/Linux操作系统下可以通过fork()系统调用来创建子进程。虽然每个进程只有一个主线程，但是多个进程可以一起执行多个任务。
* 多线程(multithreading):在一个进程里面开启多个线程执行任务，跟操作系统的线程所对应。这也是比较常见的方式，大多数编程语言都可以直接支持

除此之外，还可以在应用层面来实现多任务切换，这类实现的特点就是用较少的线程（或者进程）来支持很多任务的并发运行，常见的方式有:

* 协程(coroutine): 协程看上去也是子程序，但执行过程中，在子程序内部可中断，然后转而执行别的子程序，在适当的时候再返回来接着执行，特点在于是一个线程执行。但是协程这个东西虽然概念很早就有了，但本身没有很明确的定义，不同的语言上的实现方式也不尽相同。
* 事件轮询(event loop):典型的例子是JavaScript，通过轮询逐个处理事件，对于长时间的任务(如I/O)可以通过回调(callback)的方式，在其执行完成之后运行回调的操作，这样可以并行处理其他任务。
* 通信顺序进程(communicating sequential process): 用于描述两个独立的并发实体通过共享的通讯 channel(管道)进行通信的并发模型。 CSP中channel是第一类对象，它不关注发送消息的实体，而关注与发送消息时使用的channel。比如Go语言通过goroutine和channel实现了基于CSP的并发编程。

从编程语言的角度考虑，主要有两个问题：一个是如何实现并发？是采取多线程、还是基于事件来实现？另一个就是程序员如何来编写代码控制并发程序的运行？是采取回调，还是aysnc/await这样的语法？而经常语言会提供不止一种方式，也可能会将各种方式组合起来。

# 其他
## 一些容易混淆和疑惑的概念

### 并发和并行
说道并发(concurrency)，还有一个近义词是并行(parallelism)。那么这两者之间又什么区别么？其实刚刚前面也讲到过了，”并发“不一定是硬件并发，也可能是通过任务切换实现的，也就是说多个任务并不能在相同的时间运行。反之，“并行”则是真的多任务处理，可以等价于硬件并发。

也即是说，并行和并发都是描述多任务是如何被执行的，且并行是并发的一种特例。

### 同步/异步
同步(synchronous)、异步(asynchronous)通常指两种不同的编程模型。举个例子，下面的一段代码:

```javascript
func task1() { print("A") }
func task1() { print("B") }

func main() {
    task1()
    task2()
}
```

在同步的编程模型下，意味着task2一定会等到task1执行结束之后才开始执行；结果是可以预测的。而如果是异步的编程模型，那么task1和task2可能会同时执行，那么输出的结果可能是"AB"也可能是“BA”，是不可预测的。

### 阻塞/非阻塞
阻塞(blocking)、非阻塞(nonblocking)通常也会跟着同步和异步一起出现。而这几个概念如果要严格区分的话，是需要在不同的上下中进行讨论的:

#### 进程的阻塞
进程从创建后开始运行到执行完毕，会有一个完整的生命周期。前面提到，CPU通过时间分片的方式来调度执行不同的任务，当进程状态为ready的情况下就可以被调度执行，中断后又回到ready状态。

而有些时候进行了系统调用之后，这个系统调用(例如磁盘I/O)不能立即完成，需要等待一段时间，这时候内核将进程挂起为等待状态，使其不能继续被CPU调度执行。于是说，这个进程被阻塞了。

![](/images/Process-State.png)

要使得进程进入等待状态，可以通过调用wait()或者sleep()等将当前进程挂起，或者通过系统调用让内核将进程挂起。

一个典型的例子是进程间通信。进程间通信是通过send()和receive()两种操作完成的，消息的传递可能是通过阻塞或者非阻塞的————也被称作是同步或者异步的:

* 阻塞式发送(blocking send):发送方进程会一直阻塞知道消息被接收方收到。
* 非阻塞式发送(nonblocking send):发送方调用send()之后可以立即执行其他操作。
* 阻塞式接收(blocking receive):接收方调用receive()之后一直阻塞直到收到消息。
* 非阻塞式接受(nonblocking receive):接收方调用receive()之后要么立即得到结果，要么立即得到空值。

这里同步跟阻塞是同义的，异步跟非阻塞也是同义的。

#### I/O的阻塞/非阻塞

除了说进程被阻塞外，阻塞/非阻塞还经常跟I/O操作联系在一起，因为I/O操作涉及到系统调用，可能将进程阻塞。现在的操作系统提供了不同的I/O系统调用:

* 阻塞I/O:进行调用时会挂起应用，等待I/O操作完成
* 非阻塞I/O:不会挂起调用进程，而是立即返回一个值表示有多少字节读取或者写入成功。当内核数据还没有准备好的时候，系统调用会返回错误，调用进程需要不断调用来进行检查。
* 异步I/O:跟非阻塞I/O类似，立即返回，等待I/O操作完成后操作系统会通知调用进程

在这个场景下，非阻塞I/O跟异步I/O还是有一些差别:

* 非阻塞I/O虽然可以立即拿到数据，但是拿到的结果可能是空值，也可能是不完整的(部分)数据；异步调用拿到的结果是完整的。
* 非阻塞I/O从内核空间拷贝数据到用户空间的时候，这部分拷贝过程依然是阻塞的；而异步I/O是等待拷贝完成之后才通知调用进程，全程都是非阻塞的。

## 进程vs线程

了解了上面的这些之后，一个问题产生了:上面说的都是进程(process)，但通常我们实现并发都会通过多线程(thread)的方式，多线程会存在切换么？实际上，对于操作系统(这里只讨论linux)来说，进程和线程被同等对待为一个运行上下文(context of execution)，也即一系列状态的集合:

* CPU(例如寄存器)的状态
* 内存管理单元(MMU)的状态，包括内存页映射等
* 权限状态(uid, gid)
* 其他的通信状态(打开的文件句柄，信号处理器等)

在linux中，都被称之为任务(task)。就上下文切换来说，这两者的确又是有些差别的，主要在于虚拟地址空间:进程切换之后，虚拟地址空间会发生变化而线程切换则不会。

而上面提到的多进程和多线程都可以实现多任务处理，有什么区别么？

* 进程创建的开销比线程会稍微大一点，尤其是在windows上十分明显
* 多进程情况下，一个进程挂掉不会导致其他进程挂掉(除非是主进程)；但是多线程的情况下一个线程出错是有可能导致整个进程奔溃的。

* [Six Essential Tips for Async](https://channel9.msdn.com/Series/Three-Essential-Tips-for-Async)
* [Asynchronous programming with async and await](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/async/)
* https://www.zhihu.com/question/19732473
* https://foxbunny.gitbooks.io/assimilate-js/content/async.html
* https://community.intel.com/t5/Software-Archive/what-is-the-relation-between-quot-hardware-thread-quot-and-quot/m-p/1016636
* https://en.wikipedia.org/wiki/Computer_multitasking