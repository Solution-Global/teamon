var https = require('https');
var connect = require('connect');
var serveStatic = require('serve-static');
var cpl = require('connect-proxy-layer');
var logger = require('morgan');
var fs = require('fs');
var appRootPath = require('app-root-path');

const tlsOptions = {
  key: fs.readFileSync(__dirname + '/teamon_key.pem'),
  cert: fs.readFileSync(__dirname + '/teamon_cert.pem')
};

console.log(appRootPath);
// TODO
// log to file rotate
var logFormat = ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time';
var app = connect()
  .use("/rest", cpl('http://192.168.1.164:7587/rest/'))
  .use(logger(logFormat))
  .use(serveStatic(appRootPath.path));

https.createServer(tlsOptions, app).listen(8082, function() {
  console.log('server running on 8082');
});
