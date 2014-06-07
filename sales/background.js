var ls = window.localStorage;
var emptyFn = function() {};
var feedTimer, noticeTimer;
var Keywords = [];
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
    var curmaxidloop = ls.maxCnDealId;
    $.get('http://zhufu.sinaapp.com/api/newfeed.php?id=' + curmaxidloop, function(data) {
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
        case 'startNotice':
            if (!noticeTimer) {
                noticeTimer = setInterval(checkNotice, noticeInterval);
            }
            break;
        case 'updateKeywords':
            //更新查询关键词
            if (obj.data) {
                var kws;
                if (Array.isArray(obj.data)) {
                    kws = JSON.stringify(obj.data);
                    Keywords = obj.data;
                    ls.keywords = kws;
                } else if (typeof obj.data === 'string') {
                    try {
                        kws = JSON.parse(obj.data);
                        if (Array.isArray(kws)) {
                            Keywords = kws;
                            ls.keywords = obj.data;
                        }
                    } catch (e) {}
                }
            }
    }
});

var notificationData = {};

function checkNotice() {
    if (Keywords.length === 0) {
        return;
    }
    notificationData = {};
    $.getJSON('http://zhufu.sinaapp.com/api/getdata.php?v=' + (+new Date()) + '&page=1', function(json) {
        if (json.errno === 0) {
            var kw;
            json.data.forEach(function(v) {

                kw = searchKeywords(v.title);
                if (kw) {
                    v.keyword = kw;
                    notificationData[v.id] = v;
                    var opt = {
                        type: 'basic',
                        title: '找到【' + kw + '】的便宜信息',
                        message: v.title,
                        iconUrl: v.img
                    };

                    chrome.notifications.create('' + v.id, opt, emptyFn);
                }
            });
        }
    });
}

chrome.notifications.onClicked.addListener(function(id) {
    if (notificationData[id]) {
        chrome.tabs.create({
            url: notificationData[id].url
        });
    }
});
/**
 * 判断是否是关键词
 * @param  {String} q 查询的query
 * @return {string}   返回查询到的关键字
 */
function searchKeywords(q) {
    var kw = Keywords;
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
