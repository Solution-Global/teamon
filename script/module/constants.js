function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("DIRECT_CHAT", 0);
define("GROUP_CHAT", 1);

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
define("TOPIC_PUBREQ", "/pubreq");
