#### 静态服务
用于平时自己开发项目的一个纯静态服务。

#### 主要功能
 + 断点续传（206）
 + 缓存（304）
 + 压缩（gzip、deflate）

#### 参数
```bash
-p, --port <n>	# 配置端口
-d, --dir <n>	# 配置所起服务的根路径
-o, --host <n>	# 配置主机名 
-e, --env <n>   # DEBUG 环境（eg: dev）
```

#### 使用
```bash
npm i -g ks-server

ks-server -p 10086 -d d: -o localhost
```

#### 须知
默认端口：3000  
默认目录：当前目录  
打印日志的话，需要运行  
```bash
export DEBUG=dev (os 环境)
set DEBUG=dev (windows 环境)

```

#### 环境
nodejs >= 11.3.0 (开发)
nodejs >= 6.4.0 (使用)
