var APIURL = 'http://zhufu.sinaapp.com/api';
var ls = window.localStorage;
//关键词
var VERSION = chrome.runtime.getManifest().version;
var ss = window.sessionStorage;
var settings = ls.settings ? ls.settings : '{}';
var keywords = ls.keywords ? ls.keywords : '[]';
try {
    settings = JSON.parse(settings);
} catch (e) {
    settings = {};
    ls.settings = '{}';
}
try {
    keywords = JSON.parse(keywords);
} catch (e) {
    keywords = [];
    ls.keywords = '[]';
}
settings = $.extend({
    "openKeyword": true,
    "openMusic": true,
    "beQuiet": true,
    "openNotice": true,
    "hitaoNotice": true
}, settings);
var emptyFn = function() {};
