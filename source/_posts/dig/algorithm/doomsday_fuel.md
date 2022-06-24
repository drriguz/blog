---
title: 用吸收马克洛夫链解Doomsday Fuel问题
date: 2022-06-22
categories:  
    - 刨根问底
    - 算法
---
这是在做Google foobar挑战的第三关时遇到的问题，相对于前两关而言，这个问题的难度明显增大了不少，需要一定的数学知识才能完成。

<!-- more -->

# 问题描述

## Doomsday Fuel

Making fuel for the LAMBCHOP's reactor core is a tricky process because of the exotic matter involved. It starts as raw ore, then during processing, begins randomly changing between forms, eventually reaching a stable form. There may be multiple stable forms that a sample could ultimately reach, not all of which are useful as fuel. 

Commander Lambda has tasked you to help the scientists increase fuel creation efficiency by predicting the end state of a given ore sample. You have carefully studied the different structures that the ore can take and which transitions it undergoes. It appears that, while random, the probability of each structure transforming is fixed. That is, each time the ore is in 1 state, it has the same probabilities of entering the next state (which might be the same state).  You have recorded the observed transitions in a matrix. The others in the lab have hypothesized more exotic forms that the ore can become, but you haven't seen all of them.

Write a function solution(m) that takes an array of array of nonnegative ints representing how many times that state has gone to the next state and return an array of ints for each terminal state giving the exact probabilities of each terminal state, represented as the numerator for each state, then the denominator for all of them at the end and in simplest form. The matrix is at most 10 by 10. It is guaranteed that no matter which state the ore is in, there is a path from that state to a terminal state. That is, the processing will always eventually end in a stable state. The ore starts in state 0. The denominator will fit within a signed 32-bit integer during the calculation, as long as the fraction is simplified regularly. 

For example, consider the matrix m:
```
[
  [0,1,0,0,0,1],  # s0, the initial state, goes to s1 and s5 with equal probability
  [4,0,0,3,2,0],  # s1 can become s0, s3, or s4, but with different probabilities
  [0,0,0,0,0,0],  # s2 is terminal, and unreachable (never observed in practice)
  [0,0,0,0,0,0],  # s3 is terminal
  [0,0,0,0,0,0],  # s4 is terminal
  [0,0,0,0,0,0],  # s5 is terminal
]
```
So, we can consider different paths to terminal states, such as:

* s0 -> s1 -> s3
* s0 -> s1 -> s0 -> s1 -> s0 -> s1 -> s4
* s0 -> s1 -> s0 -> s5

Tracing the probabilities of each, we find that

* s2 has probability 0
* s3 has probability 3/14
* s4 has probability 1/7
* s5 has probability 9/14

So, putting that together, and making a common denominator, gives an answer in the form of
[s2.numerator, s3.numerator, s4.numerator, s5.numerator, denominator] which is
[0, 3, 2, 9, 14].

## 问题分析
这个问题前面的描述几乎可以忽略，可以简化一下：

* 有一系列的状态，如s0, s1, ..., s5
* 一个状态以固定的概率迁移到另一个状态，采用矩阵的形式描述了不同状态间迁移的概率。注意矩阵里面给的是次数而不是概率，比如第一列数据 [0,1,0,0,0,1]，那么s0迁移到s1和s5的概率就是1/2, 1/2
* 终止状态不能迁移到其他状态

那么，题目最后要求得出的概率是怎么算出来的？s2很简单，没有可达的路径，肯定为0。但是s3为啥是3/14?

从数据可以看出，要到达s3，除了从s1直接到s3外，s0 -> s1本身是存在一个环的，可以重复很多次：

* s0 -> s1 -> s3，概率为$\frac{1}{2} \times \frac{3}{9}=\frac{1}{6}$
* s0 -> s1 -> s0 -> s1 -> s3, 概率为$\frac{1}{2} \times \frac{4}{9} \times \frac{1}{2} \times \frac{3}{9}=\frac{2}{9} \times \frac{1}{6}$
* s0 -> s1 -> s0 -> s1 -> s0 -> s1-> s3, 概率为$\frac{1}{2} \times \frac{4}{9} \times \frac{1}{2} \times \frac{4}{9} \times \frac{1}{2} \times \frac{3}{9}=\left(\frac{2}{9} \right)^2 \times \frac{1}{6}$
* ...

因此，综合所有情况，s3对应的概率为:
$$
\begin{align}
\sum_{i = 0}^{n}{\frac{1}{6} \times \left(\frac{2}{9} \right)^n} &= \frac{1}{6} \times \sum_{i = 0}^{n}{\left(\frac{2}{9} \right)^n} \\
  &= \frac{1}{6} \times \left(\frac{1}{1-\frac{2}{9}} \right) \\
  &= \frac{1}{6} \times \frac{9}{7} \\
  &= \frac{3}{14}
\end{align}
$$

这里用到了等比数列的无限项之和公式，即：
$$
\begin{align}
&S_{n} = a + ar + ar^2 + ... + ar^{n - 1} ..., r \in (-1, 1) \\
&S_{\infty} = \frac{a}{1 - r}
\end{align}
$$

这样倒是能够算出来概率，但是如何用程序计算呢？这可难倒我了，正常的思维是用有向图来处理，根据图计算每一条可达路径上，并将其概率相加得到最终的概率。但是这个是有环的图，这种图怎么样计算路径，并计算概率呢？思来想去也没有找到一个方法可以直接计算。倒是可以将有环图去掉环，变成无环图，然后进行一些特殊标记之类的，但处理之后是否正确，又如何能够适应各种情况（一环套一环），是很难去证明的。

