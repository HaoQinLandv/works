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
    $.getJSON(APIURL + '/getCateArray.php?v=' + VERSION, function(json) {
        if (json.errno === 0) {
            CATE = json.data;
            ss.cates = JSON.stringify(CATE);
        }
    });
}


function init() {
    //添加导航
    nav(CATE);
}

function nav(data) {
    var $nav = $('#J-nav');
    var malls = data.malls,
        cates = data.cates;

    var t = '<a class="btn mr5 btn-nav" href="javascript:void(0);" data-type="{{type}}" data-q="{{q}}">{{name}}</a>';
    var html = '<div class="tnav"><a class="btn mr5 btn-success" href="javascript:void(0);" data-type="mall" data-q="all">全部</a>';
    malls.forEach(function(v) {
        html += TPL(t, {
            name: v.shortName,
            type: 'mall',
            q: v.shortName
        });
    });
    html += '</div>';
    html += '<div class="tnav"><a class="btn mr5 btn-success" href="javascript:void(0);" data-type="cate" data-q="all">全部</a>';
    cates.forEach(function(v) {
        html += TPL(t, {
            name: v.name,
            q: v.id,
            type: 'cate'
        });
    });
    html += '</div>';
    $nav.html(html);
}
$(document).ready(function() {
    init();
});
