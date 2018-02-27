---
title: Linux环境搭建 —— Vagrant与VirtualBox的配置
date: 2017-04-02 21:03:15
tags: [Linux, Vagrant, VirtualBox]
---
###  搭建虚拟机环境

下载并安装[VirtualBox](https://www.virtualbox.org/)与[Vagrant](https://www.vagrantup.com/)，记住Vagrant要在VirtualBox安装好之后再安装，因为Vagrant依赖于VirtualBox。接着选择所需系统，在[Udacity](https://www.udacity.com/)的教程中，我们选用`ubuntu-trusty-64`，使用Vagrant安装虚拟机需要一个名为`Vagrantfile`的文件（ruby语言）。Udacity官方所给的Vagrantfile如下：

``` ruby
    # -*- mode: ruby -*-
	# vi: set ft=ruby :

	# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
	VAGRANTFILE_API_VERSION = "2"

	# Installation script
	$script = <<SCRIPT
	echo Provisioning system ...
	apt-get install cowsay unzip
	rm /usr/share/cowsay/cows/*odo*
	SCRIPT

	Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	  config.vm.box = "ubuntu/trusty64"
	  config.vm.provision "shell", inline: $script
	end
```

在`git-bash`命令行中，`cd`进入`Vagrantfile`所在目录，例如我存放在`E:/Linux/udacity`中，并启动虚拟机安装程序：
```	bash
	cd E:/Linux/Udacity
```

###  进入虚拟Linux系统

``` bash
	vagrant up
```

### 检查软件更新

查看软件更新包需要sudo权限：

``` bash
	$ sudo apt-get update
```

如果需要更新软件，则使用`upgrade`命令：

``` bash
	$ sudo apt-get upgrade
```

这仅仅是`apt-get`命令的冰山一角，如果需要查看`apt-get`命令的完整用法，可以使用`man`命令（manual的缩写）：

``` bash
	$ man apt-get
```

