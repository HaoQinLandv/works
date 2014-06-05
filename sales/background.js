var ls = window.localStorage;
//规则放在localstorage
var ruleList = null;
//当前设置放在setting
var setting = {

};


//购物频道
(function(window, chrome, $) {
    var lock = false;
    if (!lock) {
        getHtml();
    }
    var data = {};
    var count = 0;
    var notificationData = {};

    function getHtml() {
        lock = true;
        $.get('http://guangdiu.com/m/loaddata.php?v=' + (+new Date()) + '&p=1', function(html) {
            lock = false;
            if (!html) {
                return false;
            }
            count = 0;
            var $node = $(html);
            $node.find('.leftcontent').each(function(i, v) {
                var $t = $(v);
                var id = $.trim($t.find('a.title').attr('href')).match(/id=(\d+)$/);
                if (!id) {
                    console.log($t.html());
                    return;
                }
                id = id[1];
                count += 1;
                var title = $.trim($t.find('a.title').text());
                var img = $t.find('.thumbnail img').attr('src');
                var abstract = $.trim($t.find('.abstract').text());
                var mallname = $.trim($t.find('.mallname').text())
                var from = $.trim($t.find('.info').text());
                var url = $t.find('.buy').attr('href');
                from = from.replace('同步', '').replace(/^.*前从/, '').trim();
                data[id] = {
                    title: title,
                    img: img,
                    desc: abstract,
                    mallname: mallname,
                    id: id,
                    form: from,
                    orgiUrl: url
                };

            });
            for (var id in data) {
                var url = data[id].orgiUrl;
                getUrl(url, id, data);
            }
        });
    }

    function doNotice() {
        count--;
        // console.log(count);
        if (count === 0) {
            var result = [];
            console.log(data);
            for (var id in data) {
                var d = data[id];
                if (d.title.indexOf('京东') !== -1) {
                    result.push(d);
                }
            }
            if (result.length) {
                notificationData[result[0].id] = result[0];
                chrome.notifications.onClicked.addListener(function(id) {
                    if (notificationData[id]) {
                        chrome.tabs.create({
                            url: notificationData[id].url
                        });
                    }
                });
                chrome.notifications.create('' + result[0].id, {
                    type: 'basic',
                    title: '【京东】的优惠信息',
                    iconUrl: result[0].img,
                    message: result[0].title
                }, function() {});
            }
        }
    }

    function getUrl(url, id, data) {
        if (url.indexOf('guangdiu-23') !== -1) {
            //亚马逊
            data[id].url = url.replace('guangdiu-23', 'wangyongqing-23');
            doNotice();
        } else if (url.indexOf('go.php?id') !== -1) {
            //易迅&京东&苏宁
            url = url.replace('../', 'http://guangdiu.com/');

            $.get(url).done(function(html) {
                var m = html.match(/<noscript><meta.*?url=(.*?)"><\/noscript>/);
                if (m) {
                    if (m[1].indexOf('jd.com') !== -1 || m[1].indexOf('360buy.com') !== -1) {
                        data[id].url = m[1].replace(/unionId=(\d+)/, 'unionId=28271');
                    } else if (m[1].indexOf('suning.com') !== -1) {
                        data[id].url = 'http://c.duomai.com/track.php?site_id=121938&aid=84&euid=&t=' + encodeURIComponent(m[1]);
                    } else if (m[1].indexOf('dangdang.com') !== -1) {
                        //dangdang
                        data[id].url = 'http://union.dangdang.com/transfer.php?from=P-245603&ad_type=10&sys_id=1&backurl=' + encodeURIComponent(m[1]);
                    } else if (m[1].indexOf('yixun.com') !== -1 || m[1].indexOf('51buy.com') !== -1) {
                        data[id].url = 'http://c.duomai.com/track.php?site_id=121938&aid=337&euid=&t=' + encodeURIComponent(m[1]);
                    } else {
                        data[id].url = m[1];
                    }
                } else {
                    data[id].url = url;
                }
                doNotice();
            });
            //http://click.union.jd.com/JdClick/?unionId=28271&t=4&to=http://www.jd.com/product/1128191.html
            /**
             *  <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"><html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title></title><script type="text/javascript">window.onload=function(){var u='http://click.union.360buy.com/JdClick/?unionId=16282&siteId=14491863&to=http%3A%2F%2Fitem.jd.com%2F412487.html';if(document.all){var l = document.createElement('a');l.href = u;document.body.appendChild(l);l.click();}else{window.location.href = u;}}</script><noscript><meta http-equiv="refresh" content="0;url=http://click.union.360buy.com/JdClick/?unionId=16282&siteId=14491863&to=http%3A%2F%2Fitem.jd.com%2F412487.html"></noscript></head><body></body></html>
             *  http://union.suning.com/aas/open/vistorAd.action?userId=98939&webSiteId=0&adInfoId=00&adBookId=0&subUserEx=_495_0__0&vistURL=http%3A%2F%2Fwww.suning.com%2Femall%2Fsnupgbpv_10052_10051_3423914_128807_.html
             *  http://redirect.cps.yixun.com/v1/app?extra=ZXVpZHxfMzM3XzBfXzA%3D&timestamp=1401847709&url=http%3A%2F%2Fevent.yixun.com%2Fevent%2F209005528.html&yid=duomai&token=cfd33237f70b1002e3d1ef9416ad32b8
             */
        } else if (url.indexOf('jumptotmall.php?id') !== -1) {
            //天猫
            url = url.replace('../', 'http://guangdiu.com/');
            $.get(url).done(function(html) {
                var url = $(html).find('a.tblink').attr('href');
                data[id].url = url;
                doNotice();
            });
        } else if (url.indexOf('yhd.com') !== -1) {
            //一号店
            data[id].url = url;
            doNotice();
        } else if (url.indexOf('dangdang.com') !== -1) {
            //dangdang
            data[id].url = 'http://union.dangdang.com/transfer.php?from=P-245603&ad_type=10&sys_id=1&backurl=' + encodeURIComponent(url);

            doNotice();
        } else {
            url = url.replace('../', 'http://guangdiu.com/');
            data[id].url = url;
            doNotice();
        }
    }


}(window, chrome, jQuery));