因此我意识到，通过以上的数学知识是难以解决这个问题的。

# 马尔科夫链
马尔科夫链描述的是一个状态迁移到另一个状态时的概率是确定的，仅跟之前的状态有关。而解决这个问题可以用到马尔科夫链(Markov Chain)的一个特殊版本，吸收马尔科夫链(Absorbing Markov Chain)。吸收马尔科夫链是指所有状态最终能到达一个“吸收态”，一旦到达这个状态之后，就不能离开（是不是像个黑洞？）

吸收马尔科夫链需要满足如下条件：

* 存在至少一个吸收态
* 从任意一个状态都可以经过有限步到达一个吸收态

这样再回过头来看题目，是不是完全满足吸收马尔科夫链的条件！

吸收马尔科夫链的转移矩阵P可以表示为:
$$
P = \begin{pmatrix} Q & R \\ 0  & I_{r} \end{pmatrix}
$$

设马尔科夫链中有t个瞬时态，r个吸收态，则：

* Q为txt的瞬时态转移概率
* R为txr瞬时态到吸收态的概率
* I为rxr单位矩阵

吸收态马尔科夫链有一个很重要的性质，就是吸收态的概率可以通过下面的公式直接计算出来：

$$
\begin{align}
&N =(I_{t} - Q)^{-1} \\
&B = NR
\end{align}
$$

以上面的题目为例，
```
[0,1,0,0,0,1],  # s0, the initial state, goes to s1 and s5 with equal probability
[4,0,0,3,2,0],  # s1 can become s0, s3, or s4, but with different probabilities
[0,0,0,0,0,0],  # s2 is terminal, and unreachable (never observed in practice)
[0,0,0,0,0,0],  # s3 is terminal
[0,0,0,0,0,0],  # s4 is terminal
[0,0,0,0,0,0],  # s5 is terminal
```

s0, s1为瞬时态，s2, s3, s4, s5为吸收态。有：
$$
\begin{align}
& Q=\begin{pmatrix} 0 & \frac{1}{2} \\ \frac{4}{9} & 0 \end{pmatrix} \\
& R=\begin{pmatrix} 0 & 0 & 0 & \frac{1}{2} \\ 0 & \frac{3}{9}  & \frac{2}{9} & 0\end{pmatrix} \\
& I = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} 
\end{align}
$$

则可计算出：
$$
\begin{align}
N &=(I_{t} - Q)^{-1} \\
  &=\left( \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} - \begin{pmatrix} 0 & \frac{1}{2} \\ \frac{4}{9} & 0 \end{pmatrix}
\right) ^{-1} \\
  &= \begin{pmatrix} 1 & -\frac{1}{2} \\ -\frac{4}{9} & 1 \end{pmatrix}^{-1} \\
  &= \frac{1}{1 \times 1 - ((-\frac{1}{2}) \times (-\frac{4}{9}))}\begin{pmatrix} 1 & \frac{1}{2} \\ \frac{4}{9} & 1 \end{pmatrix} \\
  &= \frac{9}{7}\begin{pmatrix} 1 & \frac{1}{2} \\ \frac{4}{9} & 1 \end{pmatrix} \\
  &=\begin{pmatrix} \frac{9}{7} & \frac{9}{14} \\ \frac{4}{7} & \frac{9}{7} \end{pmatrix}
\end{align}
$$

从而，得出吸收态的概率为：
$$
\begin{align}
B &= NR \\
  &= \begin{pmatrix} \frac{9}{7} & \frac{9}{14} \\ \frac{4}{7} & \frac{9}{7} \end{pmatrix} \times \begin{pmatrix} 0 & 0 & 0 & \frac{1}{2} \\ 0 & \frac{3}{9}  & \frac{2}{9} & 0\end{pmatrix} \\
  & = \begin{pmatrix} 0 & \frac{3}{14} & \frac{1}{7} & \frac{9}{14} \\ 0 & \frac{3}{7} & \frac{2}{7} & \frac{2}{7}\end{pmatrix}
\end{align}
$$

如上，第一列和第二列分别代表从s0和s1两个瞬时态开始到达吸收态的概率。因此，第一列就是题目所要求解的结果了。再看另一个例子，

```
Input:
Solution.solution({
  {0, 2, 1, 0, 0}, 
  {0, 0, 0, 3, 4}, 
  {0, 0, 0, 0, 0}, 
  {0, 0, 0, 0, 0}, 
  {0, 0, 0, 0, 0}})
Output:
    [7, 6, 8, 21]
```

同样，先计算：

$$
\begin{align}
& Q=\begin{pmatrix} 0 & \frac{2}{3} \\ 0 & 0 \end{pmatrix} \\
& R=\begin{pmatrix} \frac{1}{3} & 0 & 0 \\ 0 & \frac{3}{7}  & \frac{4}{7}\end{pmatrix} \\
& I_{t} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} \\
& N = \begin{pmatrix} 1 & \frac{2}{3} \\ 0 & 1 \end{pmatrix} \\
& B = \begin{pmatrix} \frac{1}{3} & \frac{2}{7} & \frac{8}{21} \\ 0 & \frac{3}{7} & \frac{4}{7} \end{pmatrix} 
\end{align}
$$
