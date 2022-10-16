---
title: Trunk-based development与git-flow
date: 2021/11/29
categories:  
    - 闲话编程
    - 开发实践
---
在我经历的每一个项目，几乎都要去讨论的一个事情就是到底用什么git的分支策略，在向来以技术卓越著称的Thoughtworks内部，也无法真正每个项目都有一致的实践，大家都很推崇Trunk-based开发方式，但很少有见到落地的。

然后我发现，即使退回到git-flow，也几乎没有人真正理解它，于是出现这样一个奇怪的现象：

每个项目都自己发明了一套workflow，它既不是标准的Trunk-based，也不是标准的git-flow，很可能跟github-flow或者gitlab-flow接近，总之来说，就是不标准。当然很可能这些差异是更好的，但坦率来讲，如果连基本的git-flow或者trunk-based方法都不理解的话，也很难知道它的好处和不好，又谈何是改进呢？

<!-- more -->

# git-flow模型

git-flow源于2010年一篇A successful Git branching model的文章[A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model)，在这10年间被很多团队采用并成为了一个事实上的“标准做法”。^[作者自己在2020年做了补充说明，认为10年来发生了一些变化，使用Git开发已经成为潮流且更多的应用在向Web APP方向发展。Web应用跟其他的项目有一个比较大的区别就是：Web应用通常持续集成，有问题通常会直接修复了发布而不会回退，不需要同时支持多个版本。这种情况下，作者建议使用更简单的方式如GitHub-flow代替。但同时，作者认为git-flow仍然很好的适用于以下的场景：构建多版本应用（或者说需要同时支持不同的版本）]

![](/images/Gitflow.drawio.svg)

## 主分支

在这种模型下，git仓库中有两个分支是一直存在的：

* origin/master(或者main)：这个分支上的最新代码**永远是production-ready的**^[We consider origin/master to be the main branch where the source code of HEAD always reflects a production-ready state.]
* origin/develop：这个分支上的代码永远是下一个发布的最新的交付代码^[We consider origin/develop to be the main branch where the source code of HEAD always reflects a state with the latest delivered development changes for the next release. ]。也可以称为“集成分支”，用于进行每日构建（nightly builds）

当develop分支上的代码达到了上线的标准之后，这些改动就会merge回master分支，并打上release版本号的标签。合并代码到master也就意味着新的产品发布，可以使用web hook来自动进行发布过程：每当master分支有commit的时候自动进行编译、发布等操作发布到生产环境。^[Therefore, each time when changes are merged back into master, this is a new production release by definition. We tend to be very strict at this, so that theoretically, we could use a Git hook script to automatically build and roll-out our software to our production servers everytime there was a commit on master.]

## 辅助分支

除了主分支外，在开发的过程中还有一些辅助分支用来完成开发、发布以及线上问题修复等。这些分支都是临时性的，最终会被从git中移除^[Unlike the main branches, these branches always have a limited life time, since they will be removed eventually.]。

### feature分支

feature分支用来开发在未来发布的新功能，但具体在哪个版本进行发布可能还是未知的，它：

* 从develop分支拉取创建
* 开发完成后合并回develop分支（意味着下一次发布会包含这个新功能）
* 或者被丢弃掉（例如发现这个功能影响用户体验）

```bash
git checkout -b myfeature develop
```

```bash
git checkout develop
git merge --no-ff myfeature
git branch -d myfeature
git push origin develop
```

### release分支

release分支用来进行发布的准备工作，其：

* 从develop分支拉取创建
* 完成后必须合并回develop、master分支
* 命名惯例是release-*

releas分支可以在生产发布之前做最后的一些操作，例如：

* 一些小的bug修复
* 更新发布产品的元数据，如版本号等

这样，当release分支创建完成之后，develop分支可以继续下一个发布的开发工作。拉取release分支的时机为，develop分支几乎达到了可以发布的状态，至少所有这次发布的feature需要首先合并完成到develop分支中。如果还有其他的不希望在这次上线发布的feature，必须要等到release分支拉完之后才能合并到develop上。

```bash
git checkout -b release-1.2 develop

# 在release分支更新版本号
./bump-version.sh 1.2
git commit -a -m "Bumped version number to 1.2"
```

```bash
# merge回master并打tag
git checkout master
git merge --no-ff release-1.2
git tag -a 1.2

# merge回develop
git checkout develop
git merge --no-ff release-1.2

# 删除分支
git branch -d release-1.2
```

### hotfix分支

hotfix分支用于紧急修复当前线上的版本的问题，其：

* 从master分支拉取创建
* 完成后合并会develop和master。有特殊情况就是，如果当前有release分支（意味着这个releas还没有上线，上线之后应该删除release分支），那么应该合并到release分支而不是直接到develop分支
* 命名惯例为hotfix-*

```bash
git checkout -b hotfix-1.2.1 master

# 检出hotfix分支之后，首先更新版本号
./bump-version.sh 1.2.1
git commit -a -m "Bumped version number to 1.2.1"

# ...
# 修复问题之后，提交
git commit -m "Fixed severe production problem"
```

