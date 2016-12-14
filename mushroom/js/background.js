var INTERVAL = 3 * 60 * 1000;
var EVERY_NUM = 50;
var TIMER = setInterval(getNews, INTERVAL);

sessionStorage.unique = '';

//一小时清理一次
setInterval(function() {
    sessionStorage.unique = '';
}, INTERVAL * 12);

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




function getNews() {
    $.getJSON('http://guangdiu.com/api/getlist.php?count=10', function(data) {
        dealList(data.data);
    });
    $.getJSON('http://guangdiu.com/api/getlist.php?count=10&country=us', function(data) {
        dealList(data.data, 1);
    });
}

function dealList(data, isus) {
    if (!data) {
        return;
    }
    isus = isus || 0;
    var uni = sessionStorage.unique;

    var count = data.length;

    data.forEach(function(d) {
        if (uni.indexOf(d.id) === -1) {
            var id = d.id;
            sessionStorage.unique += '_' + id;
            var detail_url = 'http://guangdiu.com/api/showdetail.php?id=' + id;
            var go_url = 'http://guangdiu.com/go.php?catch=1&id=' + id;
            $.when(p_detail(detail_url), p_url(go_url)).done(function(detail, url) {
                d.detail = detail;
                d.url = go_url === url ? d.buyurl : url;
                end();
            });
        }
    });

    function end() {
        count--;
        if (count === 0) {
            // console.log(data, isus);
            $.post('http://zhufu.sinaapp.com/spider/spider/update_items_chr.php?debug=1', {
                data: JSON.stringify(data),
                isus: isus
            }, function(d) {
                console.log(d);
            });
        }
    }
}

function p_detail(url) {
    var d = $.Deferred();

    $.get(url, function(data) {
        var $node = $(data);
        var $abs = $node.find('#mdabstract');
        $abs.find('.m99adhead,.m99adfoot,.cheapitem').remove();
        var t = $abs.find('dt').html();
        t = t ? t.trim() : '';
        var text = $abs.find('p').text().trim();
        if (!text) {
            $abs.find('dt').remove();
            text = $abs.text().trim();
        }
        d.resolve(t + text);
    });

    return d;
}
var isDone = {};

function p_url(url) {
    var d = $.Deferred();
    isDone[url] = 1;

    var urls = parse_url(url);
    if ($.inArray(urls.host, ['detail.tmall.com']) !== -1) {
        end(url);
    } else {
        cusEvent.once(url, function(rurl) {
            if (rurl && isDone[url]) {
                rurl = getUnionLink(rurl);
                end(rurl);
            }
        });
        $.get(url, function(data) {
            if (!isDone[url]) {
                //保证执行一次
                return;
            }
            var d = /(http[s]?:\/\/.*)['"]/g.exec(data);
            if (d && d[1]) {

                var u = getUnionLink(d[1]);
                if (u.length > 300 || /^http[s]?:\/\/www.w3.org/.test(u) || /['"]/.test(u)) {

                } else {
                    url = u;
                }
            }
            end(url);
        });
    }

    function end(url) {
        delete isDone[url];
        d.resolve(url);
    }

    return d;
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
