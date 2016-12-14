var INTERVAL = 5 * 60 * 1000;
var EVERY_NUM = 50;
var TIMER = setInterval(getEmptyItem, INTERVAL);
var CATE_LIST = [
    'baby',
    'stockup',
    'daily',
    'digital',
    'electrical',
    'food',
    'clothes',
    'makeup',
    'sport',
    'automobile',
    'sale',
    //us
    'us_baby',
    'us_stockup',
    'us_daily',
    'us_digital',
    'us_electrical',
    'us_food',
    'us_clothes',
    'us_makeup',
    'us_sport',
    'us_automobile',
    'us_sale'
];

sessionStorage.unique = '';

//一小时清理一次
setInterval(function() {
    sessionStorage.unique = '';
}, INTERVAL * 12);

setInterval(getList, INTERVAL); //获取list
setInterval(getCateList, INTERVAL);//获取catlist

var cusEvent = {
    _data: {},
    fire: function(name, data) {
        var arr = this._data[name];
        if (arr.length) {
            var len = arr.length;
            for (var i = 0; i < len; i++) {
                var callback = arr[i];
                var once = callback._once;
                callback(data);
                if (once) {
                    arr.splice(i, 1);
                    i--;

                }
            }
        }
        return this;
    },
    once: function(name, callback) {
        return this.add(name, callback);
    },
    add: function(name, callback, once) {
        var arr = this._data[name] = this._data[name] || [];
        if (!~arr.indexOf(callback) && typeof callback === 'function') {
            callback._once = !!once;
            arr.push(callback);
        }
        return this;
    }
};

function getCateList() {

    CATE_LIST.forEach(function(k) {
        var isus = 0;
        if (k.indexOf('us_') === 0) {
            isus = 1;
            var c = k.split('_')[1];

            var url = 'http://guangdiu.com/cate.php?c=us&k=' + c + '&v=' + Date.now() + '&p=1';

        } else {
            //http://guangdiu.com/cate.php?k=daily&c=us
            var url = 'http://guangdiu.com/cate.php?k=' + k + '&v=' + Date.now() + '&p=1';
        }

        get(url, function(isus, k) {
            return function(data) {
                var $dom = $(data);
                var result = [];
                var names = {};
                $dom.find('div.gooditem').each(function(i, v) {
                    var $v = $(v);
                    var $title = $v.find('a.goodname');
                    var $mallname = $v.find('a.rightmallname');
                    var mallname = '';
                    if ($mallname.length) {
                        mallname = $mallname.text().trim();
                    }
                    var id = $title.attr('href');
                    id = id.match(/(\d+)$/)[0];
                    result.push(id);
                    names[id] = mallname;
                });
                result.length && $.post('http://zhufu.sinaapp.com/spider/spider/update_cate.php',{
                    isus: isus,
                    cate: k,
                    ids: JSON.stringify(result),
                    names: JSON.stringify(names)
                }, function(d){
                    console.log(d);
                });
            }
        }(isus, k));
    });


}

function get(url, callback) {
    $.get(url, callback);
}

