var ls = window.localStorage;
var VERSION = chrome.runtime.getManifest().version;
//关键词
var keywords = ls.keywords ? ls.keywords : '[]';
try {
    keywords = JSON.parse(keywords);
} catch (e) {
    keywords = [];
    ls.keywords = '[]';
}
$(function() {
    var pager = {};
    var curKeyword;
    var $info = $('#J-info');
    var Template = $('#J-template').html();
    var $content = $('#J-content').delegate('button[data-link]', 'click', function() {
        var url = $(this).data('link');
        chrome.tabs.create({
            url: url
        });
    });
    var $loadmore = $('#J-loadmore').click(function() {
        $loadmore.hide();
        $loading.show();

        if (curKeyword) {
            getData(curKeyword, pager[curKeyword]);
        }
    });
    var $loading = $('#J-loading');
    var $list = $('#J-query-q').delegate('a', 'click', function() {
        var $t = $(this);
        var q = $.trim($t.text());
        $('#J-query-q').find('li.active').removeClass('active');
        $content.empty();
        $t.parent().addClass('active');
        curKeyword = q;
        pager[q] = 1;
        getData(q, pager[q]);
    });
    var html = '';
    keywords.forEach(function(v) {
        html += '<li><a href="###">' + v + '</a></li>';
    });
    $list.html(html).find(':first').addClass('active');
    if (keywords.length && keywords[0] !== '') {
        curKeyword = keywords[0];
        getData(keywords[0], 1);
    } else {
        $loadmore.hide();
        $loading.hide();
        $info.hide();
        $('#J-empty-info').fadeIn();
    }
    $('#J-top').click(function() {
        $('body').animate({
            scrollTop: 0
        }, 'fast');
    });
    var timer;
    $(window).scroll(function() {
        timer && clearTimeout(timer);
        timer = setTimeout(function() {
            var t = $(window).scrollTop();
            if (t > 100) {
                $('#J-top').show();
            } else if (t < 100) {
                $('#J-top').hide();
            }
        }, 300);
    });
    var xhr;

    function getData(q, page) {
        xhr && xhr.abort();
        $loadmore.hide();
        $loading.show();
        $info.hide();

        xhr = $.getJSON('http://zhufu.sinaapp.com/api/search.php?v=' + VERSION + '&q=' + encodeURIComponent(q) + '&page=' + page).done(function(json) {
            if (json && json.errno === 0) {
                var html = '';
                json.data.forEach(function(v) {
                    v.title = v.title.replace(new RegExp(q, 'g'), '<span class="key">' + q + '</span>');
                    v.detail = v.detail.replace(new RegExp(q, 'g'), '<span class="key">' + q + '</span>');
                    html += TPL(Template, v);
                });
                if (page === 1) {
                    $content.html(html);
                } else {
                    $content.append(html);
                }
                pager[q] = ++page;
                if (json.data.length < 30) {
                    $info.html('没有更多特价商品了').show();
                    $loadmore.hide();
                } else {
                    $info.hide();
                    $loadmore.show();

                }
            } else if (json.errno === 1) {
                $loadmore.hide();
                $info.html('没有更多特价商品了').show();
            } else if (json.errno === 2) {
                $info.html('在三天内的特价信息中，木有找到【<span class="keyword">' + q + '</span>】的特价信息，再等等吧~').show();
                $loadmore.hide();
            }

            $loading.hide();
        });
    }


    $('#J-keyword-submit').unbind().click(function() {
        keypress();
        return false;
    });
    $('#J-keyword').unbind().keypress(function(e) {
        if (e.keyCode === 13) {
            keypress();
        }
    });
    function keypress(){
        var q = $.trim($('#J-keyword').val());
        if(q.length!==0){
            $('#J-query-q').find('li.active').removeClass('active');
            $content.empty();
            getData(q, 1);

        }else{
            $('#J-keyword').focus();
        }
    }
});

//= include _tpl.js

