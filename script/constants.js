function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// [Common]
define("APP_NAME", "TeamOn");
define("CHANNEL_WEB", "WEB");
define("CHANNEL_APP", "APP");

define("COMMON_SEARCH_ALL", -1);
define("COMMON_DB_NUMBER_NULL_STR", "-999999");
define("COMMON_SEARCH_COUNT", 20);
define("COMMON_SEARCH_OFFSET", 0);
define("COMMON_SEARCH_ORDER_ASC", "asc");
define("COMMON_SEARCH_ORDER_DESC", "desc");

define("DIRECT_CHAT", 0);
define("CHANNEL_CHAT", 1);

// [msg]
// mqtt
define("MQTT_URL", "wss://192.168.1.164:2883");

// topic
define("TOPIC_PRESENCE_ONLINE", "/presence/online");
define("TOPIC_PRESENCE_OFFLINE", "/presence/offline");
define("TOPIC_PRESENCE_STATE", "/presence/state");
define("TOPIC_PRESENCE_KEEPALIVE", "/presence/keepalive");

define("TOPIC_PRESENCE", "/presence");
define("TOPIC_MSG", "/msg");
define("TOPIC_COMMAND", "/command");

// presence 관련
define("PRESENCE_STATUS_ONLINE", 0);
define("PRESENCE_STATUS_OFFLINE", 1);

// channel 관련
define("CHANNEL_CREATE", 0);
define("CHANNEL_ADD_MEMBER", 1);
define("CHANNEL_REMOVE_MEMBER", 2);

// call 관련
define("CALL_SHARE_CHID", 100);   // 발신자가 생성한 call history id 값을 수신자에게 공유
define("CALL_GW_URL", "wss://192.168.5.53:8989/janus");    // sip gw
define("SIP_PROXY", "sip:192.168.5.53:5062");
define("SIP_DOMAIN", "192.168.5.53");

// information 영역 관련
define("INFO_AREA_ABOUT_USER", "about_user.html");
define("INFO_AREA_ABOUT_CHANNEL", "about_channel.html");
define("INFO_AREA_MENTION", "mention_list.html");

// chatting 관련
define("MESSAGE_TYPE_APPEND", 1);
define("MESSAGE_TYPE_PREPEND", 2);
define("MENTION_FIRST_DELIMITER", "@");
define("MENTION_LAST_DELIMITER", ": ");

// channel 관련
define("CHANNEL_TOPIC_DELIMITER", "#");

// [file]
define("REPOSITORY_URL", "http://192.168.1.164:7587/repository/");
