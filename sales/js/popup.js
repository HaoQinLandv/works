var API = {
    list: 'http://zhufu.sinaapp.com/api/getdata.php?page=',
    maxid: 'http://zhufu.sinapp.com/api/getmaxid.php'
};
var emptyFn = function(){};
var FIRST = true;
$(function() {

    var Template = $('#J-template').html();
    var $content = $('#J-content');
    var $loadmore = $('#J-loadmore').click(function() {
        $loadmore.hide();
        $loading.show();
        $.getJSON(API.list + PAGE).done(append);
    });
    var $loading = $('#J-loading');

    var PAGE = 1;

    $('#J-close').click(function() {
        window.close();
    });

    $.getJSON(API.list + PAGE).done(append);

    $content.delegate('button.buy', 'click', function() {
        chrome.tabs.create({
            url: $(this).data('link')
        });
    });

    function append(json) {
        $loadmore.show();
        $loading.hide();
        if (json.errno === 0) {
            PAGE++;
            var html = '';
            var now = +new Date();
            json.data.forEach(function(v) {
                v.detail = v.detail.slice(0, 80);
                html += TPL(Template, v);
            });
            $content.append(html);

            if (FIRST && json.maxid) {
                FIRST = false;
                localStorage.maxCnDealId = json.maxid;
                chrome.browserAction.setBadgeBackgroundColor({
                    color: [255, 68, 68, 255]
                });
                chrome.browserAction.setBadgeText({
                    text: ''
                });
                chrome.browserAction.setTitle({
                    title: '里面条目您都看过了，等有更新了我立马儿通知您！'
                });
            }
        }
    }
});



function TPL(html, data) {
    for (var i in data) {
        html = html.replace(new RegExp('<%=\\s*' + i + '\\s*%>', 'g'), data[i]);
    }
    return html;
}


chrome.runtime.sendMessage({
    action: 'startFeedTimer'
}, emptyFn);
