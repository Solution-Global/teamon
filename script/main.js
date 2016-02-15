window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
require('metismenu');
require('malihu-custom-scrollbar-plugin')($);
var Mustache = require('mustache');
var catalogSection = require('../script/module/screen/catalog_section.js');
var chatSection = require('../script/module/screen/chat_section.js');
var informationSection = require('../script/module/screen/information_section.js');
var callSection = require('../script/module/screen/call_section.js');
var headerSection = require('../script/module/screen/header_section.js');

var remote = require('remote');
var path = require('path');
var constants = require("../script/module/constants.js");
var storageManager = require('../script/module/storage/storage_manager.js')(false);
var preference = require('../script/module/storage/preference.js');
var messageManager = require('../script/module/storage/message.js');
var chatModule = require('../script/module/chat_client.js');
var myPref; // Login 한 사용자 정보 저장
var activeChatInfo; // 현재 active 된 user chatting room  OR channel chattting room 정보

function initialize() {
  require('../script/module/teamon_menu').customMenus();

  loadScreenSection(); // call this function firstly
  bindEvents();
  initLoginStatus();
  resizeSection(); // run first time basically
  $(window).resize(function() {
    resizeSection();
  });
}

function initLoginStatus() {
  var remeberEmplId = storageManager.getValue("remeberEmplId");
  console.log("initLoginStatus[remeberEmplId:%s]", remeberEmplId);

  if(remeberEmplId) {
    preference = preference(storageManager, remeberEmplId); // init preference

    myPref = {
      "company": preference.getPerference("company"),
      "loginId": preference.getPerference("loginId"),
      "emplId": Number(remeberEmplId),
      "coId": preference.getPerference("coId")
    };

    initScreenSection();
  } else {
    var dialogOptions = {
      backdrop : "static",
      keyboard : "false"
    };
    openModalDialog("./html/login_modal.html", dialogOptions);
  }
}

function loadScreenSection() {
  headerSection.loadHeaderSection();
  callSection.loadCallSection();
  catalogSection.loadCatalogSection();
  chatSection.loadChatSection();
}

function initScreenSection() {
  catalogSection.initCatalogSection();
  chatSection.initChatSection();
  informationSection.initAsideSection();
  callSection.initCallSection();
  headerSection.initHeaderSection();
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
