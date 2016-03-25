var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');
var constants = require('./constants');
var trayMenu = require('./tray_menu');

var INDEX = 'file://' + path.join(__dirname, '../index_app.html');
var mainWindow = null;

// make single instance
// var iShouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
//     // Someone tried to run a second instance, we should focus our window.
//     if (mainWindow) {
//         if (mainWindow.isMinimized()) mainWindow.restore();
//         mainWindow.show();
//         mainWindow.focus();
//     }
//     return true;
// });
//
// if(iShouldQuit) {
//   app.quit();return;
// }

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
  mainWindow = new BrowserWindow({
    width: 850,
    height: 650,
    title: constants.APP_NAME,
    icon: path.join(__dirname, '../img/icon.ico')
  });

  mainWindow.loadURL(INDEX);
  trayMenu.renderTrayIconMenu();

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

  // mainWindow.on('close', function(event) { //   <---- Catch close event
  //   event.preventDefault();
  //   mainWindow.hide();
  // });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
