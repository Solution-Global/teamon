var notifier = require('node-notifier');

var noti = (function() {

  function handleNotification (msgPayload) {
    if(window && window.process && window.process.type) {
      // For desktop
      _handleAppNotification(msgPayload);
    } else {
      // For browser
      _handleWebNotification(msgPayload);
    }
  }

  function _handleAppNotification (msgPayload) {
    //var msgPayload = JSON.parse(payloadStr);

    var channelValue = channelCache.get(msgPayload.topic);
    var userValue = userCache.get(msgPayload.senderId);

    var notiTitle = "New message form " + userValue.name;
    var notiBody = msgPayload.msg;
    var notiIcon = path.join(__dirname, '../img/profile_no.jpg');

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
      myWindow.focus();

      changeTarget(msgPayload.topic);

    });
    //notifier.on('timeout', function(notifierObject, options){});
  }

  function _handleWebNotification (msgPayload) {
    var notification = null;
    //var msgPayload = JSON.parse(payloadStr);

    var channelValue = channelCache.get(msgPayload.topic);
    var userValue = userCache.get(msgPayload.senderId);

    var notiTitle = "New message form " + userValue.name;
    var notiBody = msgPayload.msg;
    var notiIcon = "../img/profile_no.jpg";

    if(getChatType(msgPayload.topic) === constants.CHANNEL_CHAT) {
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

      changeTarget(msgPayload.topic);
    };
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
