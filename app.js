var app = require('app')
var BrowserWindow = require('browser-window')
var path = require('path')

var APP_NAME = 'TeamOn'
var INDEX = 'file://' + path.join(__dirname, '/html/main.html')

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit()
  }
})

app.on('ready', function() {
  var mainWindow = new BrowserWindow({
    width: 950,
    height: 700
  })
  mainWindow.loadUrl(INDEX)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function() {
    mainWindow = null
  })
})
