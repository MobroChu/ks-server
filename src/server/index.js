require('babel-polyfill');
const http = require('http');
// const fs = require('fs');
const url = require('url');
const path = require('path');
const util = require('util');
const zlib = require('zlib');

const NODE_LOG_ENV = "*"; // 设置日志输入的环境

// 第三方模块
const mime = require('mime');
const chalk = require('chalk');	// 粉笔
const debug = require('debug')(NODE_LOG_ENV);	// 环境变量
const ejs = require('ejs');	// 模板 ejs、jade、handlebar
const fs = require('mz/fs');
const {readFileSync} = require('fs');

const tmpl = readFileSync(path.join(__dirname, '../../template.html'), 'utf8');
// 注意使用 debug 前需要将 debug 的环境变量 dev 添加到系统的环境变量中去。

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
		try {
			let statObj = await fs.stat(realPath);
			// 如果是一个文件夹的话
			if (statObj.isDirectory()) {
				let indexHtml = path.join(realPath, 'index.html');
				statObj = await fs.stat(indexHtml);
				try {
          await fs.access(indexHtml);
					this.sendFile(req, res, statObj, indexHtml);
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
			// 当原项目没有 favicon.ico 时，用我默认的 favicon.ico
			if (pathname === '/favicon.ico') {
				let faviconPath = path.resolve(__dirname, '../../logo/favicon.ico');
				return this.sendFile(req, res, await fs.stat(faviconPath), faviconPath);
			}
			this.sendError(err, req, res);
		}
	}
	sendFile (req, res, statObj, realPath) {
		const mimeType = mime.getType(realPath);
		res.setHeader('Content-Type', mimeType + ";charset=utf8");
		debug(`mime-type: ${chalk.green(mimeType)} => ${realPath}`);
		// 304 缓存
		if (this.cache(req, res, statObj)) {
			return res.statusCode = 304, res.end();
		}

		// 是否压缩
		let zip;
		if (zip = this.gzip(req, res)) {
			return fs.createReadStream(realPath).pipe(zip).pipe(res);
		}

		fs.createReadStream(realPath).pipe(res);
	}
	cache (req, res, statObj) {
		// 设置强制缓存
		const expires = 60 * 10; // 过期时间 秒
		res.setHeader("Cache-Control", `max-age=${expires}`);
		res.setHeader("Expires", new Date(Date.now() + expires * 1000).toGMTString());	

		let ctime = statObj.ctime.toLocaleString();
		let etag = ctime + '_' + statObj.size
		// 设置对比缓存
		res.setHeader("Last-Modified", ctime);
		res.setHeader("Etag", etag);

		const ifModifiedSince = req.headers['if-modified-since'];
		const ifNoneMatch = req.headers['if-none-match'];

    if (ifModifiedSince && ifNoneMatch) {
      if (ifModifiedSince === ctime && ifNoneMatch === etag) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
	}
	range (req, res, statObj, realPath) {
		const range = req.headers['range'];
		if (range) {
			let [, start, end] = /bytes=(\d*)-(\d*)/.exec(range);
		} else {
			return false;
		}
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
	sendError (e, req, res) {
		res.statusCode = 404;
		debug(`${chalk.red('sendError: ')}${JSON.stringify(e)}`);
		res.end('Not found');
	}
	start () {
		let server = http.createServer(this.handleRequest.bind(this));
		let {port, host} = this.config;

		server.listen(port, host, function () {
			debug(chalk.white(`http://${chalk.yellow(host)}:${chalk.red(port)} started!`));
		});

		server.on('error', function (err) {
      debug(`error with ${chalk.yellow(err.errno)}`);
      if (err.errno === 'EADDRINUSE') {
        port ++;
        server.listen(port);
      }
		})
	}
}

module.exports = Server;
