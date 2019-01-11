#! /usr/bin/env node
'use strict';

// www.js
require('babel-polyfill');
var commander = require('commander');
var pkg = require('../../package.json');
var Server = require('../server/index.js');

// 设置一个默认的值
var parser = {
	port: 3000,
	host: 'localhost',
	dir: process.cwd(), // 为什么不能用 __dirname
	env: 'dev1'
	// 监听一个 --help 事件，当用户输入 `my-server --help` 时，会将一下内容追加到显示的后面。
	// 奇怪了，这个绑定事件得放在 声明 argvs 之前
};commander.on('--help', function () {
	console.log("Usage:");
	console.log("  my-server -p 3000 --host localhost");
});
var argvs = commander.version(pkg.version).option('-p, --port <n>', 'server port').option('-o, --host <n>', 'server hostname').option('-d, --dir <n>', 'server dir').option('-e, --env <n>', 'server env').parse(process.argv);

parser = Object.assign(parser, argvs);
console.log(parser, '=====');

var ser = new Server(parser);
ser.start(); // 启动一个服务