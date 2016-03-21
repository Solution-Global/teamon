var notifier = require('node-notifier');
var remote = require('electron').remote;
var BrowserWindow = remote.BrowserWindow;
var app = remote.app;

var noti = (function() {

  function _handleNotification (myId, topic, payloadStr) {
    var msgPayload = JSON.parse(payloadStr);

    var channelValue = channelCache.get(msgPayload.topic);
    var userValue = userCache.get(msgPayload.senderId);

    var notiTitle = "New message form " + userValue.name;
    var notiBody = msgPayload.msg;
    var notiIcon = "../img/profile_no.jpg";

    notifier.notify({
      title: notiTitle,
      message: notiBody,
      icon: notiIcon,
      sound: true,
      wait: true
    //}, funcion(err, response) {
    //  console.log(err, response);
    });
    console.log("channelId = %s senderId = %s msg = %s",
      msgPayload.channelId, msgPayload.senderId, msgPayload.msg);

    notifier.on('click', function(){
      //app.show(); // for os x
      app.focus();
      //BrowserWindow.focus();

      // show channel or chat
      if(getChatType(topic) === constants.CHANNEL_CHAT) {
        changeActiveChannel(msgPayload, channelValue);
      } else if (getChatType(topic) === constants.DIRECT_CHAT) {
        changeActiveUser(msgPayload, userValue);
      } else {
        console.error("wrong chat type");
      }
    });
    //notifier.on('timeout', function(notifierObject, options){});
  }

  function _handleWebNotification (myId, topic, payloadStr) {
    var notification = null;
    var msgPayload = JSON.parse(payloadStr);

    var channelValue = channelCache.get(msgPayload.topic);
    var userValue = userCache.get(msgPayload.senderId);

    var notiTitle = "New message form " + userValue.name;
    var notiBody = msgPayload.msg;
    var notiIcon = "../img/profile_no.jpg";

    if(getChatType(topic) === constants.CHANNEL_CHAT) {
      notiTitle = "New message in " + channelValue.name;
      notiBody = userValue.name + ": "  + msgPayload.msg;
    }

    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      notification = new Notification(
        notiTitle,
        {icon: notiIcon, body: notiBody, tag: ""});

      console.log("granted: channelId = %s senderId = %s msg = %s",
        msgPayload.channelId, msgPayload.senderId, msgPayload.msg);
    }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          notification = new Notification(
            notiTitle,
            {icon: notiIcon, body: notiBody, tag: ""});
        }
        console.log("denied: channelId = %s senderId = %s msg = %s",
          msgPayload.channelId, msgPayload.senderId, msgPayload.msg);
      });
    }

    setTimeout(function(){notification.close();}, 3000);

    notification.onclick = function(event) {
      notification.close();
      event.preventDefault();
      window.focus();

      // show channel or chat
      if(getChatType(topic) === constants.CHANNEL_CHAT) {
        changeChannelUser(msgPayload, channelValue);
      } else if (getChatType(topic) === constants.DIRECT_CHAT) {
        changeActiveUser(msgPayload, userValue);
      } else {
        console.error("wrong chat type");
      }
    };
  }

  function changeActiveChannel(msgPayload, channelValue) {
    var $userListContext = $('#users-list');
    var $channelListContext = $('#channels-list');

    $channelListContext.find("li.active").removeClass("active");
    $userListContext.find("li.active").removeClass("active");
    var $targetList = $("#channels-list li[data-channelid='"+channelValue.channelId+"']");
    $targetList.click();
  }

  function changeActiveUser(msgPayload, userValue) {
    var $userListContext = $('#users-list');
    var $channelListContext = $('#channels-list');

    $channelListContext.find("li.active").removeClass("active");
    $userListContext.find("li.active").removeClass("active");
    var $targetList = $("#users-list li[data-emplid='"+userValue.emplId+"']");
    $targetList.click();
  }

  return {
    _handleNotification: _handleNotification,
    _handleWebNotification: _handleWebNotification
  };
})();

module.exports = noti;
