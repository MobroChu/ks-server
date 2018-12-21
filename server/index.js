const http = require('http');
// const fs = require('fs');
const url = require('url');
const path = require('path');
const util = require('util');
const zlib = require('zlib');

// 第三方模块
const mime = require('mime');
const chalk = require('chalk');	// 粉笔
const debug = require('debug')('dev');	// 环境变量
const ejs = require('ejs');	// 模板 ejs、jade、handlebar
const fs = require('mz/fs');
const {readFileSync} = require('fs');

const tmpl = readFileSync(path.join(__dirname, 'template.html'), 'utf8');
// 注意使用 debug 前需要将 debug 的环境变量 dev 添加到系统的环境变量中去。
// debug('hello')

class Server {
	constructor (config) {
		this.config = config;
		this.tmpl = tmpl;
	}
	async handleRequest(req, res) {
		// 默认会先查找当前文件夹中的 index.html 并显示出来。否则将当前文件夹中的所有文件都显示出来
		let {dir} = this.config;
		let {pathname} = url.parse(req.url);
		let realPath = encodeURI(path.join(dir, pathname));
		// if (pathname === '/favicon.ico') this.sendError('没有favicon.ico资源')
		try {
			let statObj = await fs.stat(realPath);
			// 如果是一个文件夹的话
			if (statObj.isDirectory()) {
				let indexHtml = path.join(realPath, 'index.html');
				try {
					let s = await fs.access(indexHtml);
					this.sendFile(req, res, null, indexHtml);
				} catch (e) {
					let dirs = await fs.readdir(realPath);
					res.end(ejs.render(this.tmpl, {
						dirs: dirs.map(item => ({
							name: item,
							path: path.join(pathname, item)
						}))
					}))
				}
			} else {
				// 如果是文件的话，就直接返回这个文件内容
				this.sendFile (req, res, statObj, realPath);
			}
		} catch (err) {
			this.sendError(req, res, err);
		}
	}
	sendFile (req, res, statObj, realPath) {
		res.setHeader('Content-Type', mime.getType(realPath) + ";charset=utf8")

		// 是否压缩
		let zip;
		if (zip = this.gzip(req, res)) {
			return fs.createReadStream(realPath).pipe(zip).pipe(res);
		}
		fs.createReadStream(realPath).pipe(res);
	}
	gzip (req, res) {
		const zip = req.headers['accept-encoding'];
		if (zip) {
			if (zip.match(/\bgzip\b/)) {
				res.setHeader('Content-Encoding', 'gzip');
				return zlib.createGzip();
			} else if (zip.match(/\bdeflate\b/)) {
				res.setHeader('Content-Encoding', 'deflate');
				return zlib.createDeflate();
			}
		} else {
			return false;
		}
	}
	sendError (req, res, e) {
		res.statusCode = 404;
		debug(chalk.red(JSON.stringify(e)));
		res.end('Not found');
	}
	start () {
		let server = http.createServer(this.handleRequest.bind(this));
		let {port, host} = this.config;

		server.listen(port, host, function () {
			debug(`http://${chalk.yellow(host)}:${chalk.red(port)} started!`)
		});

		server.on('error', function (err) {
			debug(err.errno, '===');
		})
	}
}

module.exports = Server;
