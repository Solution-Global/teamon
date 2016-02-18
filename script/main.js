window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
require('metismenu');
require('malihu-custom-scrollbar-plugin')($);
var Dropzone = require('dropzone');
var Mustache = require('mustache');
var moment = require('moment-timezone');
var catalogSection = require('../script/module/screen/catalog_section.js');
var chatSection = require('../script/module/screen/chat_section.js');
var informationSection = require('../script/module/screen/information_section.js');
var callSection = require('../script/module/screen/call_section.js');
var headerSection = require('../script/module/screen/header_section.js');
var screenshareSection = require('../script/module/screen/screenshare_section.js');

var remote = require('remote');
var path = require('path');
var constants = require("../script/module/constants.js");
var storageManager = require('../script/module/storage/storage_manager.js')(false);
var preferenceManager = require('../script/module/storage/preference.js');
var messageManager = require('../script/module/storage/message.js');
var chatModule = require('../script/module/chat_client.js');
var myPref; // Login 한 사용자 정보 저장
var activeChatInfo; // 현재 active 된 user chatting room  OR channel chattting room 정보
var myMessage; // local Storage에 저장된 Message 처리
var myPreference;
var timezone = "Asia/Seoul";

function initialize() {
  require('../script/module/teamon_menu').customMenus();
  loadScreenSection(); // call this function firstly
  bindEvents();
  initLoginStatus();
}

function initLoginStatus() {
  var remeberEmplId = storageManager.getValue("remeberEmplId");
  console.log("initLoginStatus[remeberEmplId:%s]", remeberEmplId);

  if(remeberEmplId) {
    myPreference = preferenceManager(storageManager, remeberEmplId); // init preference

    myPref = {
      "company": myPreference.getPreference("company"),
      "loginId": myPreference.getPreference("loginId"),
      "emplId": Number(remeberEmplId),
      "coId": myPreference.getPreference("coId")
    };

    initScreenSection();
  } else {
    var dialogOptions = {
      backdrop : "static",
      keyboard : "false"
    };
    openModalDialog("./html/login_popup.html", dialogOptions);
  }
}

function loadScreenSection() {
  headerSection.loadHeaderSection();
  callSection.loadCallSection();
  catalogSection.loadCatalogSection();
  chatSection.loadChatSection();
  screenshareSection.loadScreenshareSection();
}

function initScreenSection() {
  catalogSection.initCatalogSection();
  chatSection.initChatSection();
  informationSection.initAsideSection();
  callSection.initCallSection();
  headerSection.initHeaderSection();
  screenshareSection.initScreenshareSection();

  resizeSection(); // run first time basically
  $(window).resize(function() {
    resizeSection();
  });
}

function resizeSection() {
  informationSection.resizeInformationSection();
  catalogSection.resizeCatalogSection();
  chatSection.resizeInChatSection();
}

function bindEvents() {
  $(window).on('beforeunload', function() {
    console.log("Closing window");
    chatSection.finalize();
  });
}

$(document).ready(function() {
  initialize();
});
