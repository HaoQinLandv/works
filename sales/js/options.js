var Labels = ['label-success', 'label-info', 'label-important', 'label-warning', '', 'label-inverse'];
var ls = window.localStorage;
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
    "openNotice": true
}, settings);
var emptyFn = function() {};
var ID = (+new Date());
$(function() {

    $('[data-toggle="tooltip"]').tooltip();

    $('#J-sound-test').click(function() {
        var $node = $(this);
        $node.button('loading');
        var b = new Audio('sound/notify.mp3');
        b.addEventListener('play', function() {
            $node.button('loading');
        });
        b.addEventListener('ended', function() {
            $node.button('reset');
        });
        b.play();
    });

    $("#J-desktop-test").click(function() {
        chrome.notifications.create('test-desktop' + (ID++), {
            type: 'basic',
            title: 'Razer 雷蛇 Kraken 北海巨妖 游戏耳机  159元包邮',
            message: '雷蛇Kraken北海巨妖是一款兼顾电竞和音乐的游戏耳机...',
            iconUrl: '../img/test.jpg',
            buttons: [{
                title: '立即去抢购>>',
                iconUrl: '../icon64.png'
            }]
        }, function() {});
    });

    //绑定定时静默时间选择器事件
    $('.J-timer-select').change(function() {
        var $t = $(this);
        var val = this.value;
        var quietTimer = ls.quietTimer ? ls.quietTimer : '';
        quietTimer = quietTimer.split('-');
        quietTimer[$t.data('index') | 0] = val;
        quietTimer = quietTimer.map(function(v) {
            return v ? v : 0;
        });
        ls.quietTimer = quietTimer.join('-');
        chrome.runtime.sendMessage({
            action: 'updateQuietTimer'
        }, emptyFn);
    });
    //设置开关
    for (var i in settings) {
        // console.log(i, settings[i]);
        $('input[data-lsid="' + i + '"]').attr('checked', !!settings[i]);
        if (i === 'beQuiet') {
            if (!!settings[i]) {
                $('.J-timer-select').removeAttr('disabled');
                var quietTimer = ls.quietTimer ? ls.quietTimer : '';
                quietTimer = quietTimer.split('-');
                if (quietTimer.length !== 2) {
                    $('.J-timer-select').val(0);
                    ls.removeItem('quietTimer');
                } else if ((quietTimer[0] | 0) >= (quietTimer[1] | 0)) {
                    $('.J-timer-select').val(0);
                    ls.removeItem('quietTimer');
                } else {
                    $('#J-quiet-time1').val(quietTimer[0]).trigger('change');
                    $('#J-quiet-time2').val(quietTimer[1]).trigger('change');
                }
            } else {
                $('.J-timer-select').attr('disabled', 'disabled');
            }
        }
    }
    //绑定开关事件
    $('.J-switch').change(function() {
        var st = settings;
        var $t = $(this);
        var lsid = $t.data('lsid');
        st[lsid] = !!this.checked;
        if (lsid === 'beQuiet') {
            if (this.checked) {
                $('.J-timer-select').removeAttr('disabled');
            } else {
                $('.J-timer-select').attr('disabled', 'disabled');
            }
        }
        ls.settings = JSON.stringify(st);
        chrome.runtime.sendMessage({
            action: 'updateSwitch',
            id: lsid,
            value: this.checked
        }, emptyFn);
    }).each(function(i, v) {
        new Switchery(v);
    });
    $('#J-max-notify').val(localStorage.MAX_NOTIFY ? localStorage.MAX_NOTIFY : 3).change(function() {
        localStorage.MAX_NOTIFY = $(this).val();
    });
    //关键字事件--------------------------
    $('#J-keyword-submit').click(function() {
        keypress();
        return false;
    });
    $('#J-keyword').keypress(function(e) {
        if (e.keyCode === 13) {
            keypress();
        }
    });
    if (keywords.length) {
        var html = '';

        keywords.forEach(function(v) {
            html += '<span class="label ' + getRandomLabelClass() + '">' + v + '<span class="J-close icon-close"></span></span>';
        });
        $('#J-kw-con').html(html);
    }



    $('#J-hot-keyword').delegate('span.J-label', 'click', function() {
        var $t = $(this);
        var kw = $t.html();
        insertKeyword(kw);
    });
    $('#J-kw-con').delegate('.J-close', 'click', function(e) {
        var $t = $(this).parent();
        var kw = $.trim($t.text());
        if (keywords.indexOf(kw) !== -1) {
            keywords.splice(keywords.indexOf(kw), 1);
            ls.keywords = JSON.stringify(keywords);
            chrome.runtime.sendMessage({
                action: 'updateKeyword'
            }, emptyFn);
        }
        $t.remove();
        if ($('#J-kw-con').children().length === 0) {
            $('#J-kw-con').html('<p>竟然还是空的，添加订阅关键字会帮你监控你想要的优惠信息哦</p>');
        }
    });

    function keypress() {
        var kw = $.trim($('#J-keyword').val());
        if (kw === '') {
            return false;
        } else {
            insertKeyword(kw);
            $('#J-keyword').val('');
        }
        return false;
    }

    //关键字事件<<<<<<<<<<<<<<-------------

    $('#J-about .nav-tabs a').click(function(e) {
        e.preventDefault();
        $(this).tab('show');
    });
    var Manifest = chrome.runtime.getManifest();
    var version = Manifest.version;
    $('#J-version').html('<p>当前版本 V' + version + '</p>');
    $('#J-update-btn').click(function() {
        var $t = $(this);
        $t.button('loading');
        $.ajax({
            url: 'http://clients2.google.com/service/update2/crx?response=updatecheck&x=id%3Dfencnigkojiegaifcngopoenckcgbcoo%26uc',
            dataType: 'xml',
            success: function(xml) {
                if (!xml) {
                    $('#J-update-info').html('检查失败，请稍后再试').addClass('error');
                    return;
                }
                var $updateInfo = $(xml).find('updatecheck');
                var xmlVersion = $updateInfo.attr('version');
                if (xmlVersion) {
                    var v = verson_compare(xmlVersion, version);
                    if (v > 0 && $updateInfo.attr('codebase')) {
                        //有更新
                        $('#J-update-info').html('发现最新版本：v' + xmlVersion + '，<a target="_blank" class="btn btn-info" href="https://chrome.google.com/webstore/detail/fencnigkojiegaifcngopoenckcgbcoo">立即更新</a>').removeClass('error');
                    } else if (v === 0) {
                        //已经是最新版
                        $('#J-update-info').html('已经是最新版').removeClass('error');
                    } else {
                        //测试版？
                        $('#J-update-info').html('额，难道是传说中的测试版？').removeClass('error');
                    }
                }else{
                    $('#J-update-info').html('已经是最新版').removeClass('error');
                }

                $t.button('reset');
            },
            timeout: 3000,
            error: function() {
                $('#J-update-info').html('检查失败，请稍后再试').addClass('error');
                $t.button('reset');
            }
        });
    });
    getHot();
    $('#J-send-mail').click(function() {
        if ($('#J-mybug').val().length < 10) {
            alert('多写两句再发送吧~');
            $('#J-mybug').focus();
            return;
        }
        var $t = $(this);
        $t.button('loading');
        $.post('http://zhufu.sinaapp.com/api/mail.php', {
            content: encodeURIComponent($('#J-mybug').val()),
            email: encodeURIComponent($('#J-email').val())
        }).done(function() {
            $t.button('reset');
            $('#J-mybug').val('');
            alert('发送成功，谢谢您的反馈~');
        });
    });

    $('#J-like').click(function() {
        chrome.tabs.create({
            url: $(this).data('link')
        });
    });

});

