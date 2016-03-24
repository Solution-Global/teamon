var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');
var constants = require('./constants');

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
    width: 850,
    height: 650,
    title: constants.APP_NAME
  });
  mainWindow.loadURL(INDEX);
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
