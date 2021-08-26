---
title: 新的配置文件格式
date: 2018-02-24
categories:  
    - 闲话编程
    - Java
---
程序中大都需要定义各种配置，诸如数据库连接之类的，最近也需要开发Web框架，于是也想找个比较好用的配置文件格式。搞来搞去，发现都不是很喜欢。先来看一下几种常见的配置文件格式吧：
<!--more-->
### Properties
Java所带来的Properties文件可能是用的比较多的格式了吧，就是一个简单的key-value的文本文件，但是缺点也很明显：
* Unicode需要转码，看着不是很蛋疼么？
* 不支持数组类型，所以以前经常会用key.1,key.2...key.n这样的方式来遍历得到一个数组
* 扁平结构，如果碰到一些比较长的key就有点不好看了（比如SpringCloud的配置，spring.jpa.datasource.xxx)写起来比较麻烦
```properties
spring.data.mongodb.host= localhost
spring.data.mongodb.port=27017 # the connection port (defaults to 27107)
spring.data.mongodb.uri=mongodb://localhost/test # connection URL
spring.data.mongo.repositories.enabled=true # if spring data repository support is enabled
```
### Yaml/TOML
Yaml好像很流行的样子，我们在springcloud的项目中大量使用，但是说实话这个格式我也不喜欢，为啥？
* 依赖于缩进，复制粘贴的时候麻烦了
* 语法有点复杂了
TOML感觉和YAML差不多，也挺复杂的样子。
```yaml
# Zuul
zuul:
  host:
    connect-timeout-millis: 50000
    socket-timeout-millis: 10000


# Hystrix
hystrix:
  command:
    default:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 10000
```

### Ini
Windows所带来的格式，优点是可以带分组，好像比Properties文件更舒服一点，但是对于上面提到的缺点也有。

```ini
[curentUser]      ;  this is a Section
name=wisdo     ; this is Parameters
organization=cnblogs   ; this is Parameters
 
[database] 
server=127.0.0.0   ; use IP address in case network name resolution is not working 
port=143 
file = "user.dat" 
```

### JSON/LUA
Json的缺点在于你要用很多个引号，同时最大的问题在于不支持注释。Lua可能是我最想用的脚本了，但是在Java中使用也比较麻烦，尤其是我想手写一个配置文件解析器，这样就麻烦了（主要是不会）。

还有Ini + Json的方法，但是感觉也比较丑，于是想来想去，还不如按照自己的意愿发明一种配置文件格式好了，主要有以下的考虑：
* 语法应该简单，不需要依赖缩进
* 支持数组
* 支持使用变量（类似shell）
* 支持Unicode，中文直接写，所见即所得
* 支持某种形式的命名空间（类似ini中的section）来对配置进行分组
* 支持注释
* 支持多行字符串
* 格式好看...

目前正在计划中，准备利用Antlr实现解析。
