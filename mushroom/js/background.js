var INTERVAL = 3*60*1000;
var EVERY_NUM = 50;
var TIMER = setInterval(getEmptyItem, INTERVAL);


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

function getUnionUrl(res) {
    if (res && res.length) {

        var count = 0;
        var items = [];
        res.forEach(function(r) {
            var id = r.id;
            var url = r.url;
            if (id && url && /^..\/go.php/.test(url)) {

                count++;

                url = 'http://guangdiu.com/go.php?id=' + id;
                $.get(url, function(data) {
                    /*
                    <script type='text/javascript'>var BgbdWfbx='https://c.duomai.com/track.php?t=https%3A%2F%2Fitem.jd.com%2F2848547.html&aid=61&site_id=94527&euid=n3362873';window.location.href=BgbdWfbx;</script>
                     */
                    var d = /(http[s]:\/\/.*)['"]/g.exec(data);
                    if (d && d[1]) {
                        var u = d[1];
                        count--;
                        items.push([id, u].join('$$$'));
                        if (count == 0) {
                            postData(items);
                            items.length = 0;
                        }
                    }else{
                      console.log(data);
                    }
                });
            }
        });

    }
}

function postData(data) {
    if (data && data.length) {
        $.post('http://zhufu.sinaapp.com/spider/spider/update_url.php?debug=1', {
            urls: data.join(',,,')
        }, function(d) {
            console.log(d);
        })

    }
}

//start
getEmptyItem();
