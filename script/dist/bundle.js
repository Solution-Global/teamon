// load custom menus

var Mustache = require('mustache');
var chat = require('../script/module/chat.js');
var preference = require('../script/module/preference.js');
var remote = require('remote');
// var sessionUrl = "http://www.github.com";
// var session = remote.getCurrentWindow().webContents.session;

function initialize() {
  console.log("initialize");
  require('../script/teamon_menu').customMenus();
  require('malihu-custom-scrollbar-plugin')($);

  bindEvents();
  $(window).resize();
  initCustomScrollbar();
  initLoginStatus();
}

function initLoginStatus()
{
    var keepSigned = preference.get("login", "keepSigned");
    var loginId = preference.get("login", "loginId");

    if(keepSigned) {
      // TODO get User Infomation
      var coId = 1;
      var emplId = 8;

      initEmpolyees(coId);
      initChatt(coId, emplId, loginId);

    } else {
      openLoginPopup();
    }
}

function openLoginPopup() {
  console.log("call openLoginPopup");
  $.get("/ElectronExample/teamon/html/popup/login_pop.html", function(data) {
    var options = {
      buttons: [{
        text: "Signed In",
        click: function() {
          loginSubmit();
        }
      }],
      show: { effect: "blind", duration: 800 },
      modal: true,
      width: 350,
      heght: 500
    }
    $("#dialog").text("").html(data).dialog(options).dialog("open");
  }).error(function() {
    alert("Connection Error");
  });
}

function getCurrentChattingTarget() {
  var userList = $('.users_area .list');
  return userList.find('.active').find("input[name=emplId]").val();
}

function initChatt(coId, emplId, loginId) {
  console.log('call initChatt] coid:%i, emplid:%i, loginid:%s, myInfo:%o, recvCallback:%o', coId, emplId, loginId);
  chat.configMyInfo(coId, emplId, loginId);

  var chatWindow = (function() {
    // cache DOM
    $inputMsg = $('.chat_section .input_message');
    $inputText = $inputMsg.find('.input_text');
    $btnSend = $inputMsg.find('.btn_send');
    $contentArea = $('.chat_section .content_area');
    $mcsbContainer = $('.chat_section .content_area .mCSB_container');
    msgTemplate = $contentArea.find('#msg-template').html();

    // bind events
    $btnSend.on('click', sendMsg);
    $inputText.on('keyup', _keyup);

    function sendMsg(msg) {
      if (typeof msg !== "string")
        msg = $inputText.val();

      _render(msg);
      $inputText.val('').focus();
    }

    function _keyup(event) {
      if (event.keyCode == 13) {
        $btnSend.click();
      }
    }

    function _render(msgText, callback) {
      if (!msgText || !msgText.trim().length)
        return;

      var msgData = {
        "msg": [{
          "mode": "send", // send or receive
          "img": "../img/profile_img1.jpg",
          "imgAlt": "mafintosh",
          "sender": "mafintosh",
          "msgText": msgText,
          "time": new Date().format("a/p hh mm")
        }]
      };

      chat.sendDirectMsg(getCurrentChattingTarget(), msgText);
    }

    function recvMsg(myIdPostfix, topic, message) {
      var sendMode = topic.endsWith(myIdPostfix);
      var userList = ['mafintosh', 'maxcgden', 'ngoldman', 'Flot', 'foross', 'groundwater', 'shama', 'DamonOchlman'];
      var random = 0;
      if (!sendMode)
        random = Math.floor(Math.random() * userList.length) + 1;
      var recvData = {
        "msg": [{
          "mode": sendMode ? "send" : "receive", // send or receive
          "img": "../img/profile_img" + (random + 1) + ".jpg",
          "imgAlt": userList[random],
          "sender": userList[random],
          "msgText": message + ' from ' + topic,
          "time": new Date().format("a/p hh mm")
        }]
      };
      $mcsbContainer.append(Mustache.render(msgTemplate, recvData));
      $contentArea.mCustomScrollbar("scrollTo", "bottom");
    }

    return {
      sendMsg: sendMsg,
      recvMsg: recvMsg
    };
  })();

  chat.registerRecvCallback(chatWindow.recvMsg);
}

function initEmpolyees(coId) {
  console.log("call initEmpolyees" + coId);
  var params = {
    "coId" : coId
  };
  restResours.empl.getListByCoid(params, function(data){
      var userListContext = $('.users_area .list');
      var chatSection = $('.chat_section');
      var titleAreaChatSection = chatSection.find(".title_area");
      var contentAreaChatSection = chatSection.find(".content_area");
      var userListArray = [];
      if(data.rows) {
        $.each(data.rows, function(idx, row) {
          var userTemplet = userListContext.find('.userTemplet').clone();
          userTemplet.removeClass("blind"); // remove basic class for templet
          userTemplet.removeClass("userTemplet");  // remove basic class for templet
          userTemplet.find(".name").text(row.name);
          userTemplet.find("[name=emplId]").val(row.emplId);
          userTemplet.find(".img").find("img").attr("src", "/ElectronExample/teamon/img/" + (row.photoLoc || "profile_no.jpg"));
          userListContext.append(userTemplet);

          // click the Users
          userTemplet.bind("click", function(event){
            $.each(userListContext.find(".active"), function(idx, row) {
                $(row).removeClass("active");
            });
            $(this).addClass("active");

            titleAreaChatSection.find('.tit').html(row.name); // set the title of chat area
            $.each(contentAreaChatSection.find(".msg_set"), function(idx, row) {
                $(row).remove(); // remove chatting texts
            });
          });

          // to init client of chat
          userListArray.push(row.emplId);
        });

        chat.initClient([], userListArray);
      }
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
