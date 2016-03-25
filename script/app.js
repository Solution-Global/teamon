require('app-module-path').addPath(__dirname);

var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');
var constants = require('../script/constants');

var INDEX = 'file://' + path.join(__dirname, '../index_app.html');

// Ignores certificate related errors.
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  var mainWindow = new BrowserWindow({
    width: 950,
    height: 700,
    title: constants.APP_NAME
  });
  mainWindow.loadURL(INDEX);
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  var protocol = require('protocol');
  var fs = require('fs');
  var appRootPath = require('app-root-path').path.replace(/\\/gi, "/");
  protocol.interceptFileProtocol('file', function(request, callback) {
    var url = request.url.substr(7);
    // console.log(request.url);
    if (url.lastIndexOf("?") > 0)
    url = url.substr(0, url.lastIndexOf("?"));
    url = url.indexOf(appRootPath) == -1 ? appRootPath + url.substr(3) : url.substr(1);
    // console.log(path.normalize(url));
    callback(path.normalize(url));
  }, function (error) {
    if (error)
      console.log(error);
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
