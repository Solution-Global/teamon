function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// [Common]
define("COMMON_SEARCH_ALL", -1);
define("COMMON_SEARCH_COUNT", 10);
define("COMMON_SEARCH_OFFSET", 0);
define("COMMON_SEARCH_ORDER_ASC", "asc");
define("COMMON_SEARCH_ORDER_DESC", "desc");

define("DIRECT_CHAT", 0);
define("GROUP_CHAT", 1);

// [API]
//var API_HOST_PORT = "http://192.168.1.164:7587";     // blue dev
//var API_HOST_PORT = "http://192.168.1.164:9587";      // blue demo
var API_HOST_PORT = "http://211.253.26.248:7587";      // ubiz
define("API_URL", API_HOST_PORT + "/rest");
define("API_HEADER_X_UANGEL_USER", "system");
define("API_HEADER_X_UANGEL_CHANNEL", "Desktop App");
define("API_HEADER_X_UANGEL_AUTHID", "test");
define("API_HEADER_X_UANGEL_AUTHKEY", "e7575605-3d58-491f-8413-d11f5a2c7c3c");
define("API_HEADER_Content_Type", "application/x-www-form-urlencoded");

// [msg]
// mqtt
//define("MQTT_URL", "mqtt://192.168.1.164:2883");    // blue
define("MQTT_URL", "mqtt://211.253.26.248:2883");    // ubiz

// topic
define("TOPIC_PRESENCE", "/presence");
define("TOPIC_PRESENCE_ALL", "/presence/+");
define("TOPIC_PRESENCE_ONLINE", "/presence/online");
define("TOPIC_PRESENCE_OFFLINE", "/presence/offline");
define("TOPIC_PRESENCE_STATE", "/presence/state");
define("TOPIC_PRESENCE_KEEPALIVE", "/presence/keepalive");
define("TOPIC_MSG", "/msg");
define("TOPIC_COMMAND", "/command");

// command 토픽 메시지 payload type
// group 관련
define("GROUP_CREATE", 0);
define("GROUP_ADD_MEMBER", 1);
define("GROUP_REMOVE_MEMBER", 2);
// call 관련
define("CALL_SHARE_CHID", 100);   // 발신자가 생성한 call history id 값을 수신자에게 공유

// [call]
// 사내 janus
// define("CALL_GW_URL", "wss://192.168.5.53:8989/janus");
// define("SIP_DOMAIN", "192.168.5.53");
// ubiz janus
define("CALL_GW_URL", "wss://211.253.26.248:8989/janus");
define("SIP_DOMAIN", "172.27.0.33");

// [file]
define("UPLOAD_URL", API_HOST_PORT + "/upload/");
define("REPOSITORY_URL", API_HOST_PORT + "/repository/");

// peerjs server
define("PEERJS_HOST", "211.253.26.248");
define("PEERJS_PORT", "9000");
define("PEERJS_KEY", "teamon");
