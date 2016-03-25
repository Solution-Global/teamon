var notifier = require('node-notifier');

var noti = (function() {
  var notiTitle = null;
  var notiBody = null;
  var notiIcon = null;
  // TODO have to make page for change of notification sound
  var audio = new Audio('../sound/alarm.wav');

  function handleNotification (msgPayload) {
    var userValue = userCache.get(msgPayload.senderId);

    notiTitle = "New message form " + userValue.name;
    notiBody = msgPayload.msg;
    // TODO change to profile image of user
    notiIcon = "../img/profile_no.jpg";

    if(getChatType(msgPayload.topic) === constants.CHANNEL_CHAT) {
      notiTitle = "New message in " + msgPayload.topic;
      notiBody = userValue.name + ": "  + msgPayload.msg;
    }

    if(window && window.process && window.process.type) {
      // For desktop
      myWindow.setOverlayIcon(path.join(__dirname,'../img/changes.png'), "unread messages");
      myWindow.flashFrame(true) ;
      _handleAppNotification(msgPayload);
    } else {
      // For browser
      _handleWebNotification(msgPayload);
    }
  }

  function _handleAppNotification (msgPayload) {
    audio.play();
    notifier.notify({
      title: notiTitle,
      message: notiBody,
      icon: notiIcon,// Absolute path (doesn't work on balloons)
      sound: false, // Only Notification Center or Windows Toasters
      wait: true // Wait with callback, until user action is taken against notification
    //}, funcion(err, response) {
    //  console.log(err, response);
    });
    console.log("channelId = %s senderId = %s msg = %s",
      msgPayload.channelId, msgPayload.senderId, msgPayload.msg);

    notifier.on('click', function(){
      myWindow.show();
      myWindow.focus();

      changeTarget(msgPayload.topic);
    });
    //notifier.on('timeout', function(notifierObject, options){});
  }

  function _handleWebNotification (msgPayload) {
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

    if(notification !== null) {
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