function getList() {
    var uni = sessionStorage.unique;
    $.get('http://guangdiu.com/index.php?p=1&c=us&v=' + Date.now(), function(data) {
        var result = {};
        $(data).find('.gooditem').each(function(i, v) {
            var $v = $(v);
            var id = $v.find('a.goodname').attr('href');
            if (!id) {
                return;
            }
            id = id.match(/(\d+)$/)[0];
            //保证唯一
            if (uni.indexOf(id) !== -1) {
                return;
            }

            var img = $v.find('.showpic img').attr('src');
            if (/^\/\//.test(img)) {
                img = 'http:' + img;
            }
            var mallname = $v.find('.rightmallname').text().trim();
            var title = $v.find('.mallandname').text().trim().replace(/\n/g, ' ');
            var detail = $v.find('.abstractcontent').text().trim();
            detail = detail.replace(/(.*?)\&nbsp\;\s+完整阅读>/, '$1');

            var source = $v.find('.infofrom').text().trim();
            var url = $v.find('.innergototobuybtn').attr('href');
            source = source.split(/\s+/);
            source = source[1] ? source[1] : source[0];
            source = source.replace(/^从/, '');
            source = source.replace(/同步$/, '');


            result[id] = {
                img: img,
                source: source,
                detail: detail,
                id: id,
                url: url,
                mallname: mallname,
                title: title
            };
        });
        if (Object.keys(result).length > 0) {
            $.post('http://zhufu.sinaapp.com/spider/spider/update_items.php', {
                data: JSON.stringify(result)
            }, function(d) {
                console.log(d);
                d = d.split('\n');
                d.forEach(function(v) {
                    if (/\d+/.test(d) && sessionStorage.unique.indexOf(d) === -1) {
                        sessionStorage.unique += ',' + d;
                    }
                });
            })
        }

    });

    $.get('http://guangdiu.com/m/loaddata.php?v=' + Date.now() + '&p=1', function(data) {

        var result = {};
        $(data).find('.leftcontent').each(function(i, v) {
            var $dom = $(v);
            var id = $dom.find('a.title').attr('href');
            if (!id) {
                return;
            }
            id = id.match(/(\d+)$/)[0];
            //保证唯一
            if (uni.indexOf(id) !== -1) {
                return;
            }
            var title = $dom.find('a.title').text().trim().replace(/\n/g, ' ');
            var img = $dom.find('.thumbnail img').attr('src');
            if (/^\/\//.test(img)) {
                img = 'http:' + img;
            }

            var mallname = $dom.find('.mallname').text().trim();
            var detail = $dom.find('.abstract').text().trim();
            var url = $dom.find('.buy').attr('href');
            var source = $dom.find('.info').text().trim();
            source = source.split(/\s+/);
            source = source[1] ? source[1] : source[0];
            result[id] = {
                img: img,
                source: source,
                detail: detail,
                id: id,
                url: url,
                mallname: mallname,
                title: title
            };
        });

        if (Object.keys(result).length > 0) {
            $.post('http://zhufu.sinaapp.com/spider/spider/update_items.php', {
                data: JSON.stringify(result),
                isus: 1
            }, function(d) {
                d = d.split('\n');
                d.forEach(function(v) {

                    if (/\d+/.test(d) && sessionStorage.unique.indexOf(d) === -1) {

                        sessionStorage.unique += ',' + d;
                    }
                });
            })
        }

    });
}

function getEmptyItem() {
    $.get('http://zhufu.sinaapp.com/spider/spider/get_empty_url.php?num=' + EVERY_NUM, function(data) {
        data = data.split('\n');
        var result = [];
        data.forEach(function(t) {
            t = t.split(',,,');
            if (t.length === 2) {
                result.push({
                    id: t[0],
                    url: t[1]
                });
            }
        });

        getUnionUrl(result);
    });
}
chrome.webRequest.onBeforeRedirect.addListener(function(detail) {
    if (detail.statusCode === 301 && detail.redirectUrl) {
        cusEvent.fire(detail.url, detail.redirectUrl);
    }
    detail.redirectUrl = 'about:blank';

}, {
    urls: ["*://*.guangdiu.com/go.php?catch=1&id=*"]
}, ["responseHeaders"]);

