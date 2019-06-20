'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('babel-polyfill');
var http = require('http');
// const fs = require('fs');
var url = require('url');
var path = require('path');
var util = require('util');
var zlib = require('zlib');
var os = require('os');

var NODE_LOG_ENV = "*"; // 设置日志输入的环境

// 第三方模块
var mime = require('mime');
var chalk = require('chalk'); // 粉笔
// const debug = require('debug')(NODE_LOG_ENV);	// 环境变量
var debug = console.log;
var ejs = require('ejs'); // 模板 ejs、jade、handlebar
var fs = require('mz/fs');

var _require = require('fs'),
    readFileSync = _require.readFileSync;

var tmpl = readFileSync(path.join(__dirname, '../../template.html'), 'utf8');
// 注意使用 debug 前需要将 debug 的环境变量 dev 添加到系统的环境变量中去。

var getIPv4s = function getIPv4s() {
	var networkInterfaces = os.networkInterfaces();
	var interfaces = Reflect.ownKeys(networkInterfaces);
	var ips = [];
	interfaces.forEach(function (item) {
		Reflect.get(networkInterfaces, item).forEach(function (ipItem) {
			if (ipItem.family === 'IPv4') {
				ips.push(ipItem);
			}
		});
	});
	return ips;
};

var Server = function () {
	function Server(config) {
		_classCallCheck(this, Server);

		this.config = config;
		this.tmpl = tmpl;
	}

	_createClass(Server, [{
		key: 'handleRequest',
		value: function () {
			var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
				var dir, _url$parse, pathname, realPath, statObj, indexHtml, dirs, faviconPath;

				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								// 默认会先查找当前文件夹中的 index.html 并显示出来。否则将当前文件夹中的所有文件都显示出来
								dir = this.config.dir;
								_url$parse = url.parse(req.url), pathname = _url$parse.pathname;
								realPath = encodeURI(path.join(dir, pathname));
								_context.prev = 3;
								_context.next = 6;
								return fs.stat(realPath);

							case 6:
								statObj = _context.sent;

								if (!statObj.isDirectory()) {
									_context.next = 26;
									break;
								}

								_context.prev = 8;
								indexHtml = path.join(realPath, 'index.html');
								_context.next = 12;
								return fs.stat(indexHtml);

							case 12:
								statObj = _context.sent;
								_context.next = 15;
								return fs.access(indexHtml);

							case 15:
								this.sendFile(req, res, statObj, indexHtml);
								_context.next = 24;
								break;

							case 18:
								_context.prev = 18;
								_context.t0 = _context['catch'](8);
								_context.next = 22;
								return fs.readdir(realPath);

							case 22:
								dirs = _context.sent;

								res.end(ejs.render(this.tmpl, {
									dirs: dirs.map(function (item) {
										return {
											name: item,
											path: path.join(pathname, item)
										};
									})
								}));

							case 24:
								_context.next = 27;
								break;

							case 26:
								// 如果是文件的话，就直接返回这个文件内容
								this.sendFile(req, res, statObj, realPath);

							case 27:
								_context.next = 42;
								break;

							case 29:
								_context.prev = 29;
								_context.t1 = _context['catch'](3);

								if (!(pathname === '/favicon.ico')) {
									_context.next = 41;
									break;
								}

								faviconPath = path.resolve(__dirname, '../../logo/favicon.ico');
								_context.t2 = this;
								_context.t3 = req;
								_context.t4 = res;
								_context.next = 38;
								return fs.stat(faviconPath);

							case 38:
								_context.t5 = _context.sent;
								_context.t6 = faviconPath;
								return _context.abrupt('return', _context.t2.sendFile.call(_context.t2, _context.t3, _context.t4, _context.t5, _context.t6));

							case 41:
								this.sendError(_context.t1, req, res);

							case 42:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this, [[3, 29], [8, 18]]);
			}));

			function handleRequest(_x, _x2) {
				return _ref.apply(this, arguments);
			}

			return handleRequest;
		}()
	}, {
		key: 'sendFile',
		value: function sendFile(req, res, statObj, realPath) {
			var mimeType = mime.getType(realPath);
			res.setHeader('Content-Type', mimeType + ";charset=utf8");
			debug('mime-type: ' + chalk.green(mimeType) + ' => ' + realPath);
			// 304 缓存
			if (this.cache(req, res, statObj)) {
				return res.statusCode = 304, res.end();
			}

			// 是否压缩
			var zip = void 0;
			if (zip = this.gzip(req, res)) {
				return fs.createReadStream(realPath).pipe(zip).pipe(res);
			}

			fs.createReadStream(realPath).pipe(res);
		}
	}, {
		key: 'cache',
		value: function cache(req, res, statObj) {
			// 设置强制缓存
			var expires = 60 * 10; // 过期时间 秒
			res.setHeader("Cache-Control", 'max-age=' + expires);
			res.setHeader("Expires", new Date(Date.now() + expires * 1000).toGMTString());

			var ctime = statObj.ctime.toLocaleString();
			var etag = ctime + '_' + statObj.size;
			// 设置对比缓存
			res.setHeader("Last-Modified", ctime);
			res.setHeader("Etag", etag);

			var ifModifiedSince = req.headers['if-modified-since'];
			var ifNoneMatch = req.headers['if-none-match'];

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
	}, {
		key: 'range',
		value: function range(req, res, statObj, realPath) {
			var range = req.headers['range'];
			if (range) {
				var _$exec = /bytes=(\d*)-(\d*)/.exec(range),
				    _$exec2 = _slicedToArray(_$exec, 3),
				    start = _$exec2[1],
				    end = _$exec2[2];
			} else {
				return false;
			}
		}
	}, {
		key: 'gzip',
		value: function gzip(req, res) {
			var zip = req.headers['accept-encoding'];
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
	}, {
		key: 'sendError',
		value: function sendError(e, req, res) {
			res.statusCode = 404;
			debug('' + chalk.red('sendError: ') + JSON.stringify(e));
			res.end('Not found');
		}
	}, {
		key: 'start',
		value: function start() {
			var server = http.createServer(this.handleRequest.bind(this));
			var _config = this.config,
			    port = _config.port,
			    host = _config.host;

			// 获取 IPv4

			var IPv4 = [].concat(_toConsumableArray(new Set([].concat(_toConsumableArray(getIPv4s().map(function (ip) {
				return ip.address;
			})), [host]))));
			var IPv4Str = IPv4.map(function (ip) {
				return '  http://' + chalk.white(ip) + ':' + chalk.green(port);
			}).join('\n');
			server.listen(port, host, function () {
				debug(chalk.yellow('Welcome to use ks-server!\nThe server is started, you can visit as:') + '\n' + IPv4Str + '\n\nYou can type ' + chalk.green('[Ctrl + C]') + ' to stop it.');
			});

			server.on('error', function (err) {
				debug('error with ' + chalk.yellow(err.errno));
				if (err.errno === 'EADDRINUSE') {
					port++;
					server.listen(port);
				}
			});
		}
	}]);

	return Server;
}();

module.exports = Server;