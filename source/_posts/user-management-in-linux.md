---
title: Linux下的用户管理 —— 查看、添加用户
date: 2017-04-02 20:01:03
tags: [Linux]
---
最近刚开始跟着`Udacity`学习`Linux`系统的基本操作方法。
首先我们需要安装`finger`, `Linux`系统中一个用于查看用户信息的程序。使用`apt-get`来安装：
<!-- more -->
``` bash
	$ sudo apt-get install finger
```

### 查看当前用户信息

在Linux中，所有用户的用户名与密码都被储存于`/etc/password`的目录下，可以通过`cat`命令查看：
``` bash
	$ cat /etc/password
```
在得到的一长串列表中，我们的信息为`vagrant:x:1000:1000::/home/vagrant:/bin/bash`。可以看到，这些信息都被冒号所隔开，每个都有不同的含义。
`vagrant`:  用户名；
`x`:  曾经用户储存加密过的密码，因为硬件能力不支持暴力破解，现在已被废弃，使用Linux中被忽略的字符`x`代替；
`1000`: 用户ID;
`1000`: 组ID;
`::`:  由于`vagrant`用户没有更多说明，于是此项为空，表现为双冒号；
`/home/vagrant`：用户目录
`/bin/bash`：用户使用的终端

### 添加新用户

为了添加新用户，我们需要管理员权限：
``` bash
	$ sudo adduser student
```
在创建用户，输入密码的过程中，密码是**不可见的**，然而它是**确实存在**的。密码之后的姓名，手机等信息均为选填。

接下来我们验证新用户`student`确实被创建了：
``` bash
	$ finger student
	Login: student                          Name:
	Directory: /home/student                Shell: /bin/bash
	Never logged in.
	No mail.
	No Plan.
```
### 以新用户的身份登录
重新打开一个新的`git-bash`，并`cd`至虚拟机所在目录。使用`ssh`命令登录：
``` bash
	$ ssh student@127.0.0.1 -p 2222
	Welcome to Ubuntu 14.04.5 LTS (GNU/Linux 3.13.0-119-generic x86_64)
```
其中，`ssh`为登录指令，`student`为用户名，`127.0.0.1`为连接的ip，`-p`用于指定连接的端口，在这里是`2222`。
在输入密码之后，即可以`student`的身份登录，但并不能使用管理员命令`sudo`。

#### 为新用户添加管理员身份
切换到以`Vagrant`登录的`git-bash`界面，打开管理员列表：
``` bash
	$ sudo cat /etc/sudoers
```
在显示的管理员中，我们可以看到一行指令`#includedir /etc/sudoers.d`。这行指令将用户自定义的管理员储存于`/etc/sudoers.d`**目录**下，防止程序在更新丢失用户自定义的管理员列表。
为了让student用户获得管理员权限，我们复制vagrant的用户信息，重命名为student，并用nano修改：
``` bash
	$ sudo cp /etc/sudoers.d/vagrant /etc/sudoers.d/student
	$ sudo nano /etc/sudoers.d/student
	# CLOUD_IMG: This file was created/modified by the Cloud Image build process
	vagrant ALL=(ALL) NOPASSWD:ALL
```

将`/etc/sudoers.d/student`文件中的vagrant更改为student并保存，即可为student添加管理员权限。
``` bash
	# CLOUD_IMG: This file was created/modified by the Cloud Image build process
	student ALL=(ALL) NOPASSWD:ALL
```

在以`student`身份登录的`git-bash`中运行需要管理员权限的命令吧！

### 使用`passwd`命令对用户密码进行操作
示例：
``` bash
	sudo passwd -e student
```
可以让student用户在下次登录时强制重置密码。