function insertKeyword(kw) {
    if (keywords.indexOf(kw) !== -1) {
        // console.log(keywords, keywords.indexOf(kw));
        return;
    }
    // console.log(keywords);
    keywords.push(kw);
    ls.keywords = JSON.stringify(keywords);
    chrome.runtime.sendMessage({
        action: 'updateKeyword'
    }, emptyFn);
    if ($('#J-kw-con span').length) {

        $('<span class="label ' + getRandomLabelClass() + '">' + kw + '<span class="J-close icon-close"></span></span>').hide().insertBefore($('#J-kw-con span').eq(0)).show('fast');
    } else {
        $('#J-kw-con').empty().html('<span class="label ' + getRandomLabelClass() + '">' + kw + '<span class="J-close icon-close"></span></span>');
    }
}

function getRandomLabelClass() {
    return Labels[Math.floor(Math.random() * Labels.length)];
}

function verson_compare(version1, version2) {
    version2 += '';
    version1 += '';

    var a = version1.split('.'),
        b = version2.split('.'),
        i = 0,
        len = Math.max(a.length, b.length);

    for (; i < len; i++) {
        if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
            return 1;
        } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
            return -1;
        }
    }
    return 0;
}

function getHot() {
    var kws = sessionStorage.hotKeywords;
    try {
        kws = JSON.parse(kws);
    } catch (e) {}
    // console.log(kws);
    if (!kws) {
        $.getJSON('http://zhufu.sinaapp.com/api/gethot.php').done(function(json) {
            cb(json);
            try {
                sessionStorage.hotKeywords = JSON.stringify(json);
            } catch (e) {}
        });
    } else if (Array.isArray(kws) && kws.length) {
        cb(kws);
    }

    function cb(json) {
        var html = '';
        json.forEach(function(v) {
            html += '<span title="点击添加到订阅" class="J-label label ' + getRandomLabelClass() + '">' + v + '</span>';
        });
        $('#J-hot').after(html);
    }
}
