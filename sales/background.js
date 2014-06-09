var ls = window.localStorage;
var ss = window.sessionStorage;
var ID = (+new Date());
var VERSION = chrome.runtime.getManifest().version;
// var MAX_NOTIFY = 6;
//从localstorage读取设置
var settings = ls.settings ? ls.settings : '{}';
//关键词
var keywords = ls.keywords ? ls.keywords : '[]';
//静默时间
var quietTimer = ls.quietTimer ? ls.quietTimer : '';
quietTimer = quietTimer.split('-');
if (quietTimer.length !== 2) {
    quietTimer = false;
} else if ((quietTimer[0] | 0) >= (quietTimer[1] | 0)) {
    quietTimer = false;
} else {
    quietTimer = [quietTimer[0] | 0, quietTimer[1] | 0];
}

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
    openKeyword: true,
    openMusic: true,
    beQuiet: true,
    openNotice: true
}, settings);

var emptyFn = function() {};
var feedTimer, noticeTimer;
var feedInterval = 113000;
var noticeInterval = 113000;

var curmaxid = ls.maxCnDealId;
if (!curmaxid) {
    chrome.browserAction.setBadgeBackgroundColor({
        color: [255, 68, 68, 255]
    });
    chrome.browserAction.setBadgeText({
        text: '+'
    });
    chrome.browserAction.setTitle({
        title: '里面这么多好东西您不点开看，鼠标在这悬着干嘛啊您！'
    });
} else {
    checkNewFeed();
}

feedTimer = setInterval(checkNewFeed, feedInterval);

function checkNewFeed() {
    var curmaxidloop = ls.maxCnDealId ? ls.maxCnDealId : 0;
    $.get('http://zhufu.sinaapp.com/api/newfeed.php?v=' + VERSION + '&id=' + curmaxidloop, function(data) {
        if (data > 99) {
            //不再更新
            clearInterval(feedTimer);
            feedTimer = null;
            chrome.browserAction.setBadgeBackgroundColor({
                color: [255, 68, 68, 255]
            });
            chrome.browserAction.setBadgeText({
                text: '99+'
            });
            chrome.browserAction.setTitle({
                title: '更新条数太多了，您快来看看吧'
            });
        } else if (data > 0) {
            chrome.browserAction.setBadgeBackgroundColor({
                color: [255, 68, 68, 255]
            });
            chrome.browserAction.setBadgeText({
                text: data
            });
            chrome.browserAction.setTitle({
                title: '您上次看过以后，这都' + data + '条儿更新了'
            });
        }
    });
}


chrome.runtime.onMessage.addListener(function(obj, sender, callback) {
    switch (obj.action) {
        case 'startFeedTimer':
            //如果收到popup的消息，并且通知类型是显示数字
            if (!feedTimer /*&& ls.noticeType === 'number'*/ ) {
                feedTimer = setInterval(checkNewFeed, feedInterval);
            }
            break;
        case 'updateQuietTimer':
            quietTimer = ls.quietTimer ? ls.quietTimer : '';
            quietTimer = quietTimer.split('-');
            if (quietTimer.length !== 2) {
                quietTimer = false;
                ls.removeItem('quietTimer');
            } else if ((quietTimer[0] | 0) >= (quietTimer[1] | 0)) {
                quietTimer = false;
                ls.removeItem('quietTimer');
            } else {
                quietTimer = [quietTimer[0] | 0, quietTimer[1] | 0];
            }
            break;
        case 'startNotice':
            if (!noticeTimer) {
                noticeTimer = setInterval(checkKeyWordNotice, noticeInterval);
            }
            break;
        case 'updateSwitch':
            try {
                settings = JSON.parse(ls.settings);
                if (obj.id === 'beQuiet' && obj.value === true) {
                    ls.removeItem('quietTimer');
                }
            } catch (e) {}
            break;
        case 'updateKeyword':
            try {
                keywords = JSON.parse(ls.keywords);
            } catch (e) {}
            break;

    }
});


noticeTimer = setInterval(checkKeyWordNotice, noticeInterval);

