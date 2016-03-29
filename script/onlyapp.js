// Only for desktop
var remoteModule = require('remote');
myWindow = remoteModule.getCurrentWindow();

appRootPath = require('app-root-path').path.replace(/\\/gi, "/");
