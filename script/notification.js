var notifier = require('node-notifier');

var noti = (function() {
  var notiTitle = null;
  var notiBody = null;
  var notiIcon = null;
  // TODO have to make page for change of notification sound
  var audio = new Audio('./sound/alarm.wav');

  function handleNotification(msgPayload) {
    if(msgPayload.senderId === loginInfo.emplId) {
      return;
    }

    var userValue = userCache.get(msgPayload.senderId);

    notiTitle = "New message form " + userValue.name;
    notiBody = msgPayload.msg;
    if (notiBody.length > 20)
      notiBody = notiBody.substring(0, 19) + "...";

    // TODO change to profile image of user
    notiIcon = getImagePath(userValue.photoLoc, userValue.teamId, userValue.emplId);

    if (getChatType(msgPayload.topic) === constants.CHANNEL_CHAT) {
      notiTitle = "New message in " + msgPayload.topic;
      notiBody = userValue.name + ": "  + notiBody;
    }

    if (window && window.process && window.process.type) {
      // For desktop
      myWindow.flashFrame(true);
      _handleAppNotification(msgPayload);

      // if(trayModule)
      //   trayModule.changeImageToNew();
    } else {
      // For browser
      _handleWebNotification(msgPayload);
    }
  }

  function _handleAppNotification(msgPayload) {
    // node-notifier doesn't support image url for icon.
    audio.play();
    notifier.notify({
      title: notiTitle,
      message: notiBody,
      icon: appRootPath + '/favicon.png',// Absolute path (doesn't work on balloons)
      sound: false, // Only Notification Center or Windows Toasters
      wait: true // Wait with callback, until user action is taken against notification
    //}, funcion(err, response) {
    //  console.log(err, response);
    });
    console.log("### notification ### channelId = %s senderId = %s msg = %s",
      msgPayload.channelId, msgPayload.senderId, msgPayload.msg);

    notifier.on('click', function(){
      myWindow.focus();
      myWindow.show();

      changeTarget(msgPayload.topic);
    });
    //notifier.on('timeout', function(notifierObject, options){});
  }

  function _handleWebNotification(msgPayload) {
    var notification = null;

    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      audio.play();
      notification = new Notification(
        notiTitle,
        {icon: notiIcon, body: notiBody});

      console.log("granted: topic = %s senderId = %s msg = %s sound = %s",
        msgPayload.topic, msgPayload.senderId, msgPayload.msg, notification.sound);
    }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          audio.play();
          notification = new Notification(
            notiTitle,
            {icon: notiIcon, body: notiBody});
        } else {
          return;
        }

        console.log("default: topic = %s senderId = %s msg = %s",
          msgPayload.topic, msgPayload.senderId, msgPayload.msg);
      });
    } else {
      return;
    }

    if (notification !== null) {
      setTimeout(function(){notification.close();}, 3000);
      notification.onclick = function(event) {
        notification.close();
        event.preventDefault();
        window.focus();
        
        changeTarget(msgPayload.topic);
      };
    }
  }

  var changeTarget = function (topic) {
    var $targetList = null;
    if (getChatType(topic) === constants.DIRECT_CHAT)
      $targetList = $("#users-list li[data-topic='"+topic+"']");
    else
      $targetList = $("#channels-list li[data-topic='"+topic+"']");

    $targetList.click();
  };

  return {
    handleNotification: handleNotification
  };
})();

module.exports = noti;