function checkKeyWordNotice() {
    if (keywords.length === 0) {
        return;
    }
    if (!settings.openNotice && (keywords.length === 0 || !settings.openKeyword)) {
        //没有打开提醒，并且关键词也没打开
        return;
    }
    var maxnotifyid = ls.maxnotifyid;
    if (!maxnotifyid) {
        maxnotifyid = 0;
    }
    var MAX_NOTIFY = ls.MAX_NOTIFY;
    if (!ls.MAX_NOTIFY) {
        //默认弹窗数量为6
        MAX_NOTIFY = 3;
    } else if (ls.MAX_NOTIFY === 'ALL') {
        MAX_NOTIFY = 30;
    } else {
        MAX_NOTIFY |= 0;
        if (MAX_NOTIFY === 0) {
            MAX_NOTIFY = 3;
        }
    }
    $.getJSON('http://zhufu.sinaapp.com/api/getdata.php?v=' + VERSION + '&t=' + (+new Date()) + '&page=1&maxnotifyid=' + maxnotifyid, function(json) {
        // console.log(json);
        if (json.errno === 0) {
            var kw;
            ls.maxnotifyid = json.maxid;
            var play = false;
            var notifyCount = 1;
            json.data.forEach(function(v) {
                var id, opt;
                //订阅关键字,保证最多弹MAX_NOTIFY个
                if (keywords.length && settings.openKeyword && notifyCount <= MAX_NOTIFY) {
                    kw = searchKeywords(v.title);
                    // console.log(kw);
                    if (kw) {
                        v.keyword = kw;
                        opt = {
                            type: 'basic',
                            title: '找到【' + kw + '】的折扣信息',
                            message: v.title,
                            iconUrl: v.img,
                            buttons: [{
                                title: '立即去抢购 >>',
                                iconUrl: '../icon64.png'
                            }, {
                                title: '设置消息提醒 >>',
                                iconUrl: 'img/options.png'
                            }]
                        };
                        id = 'kw' + v.id;

                        chrome.notifications.create(id, opt, function() {
                            //存入sessionStorage
                            ss[id] = JSON.stringify(v);
                            if (!play) {
                                playNotificationSound();
                            }
                            play = true;
                        });
                        notifyCount++;
                    }
                }

                if (settings.openNotice && notifyCount <= MAX_NOTIFY) {
                    var hour = new Date().getHours();
                    hour = hour | 0;
                    var cb = function() {
                        opt = {
                            type: 'basic',
                            title: v.title,
                            message: v.detail.slice(0, 30) + '..',
                            iconUrl: v.img,
                            buttons: [{
                                title: '立即去抢购 >>',
                                iconUrl: '../icon64.png'
                            }, {
                                title: '设置消息提醒 >>',
                                iconUrl: 'img/options.png'
                            }]
                        };
                        id = 'item' + v.id;

                        chrome.notifications.create(id, opt, function() {
                            //存入sessionStorage
                            ss[id] = JSON.stringify(v);

                            if (!play) {
                                playNotificationSound();
                            }
                            play = true;
                        });
                        notifyCount++;
                    };
                    if (!settings.beQuiet) {
                        //如果没有设置安静时间
                        // console.log('没有设置安静时间');
                        cb();
                    } else if (quietTimer &&
                        Array.isArray(quietTimer) &&
                        quietTimer.length === 2 &&
                        quietTimer[0] < quietTimer[1] &&
                        (hour >= quietTimer[0] && hour < quietTimer[1])) {
                        // console.log('在安静时间内');
                    } else {
                        // console.log('其他时间');
                        cb();
                    }


                }
            });

        }
    });
}

chrome.notifications.onClicked.addListener(function(id) {
    if (ss[id]) {
        try {
            var obj = JSON.parse(ss[id]);
            if (obj.url) {
                chrome.tabs.create({
                    url: obj.url
                });
            }

        } catch (e) {
            ss.removeItem(id);
        }
    }
});
chrome.notifications.onButtonClicked.addListener(function(id, i) {
    if (ss[id]) {
        if (i === 0) {
            try {
                var obj = JSON.parse(ss[id]);
                if (obj.url) {
                    chrome.tabs.create({
                        url: obj.url
                    });
                }

            } catch (e) {
                ss.removeItem(id);
            }
        } else if (i === 1) {
            chrome.tabs.create({
                url: 'options.html'
            });
        }

    } else if (id.indexOf('update_notify') === 0) {
        chrome.tabs.create({
            url: 'options.html'
        });
    }
});
/**
 * 判断是否是关键词
 * @param  {String} q 查询的query
 * @return {string}   返回查询到的关键字
 */
function searchKeywords(q) {
    var kw = keywords;
    if (kw.length === 0) {
        return false;
    }
    for (var i = 0, len = kw.length; i < len; i++) {
        var v = kw[i];
        if (q.indexOf(v) !== -1) {
            return v;
        }
    }
    return false;
}

function playNotificationSound() {
    if (settings.beQuiet) {
        return;
    }
    try {
        var notifyAudio = new Audio('sound/notify.mp3');
        notifyAudio.play();
    } catch (e) {}
}


//监控更新
chrome.runtime.onInstalled.addListener(function(details) {
    var version = chrome.runtime.getManifest().version;
    var opt = {
        type: 'basic',
        title: '折扣商品实时推送更新了！',
        message: '当前版本：v' + version,
        iconUrl: 'icon128.png'
    };
    if (details.reason === 'install') {
        opt.title = '您已经安装成功【折扣商品实时推送】';
        opt.buttons = [{
            title: '设置 >>',
            iconUrl: 'img/options.png'
        }];
    } else if (details.reason === 'update') {
        version = chrome.runtime.getManifest().version;
    }
    chrome.notifications.create('update_notify' + (+new Date()), opt, function() {});
});
