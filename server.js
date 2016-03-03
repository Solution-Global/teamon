var connect = require('connect');
var serveStatic = require('serve-static');
var cpl = require('connect-proxy-layer');

var app = connect();
app.use("/rest", cpl('http://192.168.1.164:7587/'));
app.use(serveStatic(__dirname)).listen(8082, function() {
  console.log('server running on 8082');
});
