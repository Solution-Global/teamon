window.$ = window.jQuery = require('jquery');
require('jquery-ui');
var Mustache = require('mustache');
// var chat = require('../script/module/chat.js');
var connSection = require('../script/module/screen/conn_section.js');
var chatSection = require('../script/module/screen/chat_section.js');
var asideSection = require('../script/module/screen/aside_section.js');
var remote = require('remote');
var path = require('path');
var storageManager = require('../script/module/storage/storage_manager.js')(true);
var preference = require('../script/module/storage/preference.js');
var messageManager = require('../script/module/storage/message.js');
function initialize() {
  require('../script/module/teamon_menu').customMenus();
  require('malihu-custom-scrollbar-plugin')($);

  bindEvents();
  $(window).resize();
  initCustomScrollbar();
  initLoginStatus();
}

var myPref;

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
    openLoginPopup();
  }
}

function initScreenSection() {
  // local에 저장되지 않는 message들 모두 laod
  messageManager = messageManager(storageManager, myPref);
  messageManager.syncChatMessage();

  connSection.initConnSection(myPref, chatSection, asideSection);
  chatSection.initChatSection(myPref, connSection, asideSection);
  asideSection.initAsideSection(myPref, connSection, chatSection);
}

function openLoginPopup() {
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
      heght: 500,
      closeOnEscape: false,
      open: function(event, ui) {
        $(".ui-dialog-titlebar-close").hide();
      }
    };
    $("#dialog").text("").html(data).dialog(options).dialog("open");
  }).error(function() {
    alert("Connection Error");
  });
}

function bindEvents() {
  $(window).on("orientationchange resize", function() {
    var wrapHeight = $(window).height();
    $('.connection_section .inner_box').css('height', wrapHeight - $('.connection_section .header').outerHeight());
    $('.chat_section .content_area').css('height', wrapHeight - $('.chat_section .title_area').outerHeight() - $('.chat_section .input_message').outerHeight() - 30);
    $('.aside_section .content_area').css('height', wrapHeight - $('.aside_section .title_area').outerHeight() - 30);
  });

  $(window).on('beforeunload', function() {
    console.log("Closing window");

    chatSection.finalize();
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
    theme: "dark-thick",
    callbacks:{
        onScroll:function(){
          if(this.mcs.top === 0) {
            chatSection.getPreviousMessage(this.mcs.draggerTop);
          }
        }
    }
  }).mCustomScrollbar("scrollTo", "bottom");

}

$(document).ready(function() {
  initialize();
});
