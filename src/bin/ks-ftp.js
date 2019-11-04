#! /usr/bin/env node

require('babel-polyfill');
const commander = require('commander');
const pkg = require('../../package.json');

commander.on('--help', function () {
	console.log("Usage:")
	console.log("	ks-ftp -d /opt -s http://mobro.site -p")
})

let argvs = commander
	.version(pkg.version)
  .option('-d, --dir <n>', 'origin dir')
  .option('-s, --server <n>', 'target server')
  .option('-p, --path <n>', 'target path')
	.parse(process.argv);

parser = Object.assign(parser, argvs);

