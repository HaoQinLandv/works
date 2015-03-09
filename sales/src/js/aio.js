//= include _tpl.js
var VERSION = chrome.runtime.getManifest().version;
var ss = window.sessionStorage;
var CATE = ss ? ss.cates : '{}';
var APIURL = 'http://zhufu.sinaapp.com/api';
try {
    CATE = JSON.parse(CATE);
} catch (e) {
    CATE = null;
}
if (!CATE || !CATE.malls) {
    $.get(APIURL + '/getCateArray.php?v=' + VERSION, function(json) {
        if (json.errno === 0) {
            CATE = json.data;
            ss.cates = JSON.stringify(CATE);
        }
    });
}


function init(){
    //添加导航
    nav(CATE);
}

function nav(data){
    console.log(data);
    var $nav = $('#J-nav');
    var malls = data.malls,
        cates = data.cates;
    malls.forEach(function(v){
        console.log(v);
    });
}

init();

