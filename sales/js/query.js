var ls = window.localStorage;
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
        pager[q] = (pager[q] ? pager[q] : 1) | 0;
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
    }else{
        $loadmore.hide();
        $loading.hide();
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

        xhr = $.getJSON('http://zhufu.sinaapp.com/api/search.php?q=' + encodeURIComponent(q) + '&page=' + page).done(function(json) {
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
            } else if ($json.errno === 1) {
                alert('没有更多折扣商品了');
            }
            $loadmore.show();
            $loading.hide();
        });
    }
});


function TPL(html, data) {
    for (var i in data) {
        html = html.replace(new RegExp('<%=\\s*' + i + '\\s*%>', 'g'), data[i]);
    }
    return html;
}