```bash
# merge到master以便上线到生产
git checkout master
git merge --no-ff hotfix-1.2.1

# 打这次上线的tag
git tag -a 1.2.1

# merge回develop
git checkout develop
git merge --no-ff hotfix-1.2.1

# 删除hotfix分支
git branch -d hotfix-1.2.1
```

## 注意事项

### 关键节点
feature分支在合并的时候，代码reviewer应该检查：

* 确定这个需求是下个版本要发布的
* 确定开发本地自测通过
* 确认feature的pipeline构建通过
* review代码发现问题修改完成

合并到develop分支后，开发应该检查：

* develop的pipeline通过
* 在测试环境进行测试功能通过

然后，开发提测后，测试需要执行：

* 确认develop的pipeline当前是通过的状态
* 触发QA的pipeline，将最新的开发代码部署到QA环境
* 在测试环境进行测试，如遇到问题则及时通知开发修复

### 如果一个feature开发完成，合并之后又发现问题，这时候还可以继续开发之后然后合并么？
可以（但不建议）。feature分支的生命周期是对应到一个具体的功能的，发布到develop仅仅意味着其开发工作完成，但是很有可能在测试的时候会发现问题。那么，如果这个分支还存在的话，使用其继续进行修改和提交（而不是重新建一个其他的分支）是更简洁的做法。

### 为什么合并代码的时候一定要用--no-ff选项？
因为如果不加--no-ff选项，合并之后会丢失分支的信息

### 为什么辅助性的分支完成后要删除？
删除分支可以保持git清晰，尤其是release/hotfix分支完成之后删除可以避免错误提交到这些分支上。

* 对release分支来说，在merge到master之前，是可以继续在release分支上面进行提交，修复小的错误的
* 对于release分支来说，一旦merge到master就意味着创建了一个新的release，这个release分支的使命也就结束了；如果在此之后发现问题，应该由hotfix分支来完成
* 如果在release分支没有merge到master分支之前，发现现在线上的问题；那么同样需要使用hotfix分支进行，不能直接在release分支上修改。因为hotfix意味着是紧急的改动，必须尽快上线以减少影响；而release分支包含的是下次的新功能，如果一起发布会增加不确定性

## 错误做法

### 固定的辅助分支

除了主分支之外，辅助分支都应该是暂时性、短期存在的；如果一个辅助分支长期存活那么一定是不正确的，通常有这些做法会导致这样的问题：

* 每个开发人员一个“开发分支”，而不是使用短期存活的feature分支：这样导致仓库中会有多条长期存活且需要不断更新的分支，无法明确看出每一个功能的起止，并增加了维护分支的负担
* 使用固定的release分支，而不是每一个release单独拉取分支：同样造成realease分支不能删除，release之间的界限不清晰，容易造成混乱

### 在release分支上进行hotfix

一个常见的可能的错误做法就是直接在release分支上进行hotfix。所谓hotfix一定是指对当前线上已经发布的产品的修复，如果release分支已经拉取但是还没有合并到master分支，那么这时候产生的bug修复不是hotfix。下面两种情况可能造成在release上进行hotfix:

* release还没有合并到master，但是上一个release发现问题：如果直接在新的release分支上修复，会带来额外的不确定性，即既要修复之前的问题、又要上新功能，增加了上线风险
* release已经合并但是并没有删除release分支，这时候又在之前这个release分支上进行修改：release分支对应到一个特定的版本，凡是有新的上线应该视作一次新的版本，如果在已经上线的release分支上操作会造成分支及版本混乱

# trunk-based development模型

Trunk based是一种git分支策略，或者叫工作流，其他还有如Gitflow、基于分支的开发模式等，均比较麻烦，且存在一些已知的问题。使用这个模型跟CI/CD结合，其开发流程大致为：

* 主干（master）一般不能直接提交，除非是非常小的团队，可以直接在master上提交
开发在短期存活的feature分支上开发，提交之后会自动触发CI，执行基本的检查/测试任务
feature分支开发完成、且CI通过后，可以通过pull request合并到主干。这时候，合并者有必要对代码进行review，确认无问题方可合并。
* 合并后，产生一个Merge的commit，这个commit的id会被作为Docker镜像的tag。自动触发CI，并会打包Docker镜像、自动部署到DEV环境。在DEV环境开发自测没有问题的时候，可以通知QA提测，并告知tag
* 测试人员手动部署该tag到QA环境进行测试
* 每次发布之前，需要拉一个release分支，这个分支同样会进行构建/打包等CI过程；如果上线发现问题，需要在主干上重现、修复，然后cherry-pick到release分支上。这时候，QA需要将release分支上打包的镜像部署到QA环境进行回归测试，无问题后再发布该镜像到生产
每次发布生产时都需要打一个git的tag，release完成后，可删除release分支

![](/images/Trunk-based.svg)

* https://medium.com/burdaforward/state-of-ci-cd-and-the-dreaded-git-flow-fce92d04fb07
* https://proandroiddev.com/how-to-set-up-an-efficient-development-workflow-with-git-and-ci-cd-5e8916f6bece