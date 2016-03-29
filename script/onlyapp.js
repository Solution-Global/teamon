// Only for desktop
var remote = require('remote');
var ipc = require('ipc');

myWindow = remote.getCurrentWindow();

appRootPath = require('app-root-path').path.replace(/\\/gi, "/");
