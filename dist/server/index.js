'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var http = require('http');
// const fs = require('fs');
var url = require('url');
var path = require('path');
var util = require('util');
var zlib = require('zlib');

// 第三方模块
var mime = require('mime');
var chalk = require('chalk'); // 粉笔
var debug = require('debug')('dev'); // 环境变量
var ejs = require('ejs'); // 模板 ejs、jade、handlebar
var fs = require('mz/fs');

var _require = require('fs'),
    readFileSync = _require.readFileSync;

var tmpl = readFileSync(path.join(__dirname, '../../template.html'), 'utf8');
// 注意使用 debug 前需要将 debug 的环境变量 dev 添加到系统的环境变量中去。
// debug('hello')

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
				var dir, _url$parse, pathname, realPath, statObj, indexHtml, s, dirs;

				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								// 默认会先查找当前文件夹中的 index.html 并显示出来。否则将当前文件夹中的所有文件都显示出来
								dir = this.config.dir;
								_url$parse = url.parse(req.url), pathname = _url$parse.pathname;
								realPath = encodeURI(path.join(dir, pathname));

								if (!(pathname === '/favicon.ico')) {
									_context.next = 5;
									break;
								}

								return _context.abrupt('return', this.sendError('没有favicon.ico资源', req, res));

							case 5:
								_context.prev = 5;
								_context.next = 8;
								return fs.stat(realPath);

							case 8:
								statObj = _context.sent;

								if (!statObj.isDirectory()) {
									_context.next = 26;
									break;
								}

								indexHtml = path.join(realPath, 'index.html');
								_context.prev = 11;
								_context.next = 14;
								return fs.access(indexHtml);

							case 14:
								s = _context.sent;

								this.sendFile(req, res, null, indexHtml);
								_context.next = 24;
								break;

							case 18:
								_context.prev = 18;
								_context.t0 = _context['catch'](11);
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
								_context.next = 32;
								break;

							case 29:
								_context.prev = 29;
								_context.t1 = _context['catch'](5);

								this.sendError(_context.t1, req, res);

							case 32:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this, [[5, 29], [11, 18]]);
			}));

			function handleRequest(_x, _x2) {
				return _ref.apply(this, arguments);
			}

			return handleRequest;
		}()
	}, {
		key: 'sendFile',
		value: function sendFile(req, res, statObj, realPath) {
			res.setHeader('Content-Type', mime.getType(realPath) + ";charset=utf8");

			// 304 缓存
			if (this.cache(req, res, statObj)) {
				return res.statusCode = 304, res.end();
			}

			// 是否压缩
			var zip = void 0;
			if (zip = this.gzip(req, res)) {
				return fs.createReadStream(realPath).pipe(zip).pipe(res);
			}

			// 断点续传
			if (req.url === '/download') {
				if (this.range(req, res, statObj, realPath)) {} else {}
			}
			fs.createReadStream(realPath).pipe(res);
		}
	}, {
		key: 'cache',
		value: function cache(req, res, statObj) {
			console.log(res, '===');
			// 设置强制缓存
			res.setHeader("Cache-Control", "max-age=30");
			res.setHeader("Expires", new Date(Date.now() + 30 * 1000).toGMTString());

			var ctime = statObj.ctime.toLocaleString();
			var etag = ctime + '_' + statObj.size;
			// 设置对比缓存
			res.setHeader("Last-Modified", ctime);
			res.setHeader("Etag", etag);

			var ifModifiedSince = req.headers['if-modified-since'];
			var ifNoneMatch = req.headers['if-none-match'];

			console.log(ifModifiedSince, ifNoneMatch);
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
			debug(chalk.red(JSON.stringify(e)));
			res.end('Not found');
		}
	}, {
		key: 'start',
		value: function start() {
			var server = http.createServer(this.handleRequest.bind(this));
			var _config = this.config,
			    port = _config.port,
			    host = _config.host;


			server.listen(port, host, function () {
				debug('http://' + chalk.yellow(host) + ':' + chalk.red(port) + ' started!');
			});

			server.on('error', function (err) {
				debug(err.errno, '===');
			});
		}
	}]);

	return Server;
}();

module.exports = Server;