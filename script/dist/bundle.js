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
require('bootstrap');
require('metismenu');
require('malihu-custom-scrollbar-plugin')($);
var Mustache = require('mustache');
var connSection = require('../script/module/screen/conn_section.js');
var chatSection = require('../script/module/screen/chat_section.js');
var asideSection = require('../script/module/screen/aside_section.js');
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

function initialize() {
  require('../script/module/teamon_menu').customMenus();

  bindEvents();
  windowResize();
  initCustomScrollbar();
  initLoginStatus();
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
    $('#loginModal').modal('show');
  }
}

function loginSubmit() {
  var loginForm = $("#loginForm");
  if(!loginForm.valid())
    return;

  var rememberMe = loginForm.find("[name=rememberMe]");

  var params = {
    "company": loginForm.find("[name=company]").val(),
    "loginId": loginForm.find("[name=loginId]").val(),
    "password": loginForm.find("[name=password]").val(),
  };

  restResourse.login.login(params,
  function(data) {
    if(!data.emplId) {
      console.error("login Fail!!");
      return;
    }

    myPref = {
      "company": params.company,
      "loginId": params.loginId,
      "emplId": data.emplId ? Number(data.emplId) : null,
      "coId": data.coId ? Number(data.coId) : null
    };

    initScreenSection();
    // set the personal pref info first to use it around the app.
    preference = preference(storageManager, data.emplId); // init preference
    if(rememberMe.is(":checked"))
      storageManager.setValue("remeberEmplId", data.emplId);
    preference.setPerference("company", params.company);
    preference.setPerference("loginId", params.loginId);
    preference.setPerference("emplId", data.emplId);
    preference.setPerference("coId", data.coId); // Save to the pref file once at the end of the config job.

    $("#loginModal").modal("hide");
  });
}

function registerEmpl() {
  var registerEmplForm = $("#registerEmplForm");
  if(!registerEmplForm.valid())
    return;

  var params = {
    "company": registerEmplForm.find("[name=company]").val(),
    "loginId": registerEmplForm.find("[name=loginId]").val(),
    "password": registerEmplForm.find("[name=password]").val(),
    "name": registerEmplForm.find("[name=name]").val(),
    "dept": registerEmplForm.find("[name=dept]").val(),
    "mobile": registerEmplForm.find("[name=mobile]").val(),
    "office": registerEmplForm.find("[name=office]").val()
  };

  restResourse.empl.createEmpl(params,
    function(data) {
      $("#registerEmplModal").modal("hide");
  });
}

function initScreenSection() {
  connSection.initConnSection();
  chatSection.initChatSection();
  asideSection.initAsideSection();
  callSection.initCallSection();
  headerSection.initHeaderSection();
}

function windowResize() {
  var $header_section = $(".header_section");
  var $chat_section = $(".chat_section");
  var $aside_section = $(".aside_section");
  var $connection_section = $(".connection_section");

  // adjust height when resize
  function _resize() {
    var windowHeight = $(window).height();

    var headerHeight = $header_section.outerHeight(true);
    var chatInputHeight = $chat_section.find(".ibox-footer").outerHeight(true);
    var asideHeaderHeight =  $aside_section.find(".ibox-title").outerHeight(true);
    var connectHeaderHeight = $connection_section.find(".nav-header").outerHeight(true);
    var connectChannelsHeight = $connection_section.find(".channels-link").outerHeight(true);
    var connectUsersHeight = $connection_section.find(".users-link").outerHeight(true);

    // 마지막의 3,2,1 오차 pixel.
    var scrollHeight = windowHeight - connectHeaderHeight - connectChannelsHeight - connectUsersHeight - 3;
    var asideHeight =  windowHeight - headerHeight - asideHeaderHeight - 2;
    var chatHeight =  windowHeight - headerHeight - chatInputHeight - 1;

    $connection_section.find(".chat-channels").css("height", scrollHeight * 0.3 );
    $connection_section.find(".chat-users").css("height", scrollHeight * 0.7 );

    $chat_section.find(".content_area").css("height", chatHeight);
    $aside_section.find(".ibox-content").css("height", asideHeight);
  }

  _resize(); // run first time basically
  $(window).resize(function() {
    _resize();
  });
}

function bindEvents() {
  $(window).on('beforeunload', function() {
    console.log("Closing window");
    chatSection.finalize();
  });

  // set validation for login Form
  $("#loginForm").validate({
    rules: {
      company: {
        required: true,
        minlength: 6
      },
      loginId: {
        required: true,
        minlength: 4
      },
      password: {
        required: true,
        minlength: 6
      }
    }
  });

  // set event for login action
  $('#loginModal .sign-in').click(function() {
    loginSubmit();
  });

  // set validation for login Form
  $("#registerEmplForm").validate({
    rules: {
      company: {
        required: true,
        minlength: 6
      },
      loginId: {
        required: true,
        minlength: 4
      },
      name: {
        required: true,
        minlength: 4
      },
      password: {
        required: true,
        minlength: 6
      }
    }
  });

  $('#registerEmplModal').find('[name=company]').focusout(function() {
    var $register = $(this);
    var name = $register.val();
    if(!name)
      return;
    var params = {
      "name": $register.val(),
    };

    restResourse.company.getCompanyByName(params,
      function(data, response) {
        // Success
        if(response.statusCode === 200) {
          if(!data.coId) {
            $register.after("<label id='company-error' class='error' for='company'>Invaid Comapny</label>");
          }
        } else {
          console.log("[fail search company]" + response.statusMessage);
        }
      }
    );
  });

  $('#registerEmplModal .register').click(function() {
    registerEmpl();
  });
}

function initCustomScrollbar() {
  $('.chat_section .content_area').mCustomScrollbar({
    axis:"y",
    setWidth: "auto",
    theme:"3d",
    callbacks:{
      onScroll:function(){
        if(this.mcs.top === 0) {
          chatSection.getPreviousMessage(this.mcs.draggerTop);
        }
      }
    },
    onTotalScrollOffset:100,
    alwaysTriggerOffsets:false
  }).mCustomScrollbar("scrollTo", "bottom");

  var scrollHeight = $(window).height() - 230;
  $('.connection_section .chat-channels').mCustomScrollbar({
    axis:"y",
		setWidth: "auto",
    setHeight:  scrollHeight * 0.3,
    theme:"3d",
  });

  $('.connection_section .chat-users').mCustomScrollbar({
    axis:"y",
		setWidth: "auto",
    setHeight:  scrollHeight * 0.7,
    theme:"3d"
  });
}

$(document).ready(function() {
  initialize();
});

var emplResource = require("../script/module/rest/empl");
var loginResource = require("../script/module/rest/login");
var chatResource = require("../script/module/rest/chat");
var channelResource = require("../script/module/rest/channel");
var companyResource = require("../script/module/rest/company");

var restResourse = {
  empl : new emplResource(),
  login : new loginResource(),
  chat : new chatResource(),
  channel : new channelResource(),
  company : new companyResource()
};