function getUnionUrl(res) {
    if (res && res.length) {

        var count = 0;
        var items = [];

        var isDone = {};

        function end() {
            count--;

            if (count == 0) {
                postData(items);
                items.length = 0;
            }
        }
        res.forEach(function(r) {
            var id = r.id;
            var url = r.url;
            if (/^go.php/.test(url)) {
                url = '../' + url;
            }
            if (id && url && /^..\/go.php/.test(url)) {

                count++;

                url = 'http://guangdiu.com/go.php?catch=1&id=' + id;
                isDone[url] = 1;
                cusEvent.once(url, function(rurl) {
                    if (rurl && isDone[url]) {
                        delete isDone[url];
                        rurl = getUnionLink(rurl);
                        console.log(url, rurl);
                        items.push([id, rurl].join('$$$'));
                        end();
                    }
                });
                $.get(url, function(data) {
                    if (!isDone[url]) {
                        //保证执行一次
                        return;
                    }
                    /*
                    <script type='text/javascript'>var BgbdWfbx='https://c.duomai.com/track.php?t=https%3A%2F%2Fitem.jd.com%2F2848547.html&aid=61&site_id=94527&euid=n3362873';window.location.href=BgbdWfbx;</script>
                    <script type='text/javascript'>var KYlBdcWJ='https://c.duomai.com/track.php?t=http%3A%2F%2Fitem.jd.com%2F3865016.html&aid=61&site_id=94527&euid=n3451224';window.location.href=KYlBdcWJ;</script>
                     */
                    var d = /(http[s]?:\/\/.*)['"]/g.exec(data);
                    if (d && d[1]) {

                        var u = getUnionLink(d[1]);
                        if (u.length > 300 || /^http[s]?:\/\/www.w3.org/.test(u) || /['"]/.test(u)) {

                            end();
                            return;
                        }

                        items.push([id, u].join('$$$'));

                    } else {
                        console.log(url, data);
                    }
                    end();
                });
            }
        });

    }
}

function postData(data) {
    if (data && data.length) {
        $.post('http://zhufu.sinaapp.com/spider/spider/update_url.php', {
            urls: data.join(',,,')
        }, function(d) {
            console.log(d);
        })

    }
}

function getUnionLink(url) {
    if (/^http[s]?:\/\/count.chanet.com.cn\/click.cgi/.test(url) || /www.jdoqocy.com\/click/.test(url)) {
        var u = url.match(/url=(.*)(\&|$)/);
        if (u && u[1]) {
            return decodeURIComponent(u[1]);
        } else {
            return url;
        }
    } else if (/^http[s]?:\/\/www.linkhaitao.com\/index.php/.test(url)) {
        var u = url.match(/new=(.*)(\&|$)/);
        if (u && u[1]) {
            return decodeURIComponent(u[1]);
        } else {

            return url;
        }
    }

    var urlObj = parse_url(url);
    var ymxUrl = getAmzUrl(url, urlObj);
    var host = urlObj.host;
    var query = urlObj.search;
    if (ymxUrl) {
        return ymxUrl;
    }
    return url;
}

function getAmzUrl(url, urlObj) {
    urlObj = urlObj || parse_url(url);
    if (/guangdiu-23/.test(url) || /ygk-23/.test(url) || /gdiu-\d{2}/.test(url)) {
        url = url.replace('guangdiu-23', 'wuhawuha-23');
        url = url.replace('ygk-23', 'wuhawuha-23');
        url = url.replace('gudiu-21', 'wuhawuha-23');
        url = url.replace('gdiu-20', 'wuhawuha-23');
        url = url.replace('as_li_ss_tl', 's9_wsim_gw_p351_d81_i2_gs9w');
        return url;
    } else if (/(tag|t)=(\w+)\-\d+/.test(url)) {
        url = url.replace(/(tag|t)=(\w+)\-\d+/, '\1=wuhawuha-23');

        return url;
    } else {
        var host = urlObj.host;
        if (/amazon/.test(host)) {
            if (url.indexOf('?') !== -1) {
                return url + '&tag=wuhawuha-23'
            } else {
                return url + '?tag=wuhawuha-23';
            }

        }
    }
    return false;
}

var parse_url = function() {
    var a = document.createElement('a');

    return function(url) {
        a.href = url;
        return {
            host: a.host,
            hostname: a.hostname,
            pathname: a.pathname,
            port: a.port,
            protocol: a.protocol + '//',
            search: a.search,
            hash: a.hash
        };
    }
}();
//start
getEmptyItem();
