---
title: 再谈Micro Services Architecture
date: 2017-06-24
categories:  
    - Programing
    - MicroService
tags:
	- Docker
	- Api Gateway
	- BFF
---

再来谈一点我对微服务的理解。首先是微服务的一个服务划分问题。
<!--more-->
![Micro Services](https://cdn-1.wp.nginx.com/wp-content/uploads/2016/04/Richardson-microservices-part1-2_microservices-architecture.png)

这张架构图我觉得比价典型了，在设计微服务架构的时候，个人认为应该有以下可以考虑的：

* 每个服务应该按照业务功能去划分，相对要独立、小，但又不能过分细微否则微服务的数量和数据共享将变得复杂
* 每个微服务有自己的数据存储，不同的微服务不应该共享数据库存储；当然如果是对某一个微服务进行多部署和负载均衡，那么这些微服务可能会共享一个数据库或者数据库集群
* 微服务间应该只通过接口调用，不应该去直接读取其他接口的数据例如数据库
* 通常情况下，微服务内部不需要进行权限认证；但必须通过API Gateway暴露给外部系统
* 微服务接口应该添加版本号，这样如果接口定义有变动，可以在不影响系统的情况下实现逐步切换

微服务对外必须走Api Gateway的理由是：

* 可以通过Gateway实现介入的权限认证等
* 可以实现负载均衡，或者内部服务的切换而对外部来说是感觉不到变化的
* 对外提供一个统一的入口

再来说说一个我认为不好的设计。首先我们来说说`前端`和`后端`，在我看来，对于B/S架构来说，前端单单就是在浏览器运行的这一部分东西，但通常人们也会把微服务中的Front End称之为前端，比如一个NodeJS实现的HTML5客户端，那这里NodeJS的东西也会被认为是前端了。虽然这两个定义究竟是对是错没什么价值所在，但我发现我们的`前端`开发人员有着一个不好的习惯：

* 直接在前端的JS中调用微服务，通过一个api的代理直接访问了后端的一个服务（类似于Gateway的一个服务但是存在很多逻辑）

什么意思呢，就是说，把逻辑都写在客户端执行的Javascript中，而不是传统意义上的`后端`。这样做的实际问题有（我发现的）：

* 逻辑混乱，对于微服务来说不大可能会直接提供可用的接口，往往需要多次调用和自行处理，这样页面会请求很多接口，所有逻辑都在页面上，调试只能依赖于浏览器
* 性能问题，如果加载大量的数据对浏览器来说是噩梦，处理起来会依赖于客户端的性能
* 安全问题，相当于直接暴露了微服务的接口出来，这样本来可以在session中做的事情需要到cookie中做了

这里其实会有争议，那么如果是有这样的业务逻辑，应该写在哪里？假设现有的微服务都是很基础的微服务。

* 肯定不应该直接写在页面上
* 写在页面对应的后端上？
* 新建一个含有逻辑的微服务，在页面上调用这个微服务？

我觉得后两种都是可以考虑的，或者说可以同时存在的。首先从部署来讲，后端和微服务应该是部署在同一个网络内，从后端直接访问微服务时是不需要进行权限验证的；因此业务逻辑应该写在后端中，这样页面访问的接口只会得到一个结果而你不能看到具体的过程，这样在一定程度上是更安全和有效的。其次，如果业务逻辑比较复杂，或者说有需要在其他地方也使用，而现有的微服务没有直接的接口时，需要考虑新建一个处理业务的微服务来处理这些逻辑。即使是这样，仍然最好在服务器端来调用这些微服务。


参考：

* [Introduction to Microservices](https://www.nginx.com/blog/introduction-to-microservices/)
* [Building Microservices: Using an API Gateway](https://www.nginx.com/blog/building-microservices-using-an-api-gateway/)
* [Building Microservices: Inter-Process Communication in a Microservices Architecture](https://www.nginx.com/blog/building-microservices-inter-process-communication/)
* [Service Discovery in a Microservices Architecture](https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/)
* [Event-Driven Data Management for Microservices](https://www.nginx.com/blog/event-driven-data-management-microservices/)
* [Choosing a Microservices Deployment Strategy](https://www.nginx.com/blog/deploying-microservices/)
* [Refactoring a Monolith into Microservices](https://www.nginx.com/blog/refactoring-a-monolith-into-microservices/)
* [Pattern: Database per service](http://microservices.io/patterns/data/database-per-service.html)
* [PolyglotPersistence](https://martinfowler.com/bliki/PolyglotPersistence.html)
* [Developing Transactional Microservices Using Aggregates, Event Sourcing and CQRS - Part 1](https://www.infoq.com/articles/microservices-aggregates-events-cqrs-part-1-richardson)
* [Learn microservices](http://chrisrichardson.net/learnmicroservices.html)