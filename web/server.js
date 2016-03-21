var https = require('https');
var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var cpl = require('connect-proxy-layer');
var logger = require('morgan');
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator')
var appRootPath = require('app-root-path');

process.title = "teamON";

// const tlsOptions = {
//   key: fs.readFileSync('../teamon.key'),
//   cert: fs.readFileSync('../teamon.crt')
// };

const tlsOptions = {
  key: fs.readFileSync(__dirname + '/teamon.key'),
  cert: fs.readFileSync(__dirname + '/teamon.crt')
};

var logFormat = ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time';
var logDirectory = appRootPath.path + '/logs';

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYY_MM_DD',
  filename: logDirectory + '/web_%DATE%.log',
  frequency: 'daily',
  verbose: false
});

var app = connect()
  .use("/rest/", cpl('http://192.168.1.164:7587/rest/'))
  .use(logger(logFormat, {stream: accessLogStream}))
  .use(serveStatic(appRootPath.path, {index: "index_web.html"}));

https.createServer(tlsOptions, app).listen(8082, function() {
  console.log('server running on 8082');
});
