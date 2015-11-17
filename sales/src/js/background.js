//= include _tpl.js
//= include _config.js
var ID = (+new Date());

// var MAX_NOTIFY = 6;

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


var feedTimer, noticeTimer;
//5分钟获取一次
var feedInterval = 5 * 60 * 1000;
var noticeInterval = 5 * 60 * 1000;

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
    $.get(APIURL + '/newfeed.php?v=' + VERSION + '&id=' + curmaxidloop, function(data) {
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
    $.getJSON(APIURL + '/getdata.php?v=' + VERSION + '&t=' + (+new Date()) + '&page=1&maxnotifyid=' + maxnotifyid, function(json) {
        if (json.errno === 0) {
            var kw;
            ls.maxnotifyid = json.maxid;
            var play = false;
            var notifyCount = 1;
            json.data.forEach(function(v) {
                var id, opt;
                var now = Date.now();


                //订阅关键字,保证最多弹MAX_NOTIFY个
                if (keywords.length && settings.openKeyword && notifyCount <= MAX_NOTIFY) {
                    kw = searchKeywords(v.title, v.mallname);
                    // console.log(kw);
                    if (kw) {
                        v.keyword = kw;
                        var t = kw.split(/[\+@]/),
                            title;
                        if (t.length === 2) {
                            title = '在【' + t[1] + '】找到【' + t[0] + '】的折扣信息';
                        } else {
                            title = '找到【' + kw + '】的折扣信息';
                        }
                        opt = {
                            type: 'basic',
                            title: title,
                            message: v.title,
                            iconUrl: v.img,
                            buttons: [{
                                title: '立即去抢购 >>',
                                iconUrl: 'img/icon64.png'
                            }, {
                                title: '设置消息提醒 >>',
                                iconUrl: 'img/options.png'
                            }]
                        };
                        id = 'kw' + (now++);

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
                    // console.log(v.mallname, v.title, settings);
                    if (v.isus == '1' && !settings.hitaoNotice) {
                        //如果是海淘，关闭了海淘提醒，则过滤
                        return;
                    }
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
                                iconUrl: 'img/icon64.png'
                            }, {
                                title: '设置消息提醒 >>',
                                iconUrl: 'img/options.png'
                            }]
                        };
                        id = 'item' + (now++);

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

    } else if (id.indexOf('install_') === 0 || id.indexOf('update_notify_') === 0) {
        if (i === 0) {
            chrome.tabs.create({
                url: 'options.html'
            });
        } else if (i === 1) {
            chrome.tabs.create({
                url: 'help.html'
            });
        }
    }
});
/**
 * 判断是否是关键词
 * @param  {String} q 查询的query
 * @param {String} mallname 商城名称
 * @return {string}   返回查询到的关键字
 */
function searchKeywords(q, mallname) {
    var kw = keywords;
    if (kw.length === 0) {
        return false;
    }
    for (var i = 0, len = kw.length; i < len; i++) {
        var v = kw[i];
        var t = v.split(/[\+@]/);
        if (t.length === 2) {
            //说明需要判断是否是商城名称
            if (q.indexOf(t[0]) !== -1 && mallname.indexOf(t[1].trim()) !== -1) {
                return v;
            }
        } else {
            if (q.indexOf(v) !== -1) {
                return v;
            }
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
        iconUrl: 'img/icon128.png'
    };
    if (details.reason === 'install') {
        opt.title = '您已经安装成功【折扣商品实时推送】';
        opt.buttons = [{
            title: '设置 >>',
            iconUrl: 'img/options.png'
        }, {
            title: '查看帮助 >>',
            iconUrl: 'img/question.png'
        }];

        chrome.notifications.create('install_' + (+new Date()), opt, function() {});
    } else if (details.reason === 'update') {
        version = chrome.runtime.getManifest().version;
        opt.message += '\n1. 增加海淘信息\n2. 重新设置界面\n3. 勿扰模式更加方便';
        opt.buttons = [{
            title: '设置 >>',
            iconUrl: 'img/options.png'
        }, {
            title: '查看帮助 >>',
            iconUrl: 'img/question.png'
        }];
        chrome.notifications.create('update_notify_' + (+new Date()), opt, function() {});
    }
});
