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

define("GROUP_CREATE", 0);
define("GROUP_ADD_MEMBER", 1);
define("GROUP_REMOVE_MEMBER", 2);

// [API]
define("API_URL", "http://192.168.1.164:7587/rest");
define("API_HEADER_X_UANGEL_USER", "system");
define("API_HEADER_X_UANGEL_CHANNEL", "Desktop App");
define("API_HEADER_X_UANGEL_AUTHID", "test");
define("API_HEADER_X_UANGEL_AUTHKEY", "e7575605-3d58-491f-8413-d11f5a2c7c3c");
define("API_HEADER_Content_Type", "application/x-www-form-urlencoded");

// [msg]
// mqtt
define("MQTT_URL", "mqtt://192.168.1.164:2883");

// topic
define("TOPIC_PRESENCE", "/presence");
define("TOPIC_PRESENCE_ALL", "/presence/+");
define("TOPIC_PRESENCE_ONLINE", "/presence/online");
define("TOPIC_PRESENCE_OFFLINE", "/presence/offline");
define("TOPIC_PRESENCE_STATE", "/presence/state");
define("TOPIC_PRESENCE_KEEPALIVE", "/presence/keepalive");
define("TOPIC_MSG", "/msg");
define("TOPIC_COMMAND", "/command");

// [call]
// define("CALL_GW_URL", "wss://192.168.5.54:8989/janus");    // videocall
define("CALL_GW_URL", "wss://192.168.5.53:8989/janus");    // sip gw
define("SIP_PROXY", "sip:192.168.5.53:5062");
define("SIP_DOMAIN", "192.168.5.53");

// [file]
define("UPLOAD_URL", "http://192.168.1.164:7587/upload/");
define("REPOSITORY_URL", "http://192.168.1.164:7587/repository/");
