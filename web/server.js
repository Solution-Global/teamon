var https = require('https');
var connect = require('connect');
var serveStatic = require('serve-static');
var cpl = require('connect-proxy-layer');
var logger = require('morgan');
var fs = require('fs');
var appRootPath = require('app-root-path');

const tlsOptions = {
  key: fs.readFileSync('/data2/TEAMON/mqtt/teamon.key'),
  cert: fs.readFileSync('/data2/TEAMON/mqtt/teamon.crt')
};

var logFormat = ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time';
var app = connect()
  .use("/rest/", cpl('http://192.168.1.164:7587/rest/'))
  .use(logger(logFormat, {stream: accessLogStream}))
  .use(serveStatic(appRootPath.path, {index: "index_web.html"}));

https.createServer(tlsOptions, app).listen(8082, function() {
  console.log('server running on 8082');
});
