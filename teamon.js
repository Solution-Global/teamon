var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');
var cp = require('child_process');
var autoUpdater = require('auto-updater');
var appVersion = require('./package.json').version;
var os = require('os').platform();
var constants = require("./script/module/constants.js");

var handleSquirrelEvent = function() {
  if (process.platform != 'win32') {
    return false;
  }

  function executeSquirrelCommand(args, done) {
    var updateDotExe = path.resolve(path.dirname(process.execPath),
      '..', 'update.exe');
    var child = cp.spawn(updateDotExe, args, {
      detached: true
    });
    child.on('close', function(code) {
      done();
    });
  };

  function install(done) {
    var target = path.basename(process.execPath);
    executeSquirrelCommand(["--createShortcut", target], done);
  };

  function uninstall(done) {
    var target = path.basename(process.execPath);
    executeSquirrelCommand(["--removeShortcut", target], done);
  };

  app.setAppUserModelId('com.squirrel.teamon.teamon');
  var squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      install(app.quit);
      return true;
    case '--squirrel-uninstall':
      uninstall(app.quit);
      return true;
    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      app.quit();
      return true;
  }

  return false;
};

if (handleSquirrelEvent()) {
  return;
}

var APP_NAME = 'TeamOn';
var INDEX = 'file://' + path.join(__dirname, '/html/main.html');

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
  var updateFeed = constants.SOFTWARE_UPDATE_URL_BASE;
  updateFeed += (os === 'darwin' ?
    constants.SOFTWARE_UPDATE_URL_PATH_LATEST : constants.SOFTWARE_UPDATE_URL_PATH_RELEASE + "/win32");

  autoUpdater.setFeedURL(updateFeed + '?v=' + appVersion);
  console.log('feedURL: %s', updateFeed + '?v=' + appVersion);

  autoUpdater.on('error', function() {
      console.log(arguments);
      createWindow();
    })
    .on('checking-for-update', function() {
      console.log('Checking for update');
    })
    .on('update-available', function() {
      console.log('Update available');
    })
    .on('update-not-available', function() {
      console.log('Update not available');
      createWindow();
    })
    .on('update-downloaded', function() {
      console.log('Update downloaded');
      autoUpdater.quitAndInstall();
    });

  autoUpdater.checkForUpdates();
});

function createWindow() {
  var mainWindow = new BrowserWindow({
    width: 950,
    height: 700
  });
  mainWindow.loadURL(INDEX);
  // Open the DevTools.
  //  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}
