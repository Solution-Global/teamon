/* String prototype */
String.prototype.string = function(len) {
  var s = '',
    i = 0;
  while (i++ < len) {
    s += this;
  }
  return s;
};
String.prototype.zf = function(len) {
  return "0".string(len - this.length) + this;
};

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/* Number prototype */
Number.prototype.zf = function(len) {
  return this.toString().zf(len);
};

/* Date prototype */
Date.prototype.format = function(f) {
  if (!this.valueOf()) return " ";

  var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  var d = this;

  return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
    switch ($1) {
      case "yyyy":
        return d.getFullYear();
      case "yy":
        return (d.getFullYear() % 1000).zf(2);
      case "MM":
        return (d.getMonth() + 1).zf(2);
      case "dd":
        return d.getDate().zf(2);
      case "E":
        return weekName[d.getDay()];
      case "HH":
        return d.getHours().zf(2);
      case "hh":
        return ((h = d.getHours() % 12) ? h : 12).zf(2);
      case "mm":
        return d.getMinutes().zf(2);
      case "ss":
        return d.getSeconds().zf(2);
      case "a/p":
        return d.getHours() < 12 ? "오전" : "오후";
      default:
        return $1;
    }
  });
};

window.$ = window.jQuery = require('jquery');
require('jquery-ui');
var Mustache = require('mustache');
var chat = require('../script/module/chat.js');
var connSection = require('../script/module/screen/conn_section.js');
var chatSection = require('../script/module/screen/chat_section.js');
var preference = require('../script/module/preference.js');
var remote = require('remote');
var path = require('path');

var leveldown = require('leveldown'); // browser: level-js
var levelup = require('levelup');
var db = levelup('./teamondb', {db: leveldown, valueEncoding: 'json'}); // open a data store

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./temonsqlite3');

function initialize() {
  require('../script/module/teamon_menu').customMenus();
  require('malihu-custom-scrollbar-plugin')($);

  bindEvents();
  $(window).resize();
  initCustomScrollbar();
  initLoginStatus();

  db.serialize(function() {
    db.run("CREATE TABLE message (topic TEXT, mode TEXT, img TEXT, imgAlt TEXT, sender TEXT, msgText TEXT, time TEXT)", function(err, row) {
       console.log(err);
    });
  });
}

var myPref;

function initLoginStatus() {
  myPref = preference.getPrefObj();

  var rememberMe = myPref.login.rememberMe;
  var loginId = myPref.login.loginId;
  var coId = myPref.login.coId;
  var emplId = myPref.login.emplId;

  console.log("initLoginStatus[rememberMe:%s, loginId:%s, coId:%s, emplId:%s]", rememberMe, loginId, coId, emplId);

  if (rememberMe) {
    initScreenSection();
  } else {
    openLoginPopup();
  }
}

function initScreenSection() {
  connSection.initConnSection(myPref, chat, chatSection);
  chatSection.initChatSection(myPref, chat, connSection);
}

function openLoginPopup() {
  console.log("call openLoginPopup");
  $.get("file://" + path.join(__dirname, '/popup/login_pop.html'), function(data) {
    var options = {
      buttons: [{
        text: "Log In",
        click: function() {
          loginSubmit();
        }
      }],
      show: {
        effect: "blind",
        duration: 800
      },
      modal: true,
      width: 350,
      heght: 500
    };
    $("#dialog").text("").html(data).dialog(options).dialog("open");
  }).error(function() {
    alert("Connection Error");
  });
}

function bindEvents() {
  $(window).bind("orientationchange resize", function() {
    var wrapHeight = $(window).height();
    $('.connection_section .inner_box').css('height', wrapHeight - $('.connection_section .header').outerHeight());
    $('.chat_section .content_area').css('height', wrapHeight - $('.chat_section .title_area').outerHeight() - $('.chat_section .input_message').outerHeight() - 30);
    $('.aside_section .content_area').css('height', wrapHeight - $('.aside_section .title_area').outerHeight() - 30);
  });
}

function initCustomScrollbar() {
  $('.connection_section .inner_box').mCustomScrollbar({
    axis: "y",
    scrollInertia: 100,
    theme: "light-thick"
  });
  $('.chat_section .content_area').mCustomScrollbar({
    axis: "y",
    scrollInertia: 100,
    theme: "dark-thick"
  }).mCustomScrollbar("scrollTo", "bottom");
}

$(document).ready(function() {
  initialize();
});

var emplResource = require("../script/module/rest/empl");
var loginResource = require("../script/module/rest/login");

var restResourse = {
  empl : new emplResource(),
  login : new loginResource()
};
