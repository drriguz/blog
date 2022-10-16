---
title: The Grandest Staircase Of Them All
date: 2022-06-29
categories:  
    - 刨根问底
    - 算法
---
这是一个典型的动态规划算法问题。

<!-- more -->

# 问题

## 原题
With the LAMBCHOP doomsday device finished, Commander Lambda is preparing to debut on the galactic stage – but in order to make a grand entrance, Lambda needs a grand staircase! As the Commander’s personal assistant, you’ve been tasked with figuring out how to build the best staircase EVER.

Lambda has given you an overview of the types of bricks available, plus a budget. You can buy different amounts of the different types of bricks (for example, 3 little pink bricks, or 5 blue lace bricks). Commander Lambda wants to know how many different types of staircases can be built with each amount of bricks, so they can pick the one with the most options.

Each type of staircase should consist of 2 or more steps. No two steps are allowed to be at the same height - each step must be lower than the previous one. All steps must contain at least one brick. A step’s height is classified as the total amount of bricks that make up that step. For example, when N = 3, you have only 1 choice of how to build the staircase, with the first step having a height of 2 and the second step having a height of 1: (# indicates a brick)

```
#
##
21
```

When N = 4, you still only have 1 staircase choice:

```
#
#
##
31
```

But when N = 5, there are two ways you can build a staircase from the given bricks. The two staircases can have heights (4, 1) or (3, 2), as shown below:

```
#
#
#
##
41
#
##
##
32
```

Write a function called solution(n) that takes a positive integer n and returns the number of different staircases that can be built from exactly n bricks. n will always be at least 3 (so you can have a staircase at all), but no more than 200, because Commander Lambda’s not made of money!

## 简化题目
原题稍微有些冗余的信息，我们简化一下题目：总共有N块砖，求共有多少种方法建阶梯，以满足：

* 阶梯至少要有两级
* 每一级的高度不能一样

再简化一下，可以表示为数学问题：有自然数列1, 2, 3, ..., N，任取其中的k个不重复元素(k>=2)组合为一个新的数列S，求S和为N的所有组合数。这个也叫分区问题。

# 求解
首先手算一下简单的场景：

* N=3时，有{1, 2} 一种组合
* N=4时，有{1, 3} 一种组合
* N=5时，有{1, 4}、{2, 3}两种组合
* N=6时，有{1, 5}、{2, 4}、{1, 2, 3}三种
* ...

设$n, k \in N$, $P(n, k)$ 表示 [1, 2, ..., n] 中任取1至n个元素，总和为 $k$ 的组合总数。例如，$P(1, 1)$表示[1]中总和为1的子集合总数，显然只有1个；$P(5, 5)$表示[1, 2, 3, 4, 5]中总和为5的子集，有{5}， {1， 4}， {2, 3}三个。

现在来看，如何进行递推，找出一个递推公式。$P(n, k)$和$P(n-1, k)$的区别在于多了一个数n，那么，多的这一个元素有什么用呢？多的这一个数当然可能会产生新的组合。当$k$较小的时候，是没有差别的，比如$P(1, 1)$与$P(5, 1)$结果是一样的，因为多的这个数要想能够成为某个子集的元素，前提一定是$n \le k$。那么，即使满足又该怎么求呢？注意到，集合的总和为$k$，那么除了多的这数外，其他元素的总和必然为$k-n$。因此：

$$
P(n, k) = \\
\begin{cases}
P(n - 1, k) \quad (n \lt k) \\
P(n - 1, k) + P(n - 1, k - n) \quad (n \ge k) \\
\end{cases}
$$


计算一下N=10的场景。

| | k=1 | k=2 | k=3 | k=4 | k=5 | k=6 | k=7 | k=8 | k=9 | k=10 |
| --- |---|---|---|---|---|---|---|---|---|----|
| n=1   | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0  |
| n=2   | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| n=3   | 1 | 1 | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| n=4   | 1 | 1 | 2 | 2 | 2 | 1 | 1 | 0 | 0 | 0 |
| n=5   | 1 | 1 | 2 | 2 | 3 | 6 | 7 | 8 | 9 | 10 |
| n=6   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| n=7   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| n=8   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| n=9   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| n=10  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |