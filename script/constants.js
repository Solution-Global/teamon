function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// [Common]
define("CHANNEL_WEB", "WEB");
define("CHANNEL_APP", "APP");

define("COMMON_SEARCH_ALL", -1);
define("COMMON_DB_NUMBER_NULL_STR", "-999999");
define("COMMON_SEARCH_COUNT", 10);
define("COMMON_SEARCH_OFFSET", 0);
define("COMMON_SEARCH_ORDER_ASC", "asc");
define("COMMON_SEARCH_ORDER_DESC", "desc");

define("DIRECT_CHAT", 0);
define("CHANNEL_CHAT", 1);

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

// command 토픽 메시지 payload type
// group 관련
define("GROUP_CREATE", 0);
define("GROUP_ADD_MEMBER", 1);
define("GROUP_REMOVE_MEMBER", 2);
// call 관련
define("CALL_SHARE_CHID", 100);   // 발신자가 생성한 call history id 값을 수신자에게 공유

// [call]
define("CALL_GW_URL", "wss://192.168.5.53:8989/janus");    // sip gw
define("SIP_PROXY", "sip:192.168.5.53:5062");
define("SIP_DOMAIN", "192.168.5.53");

// [file]
// define("UPLOAD_URL", API_HOST_PORT + "/upload/");
// define("REPOSITORY_URL", API_HOST_PORT + "/repository/");
