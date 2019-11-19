---
title: 一个数据导入的有趣问题
date: 2019-01-14
categories:  
    - Programing
    - MicroService
tags:
	- ETL
	- Migration
---

相比于传统的单体应用，在基于微服务架构的系统中进行数据导入的操作显得更加复杂一点。通常而言，微服务的架构中包含了多个服务，服务的技术架构也可能大相径庭，同时考虑到拓展的需要，每个服务都有可能会拓展成多个instance。最近遇到一个有趣的问题，进行了一些思考。
<!-- more -->
场景大致是这样的：

* 我们有一个单独的service（以下简称SM），每天定时从一个目录读取文件（一个压缩包）。其中这个包中包括多个文件，分别对应到不同的业务数据，这些数据又影响到多个不同的service（以下简称SA，SB，SC）
* 于是SM读取到文件之后，解析文件，并通过消息发送给SA，SB，SC。收到消息大小的限制，文件中的内容不能一次性发送完成，需要拆分成N个消息（比如每200条数据一个消息）
* SA，SB都是增量更新，因此收到数据后，要么新增，要么更新，就可以了。很完美。
* 但是SC确每次都是全量更新。

问题来了，如果按照SA，SB的做法，SC面临的问题有两个：

* 如果没有办法区分一条数据是新增还是更新，那直接有问题
* 即便可以，如何能删除多余的数据？ 譬如原来有200条，现在过来150条，这150条更新了，多余的50条则没有办法删除

一个直接的办法是在SM开始的时候，先去SC删除所有的数据，然后再将数据发送过去就可以了。但是这样带来的问题就是，万一后面导入失败了，而删除已经做了，会造成以前的数据也不可用。这在我们的业务场景里面是比较致命的，应该至少保证同步失败的时候，保持上一次的数据。基于这个场景，想了一个解决方案:

* 在数据表中加一个version字段标识，表示是哪一批次的数据
* 创建一个视图，根据version来查询出最新的数据
* 同步完成之后，更新视图

下面详细来说。假定我们是一个K-V类似的配置的导入，首先创建表和视图:

```sql
create table t_raw_config(
id int not null primary key auto_increment,
`version` char(6) not null,
name varchar(50) not null,
value varchar(100)
);

create view t_config
as
select id, name, value from t_raw_config;
```

在SM中，我们需要做的事情是：

* 在导入开始的时候，生成一个唯一的version，简单一点，我们根据日期来，比如${\displaystyle version=20190101}$
* 假定有1001条数据，每200个拆分成1个message，则有6个${\displaystyle message=\{1, 2, 3, 4, 5, 6\}}$
* SC中，每消费完成一个message，则记录下消费的message到一个列表中，例如${\displaystyle  messages20190101 = \{1, 2\}}$（例如存储在redis中）
* SM中解析完成后，告知SC所有的message，即${\displaystyle message=\{1, 2, 3, 4, 5, 6\}}$
* SC收到告知后，比对${\displaystyle  messages20190101}$是否与${\displaystyle message=\{1, 2, 3, 4, 5, 6\}}$匹配，如果不匹配则等待（可以利用redis的BLPOP实现，如果不匹配则不断去BLPOP）
* 所有的消息都消费完成后，更新视图，将version设置为${\displaystyle version=20190101}$。如果考虑到性能问题，可以再version字段上建索引；考虑空间问题，可以在这一步以前version的数据




