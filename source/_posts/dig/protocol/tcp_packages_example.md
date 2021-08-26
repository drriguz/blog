---
title: TCP(2)：TCP报文实例
date: 2020-09-14
categories:  
    - 刨根问底
    - 协议
tags:   
    - TCP/IP
---

TCP每个报文都有一个序列号，这个序列号在初始的时候是随机生成的（而不是直接使用0或者1），那么这样做的原因究竟是为什么？

<!-- more -->

# TCP 实例
使用[Wireshark](https://www.wireshark.org/)和[SocketTest](https://sourceforge.net/projects/sockettest/)在本地进行数据发送和接收，可以抓取到TCP报文。首先使用SocketTest在本地(127.0.0.1)的10240端口上启动一个Socket服务器，然后使用它的客户端功能连接这个端口，并在Wireshark中监听本地回环网卡(localhost)，即可抓取到对应的数据包。

## 三次握手

![3-way Handshake](/images/Wireshark-lo-1.png)

可以看出，是一个标准的三次握手的过程，握手完成之后，服务端给客户端发送了一个Window Update。

### 1:客户端发送SYN

```lua
Frame 13: 68 bytes on wire (544 bits), 68 bytes captured (544 bits) on interface lo0, id 0
Null/Loopback
Internet Protocol Version 4, Src: 127.0.0.1, Dst: 127.0.0.1
Transmission Control Protocol, Src Port: 64255, Dst Port: 10240, Seq: 0, Len: 0
    Source Port: 64255
    Destination Port: 10240
    [Stream index: 0]
    [TCP Segment Len: 0]
    Sequence number: 0    (relative sequence number)
    Sequence number (raw): 3261314628
    [Next sequence number: 1    (relative sequence number)]
    Acknowledgment number: 0
    Acknowledgment number (raw): 0
    1011 .... = Header Length: 44 bytes (11)
    Flags: 0x002 (SYN)
    Window size value: 65535
    [Calculated window size: 65535]
    Checksum: 0xfe34 [unverified]
    [Checksum Status: Unverified]
    Urgent pointer: 0
    Options: (24 bytes), Maximum segment size, No-Operation (NOP), Window scale, No-Operation (NOP), No-Operation (NOP), Timestamps, SACK permitted, End of Option List (EOL)
        TCP Option - Maximum segment size: 16344 bytes
        TCP Option - No-Operation (NOP)
        TCP Option - Window scale: 6 (multiply by 64)
        TCP Option - No-Operation (NOP)
        TCP Option - No-Operation (NOP)
        TCP Option - Timestamps: TSval 740812626, TSecr 0
        TCP Option - SACK permitted
        TCP Option - End of Option List (EOL)
    [Timestamps]
```

### 2:服务端回复SYN/ACK

```lua
Frame 14: 68 bytes on wire (544 bits), 68 bytes captured (544 bits) on interface lo0, id 0
Null/Loopback
Internet Protocol Version 4, Src: 127.0.0.1, Dst: 127.0.0.1
Transmission Control Protocol, Src Port: 10240, Dst Port: 64255, Seq: 0, Ack: 1, Len: 0
    Source Port: 10240
    Destination Port: 64255
    [Stream index: 0]
    [TCP Segment Len: 0]
    Sequence number: 0    (relative sequence number)
    Sequence number (raw): 1175996045
    [Next sequence number: 1    (relative sequence number)]
    Acknowledgment number: 1    (relative ack number)
    Acknowledgment number (raw): 3261314629
    1011 .... = Header Length: 44 bytes (11)
    Flags: 0x012 (SYN, ACK)
    Window size value: 65535
    [Calculated window size: 65535]
    Checksum: 0xfe34 [unverified]
    [Checksum Status: Unverified]
    Urgent pointer: 0
    Options: (24 bytes), Maximum segment size, No-Operation (NOP), Window scale, No-Operation (NOP), No-Operation (NOP), Timestamps, SACK permitted, End of Option List (EOL)
        TCP Option - Maximum segment size: 16344 bytes
        TCP Option - No-Operation (NOP)
        TCP Option - Window scale: 6 (multiply by 64)
        TCP Option - No-Operation (NOP)
        TCP Option - No-Operation (NOP)
        TCP Option - Timestamps: TSval 740812626, TSecr 740812626
        TCP Option - SACK permitted
        TCP Option - End of Option List (EOL)
    [SEQ/ACK analysis]
    [Timestamps]

```

### 3:客户端回复ACK

```lua
Frame 15: 56 bytes on wire (448 bits), 56 bytes captured (448 bits) on interface lo0, id 0
Null/Loopback
Internet Protocol Version 4, Src: 127.0.0.1, Dst: 127.0.0.1
Transmission Control Protocol, Src Port: 64255, Dst Port: 10240, Seq: 1, Ack: 1, Len: 0
    Source Port: 64255
    Destination Port: 10240
    [Stream index: 0]
    [TCP Segment Len: 0]
    Sequence number: 1    (relative sequence number)
    Sequence number (raw): 3261314629
    [Next sequence number: 1    (relative sequence number)]
    Acknowledgment number: 1    (relative ack number)
    Acknowledgment number (raw): 1175996046
    1000 .... = Header Length: 32 bytes (8)
    Flags: 0x010 (ACK)
    Window size value: 6379
    [Calculated window size: 408256]
    [Window size scaling factor: 64]
    Checksum: 0xfe28 [unverified]
    [Checksum Status: Unverified]
    Urgent pointer: 0
    Options: (12 bytes), No-Operation (NOP), No-Operation (NOP), Timestamps
        TCP Option - No-Operation (NOP)
        TCP Option - No-Operation (NOP)
        TCP Option - Timestamps: TSval 740812626, TSecr 740812626
    [SEQ/ACK analysis]
    [Timestamps]

```

## 数据发送
通过像服务器发送一个"helloworld"来查看数据是如何发送的：

### 1:客户端发送PSH/ACK
```lua
Transmission Control Protocol, Src Port: 64255, Dst Port: 10240, Seq: 1, Ack: 1, Len: 12
    Source Port: 64255
    Destination Port: 10240
    [Stream index: 0]
    [TCP Segment Len: 12]
    Sequence number: 1    (relative sequence number)
    Sequence number (raw): 3261314629
    [Next sequence number: 13    (relative sequence number)]
    Acknowledgment number: 1    (relative ack number)
    Acknowledgment number (raw): 1175996046
    1000 .... = Header Length: 32 bytes (8)
    Flags: 0x018 (PSH, ACK)
    Window size value: 6379
    [Calculated window size: 6379]
    [Window size scaling factor: -1 (unknown)]
    Checksum: 0xfe34 [unverified]
    [Checksum Status: Unverified]
    Urgent pointer: 0
    Options: (12 bytes), No-Operation (NOP), No-Operation (NOP), Timestamps
        TCP Option - No-Operation (NOP)
        TCP Option - No-Operation (NOP)
        TCP Option - Timestamps: TSval 742069804, TSecr 740812626
    [SEQ/ACK analysis]
    [Timestamps]
    TCP payload (12 bytes)
```

### 2:服务端回复ACK
```lua
Transmission Control Protocol, Src Port: 10240, Dst Port: 64255, Seq: 1, Ack: 13, Len: 0
    Source Port: 10240
    Destination Port: 64255
    [Stream index: 0]
    [TCP Segment Len: 0]
    Sequence number: 1    (relative sequence number)
    Sequence number (raw): 1175996046
    [Next sequence number: 1    (relative sequence number)]
    Acknowledgment number: 13    (relative ack number)
    Acknowledgment number (raw): 3261314641
    1000 .... = Header Length: 32 bytes (8)
    Flags: 0x010 (ACK)
    Window size value: 6379
    [Calculated window size: 6379]
    [Window size scaling factor: -1 (unknown)]
    Checksum: 0xfe28 [unverified]
    [Checksum Status: Unverified]
    Urgent pointer: 0
    Options: (12 bytes), No-Operation (NOP), No-Operation (NOP), Timestamps
        TCP Option - No-Operation (NOP)
        TCP Option - No-Operation (NOP)
        TCP Option - Timestamps: TSval 742069804, TSecr 742069804
    [SEQ/ACK analysis]
        [This is an ACK to the segment in frame: 13]
        [The RTT to ACK the segment was: 0.000040000 seconds]
    [Timestamps]

```

# 序列号与ACK

1. (Client) SYN, Seq=3261314628
#. (Server) SYN/ACK, Seq=1175996045, ACK=3261314629
#. (Client) ACK, Seq=3261314629, ACK=1175996046
#. (Client) PSH/ACK, Seq=3261314629, ACK=1175996046, Data(12bytes)
#. (Server) ACK, Seq=1175996046, ACK=3261314641
#. (Client) FIN/ACK, Seq=3261314641, ACK=1175996046
#. (Server) ACK, Seq=1175996046, ACK=3261314642
#. (Server) FIN, ACK, Seq=1175996046, ACK=3261314642
#. (Client) ACK, Seq=3261314642, ACK=1175996047


