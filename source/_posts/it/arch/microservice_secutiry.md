---
title: Microservice中的安全策略
date: 2020-12-4
categories:  
    - Programing
    - Distributed
tags:
	- Docker
	- Api Gateway
	- BFF
	- MicroService
---
最近在思考微服务中的安全问题，在读Chris Richardson的文章的时候，发现自己对微服务有了一些新的认识和理解:p。

如图所示是一个典型的微服务架构：

![Problem](/images/microservice_security_problem.png)

这个架构下有如下的需求场景：

* 不同的APP会消费微服务，通常需求会有差别
* 有些微服务还会希望暴露给第三方的系统进行消费
* 具体的服务通常在设计API的时候会尽量考虑通用，但是实际消费服务的时候并不能完全满足需求，还需要二次加工，或者将多个服务的调用进行组合。

<!-- more -->
# BFF和API Gateway
在微服务架构中，有两个比较常用的概念是”API Gateway“和”Backend for Frontend(BFF)“，实际上是为了解决不同的问题而产生的解决方法：

* API Gateway解决了消费端消费微服务没有统一的入口的问题。通过API Gateway的路由，消费者只需要一个看起来“统一”的入口就可以调用所需的服务，而不是分别调用多个服务
* BFF解决问题是，有一些API并不是能够直接满足需求，需要进行组合、切割以及一些额外的逻辑进行处理，但将这些操作放在客户端解决可能会存在性能问题并对前端引入额外的复杂性。尤其是对于使用Native app技术（区别于传统的server side）的应用来说，欠缺在前端处理较为复杂的业务逻辑的能力，有的时候，微服务暴露的协议可能并不能直接在浏览器中支持，这会带来更大的麻烦。这些时候，一个server side的后端是很有必要的。

一直以来比较困扰我的是，API Gateway和BFF这两个东西究竟应该如何使用，是应该把API Gateway放在入口，让所有消费者像消费一个单体服务一样来消费微服务；还是应该将"BFF"本身作为一个微服务，跟其他服务一样藏在API gateway之后呢？

![API Gateway vs BFF](/images/api_gateway_bff_confused.png)

之前的实践方式通常为一个API Gateway用Zuul实现，一个BFF就是一个正常的微服务，正是受限于这种方式导致一直以来我的误解是，API Gateway和BFF是两个不同的东西，是分开部署的；而没有思考这两个东西其实是解决不同维度的问题而产生的，其实是可以共存的一个概念。

![API Gateway vs BFF](/images/microservice_bff_and_api_gateway.png)

如上所示，第一种方法是对于不同的应用分别定制不同的BFF，这里实际上BFF也可以充当API Gateway的作用；而第二种对于不同的APP使用相同的API Gateway，同样也可以在其中实习定制化的逻辑，为消费者提供优化后的API。

# 安全控制

![OAuth2 in Microservices](/images/api_gateway_oauth.png)

如图所示，是一个使用Oauth2标准的授权访问流程，这里有几点值得关注：

* API Gateway负责了access_token的验证以及刷新
* 后端service需要通过OAuth2 Server来校验access_token，因为access_token中并不包含任何的身份信息

<!-- tbd -->

References:

* [Pattern: API Gateway / Backends for Frontends](https://microservices.io/patterns/apigateway.html)
* [ Microservices Security in Action](https://livebook.manning.com/book/microservices-security-in-action/welcome/v-8/)
