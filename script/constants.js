function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true
    });
}

// [Environment]
// var CLIENT_ENV_USING = "production";
var CLIENT_ENV_USING = "development";
define("CLIENT_ENV_USING", CLIENT_ENV_USING);

// [Software Update]
var SOFTWARE_UPDATE_PORT = 8010;
define("SOFTWARE_UPDATE_PORT", SOFTWARE_UPDATE_PORT);

var SOFTWARE_UPDATE_IP_PROD = "http://211.253.26.248"; // ubiz
var SOFTWARE_UPDATE_IP_DEV = "http://192.168.1.164"; // blue dev
if (CLIENT_ENV_USING === 'production') {
    define("SOFTWARE_UPDATE_URL_BASE", SOFTWARE_UPDATE_IP_PROD + ":" + SOFTWARE_UPDATE_PORT);
} else {
    define("SOFTWARE_UPDATE_URL_BASE", SOFTWARE_UPDATE_IP_DEV + ":" + SOFTWARE_UPDATE_PORT);
}

define("SOFTWARE_UPDATE_URL_PATH_LATEST", "/updates/latest");
define("SOFTWARE_UPDATE_URL_PATH_RELEASE", "/updates/releases");

// [Common]
define("APP_NAME", "TeamOn");
define("CHANNEL_WEB", "WEB");
define("CHANNEL_APP", "APP");

define("COMMON_SEARCH_ALL", -1);
define("COMMON_DB_NUMBER_NULL_STR", "-999999");
define("COMMON_DB_NUMBER_NULL", -999999);
define("COMMON_SEARCH_COUNT", 20);
define("COMMON_SEARCH_OFFSET", 0);
define("COMMON_SEARCH_ORDER_ASC", "asc");
define("COMMON_SEARCH_ORDER_DESC", "desc");

define("DIRECT_CHAT", 0);
define("CHANNEL_CHAT", 1);

// [API]
// ### CAUTION ###
// API_URL, UPLOAD_URL의 경우, web, desktop에 따라 달라지므로,
// teamon.js 파일의 initialize() 부분을 통한 전역 변수(API_URL, UPLOAD_URL)를 사용할 것
if (CLIENT_ENV_USING === 'production') {
  // ubiz
  define("API_URL", "http://211.253.26.248:7587/rest/");
  define("UPLOAD_URL", "http://211.253.26.248:7587/upload/");
  define("IMAGE_URL", "https://211.253.26.248:8083/image/");
  define("REPOSITORY_URL", "http://211.253.26.248:7587/repository/");
} else {
  // blue dev
  define("API_URL", "http://192.168.1.164:7587/rest/");
  define("UPLOAD_URL", "http://192.168.1.164:7587/upload/");
  define("IMAGE_URL", "https://192.168.1.164:8083/image/");
  define("REPOSITORY_URL", "http://192.168.1.164:7587/repository/");
}

// [msg]
// mqtt
if (CLIENT_ENV_USING === 'production') {
    define("MQTT_URL", "mqtt://211.253.26.248:2883"); // ubiz
} else {
    define("MQTT_URL", "mqtt://192.168.1.164:2883"); // blue
}

// topic
define("TOPIC_PRESENCE_ONLINE", "/presence/online");
define("TOPIC_PRESENCE_OFFLINE", "/presence/offline");
define("TOPIC_PRESENCE_STATE", "/presence/state");
define("TOPIC_PRESENCE_KEEPALIVE", "/presence/keepalive");

define("TOPIC_PRESENCE", "/presence");
define("TOPIC_MSG", "/msg");
define("TOPIC_COMMAND", "/command");

// presence 관련
define("PRESENCE_STATUS_ONLINE", 1);
define("PRESENCE_STATUS_OFFLINE", 0);

// channel 관련
define("CHANNEL_CREATE", 0);
define("CHANNEL_ADD_MEMBER", 1);
define("CHANNEL_REMOVE_MEMBER", 2);

// call 관련
define("CALL_SHARE_CHID", 100); // 발신자가 생성한 call history id 값을 수신자에게 공유
if (CLIENT_ENV_USING === 'production') {
    // ubiz janus
    define("CALL_GW_URL", "wss://211.253.26.248:8989/janus");
    define("SIP_PROXY", "sip:172.27.0.33:5062");
    define("SIP_DOMAIN", "172.27.0.33");
} else {
    // local janus
    define("CALL_GW_URL", "wss://192.168.5.53:8989/janus");
    define("SIP_PROXY", "sip:192.168.5.53:5062");
    define("SIP_DOMAIN", "192.168.5.53");
}

// information 영역 관련
define("INFO_AREA_ABOUT_USER", "about_user.html");
define("INFO_AREA_ABOUT_CHANNEL", "about_channel.html");
define("INFO_AREA_MENTION", "mention_list.html");
define("INFO_AREA_SEARCH", "search_list.html");

// chatting 관련
define("MESSAGE_TYPE_APPEND", 1);
define("MESSAGE_TYPE_PREPEND", 2);
define("MENTION_FIRST_DELIMITER", "@");
define("MENTION_LAST_DELIMITER", ": ");
define("LAST_MST_ID_TIMER_INTERVAL", 5000);
define("ALARM_MAX_COUNT", 10);

// channel 관련
define("CHANNEL_TOPIC_DELIMITER", "#");
