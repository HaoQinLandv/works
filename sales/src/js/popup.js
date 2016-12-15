//= include _tpl.js
//= include _config.js
var API = {
  list: APIURL + '/getdata.php?v=' + VERSION + '&page=',
  maxid: APIURL + '/getmaxid.php?v=' + VERSION
};
var emptyFn = function() {};
var FIRST = true;
$(function() {

  var Template = $('#J-template').html();
  var $content = $('#J-content');
  var $loadmore = $('#J-loadmore');
  $('#J-loadBtn').click(function() {
    $loadmore.hide();
    $loading.show();
    $.getJSON(API.list + PAGE).done(append);
  });
  var $loading = $('#J-loading');

  var PAGE = 1;

  $('#J-close').click(function() {
    window.close();
  });
  $('#J-refresh').click(function() {
    refresh();
    return false;
  });


  function refresh() {
    PAGE = 1;
    $content.empty();
    $loadmore.hide();
    $loading.show();
    $.getJSON(API.list + PAGE).done(append);
  }
  $content.delegate('button.buy', 'click', function() {
    chrome.tabs.create({
      url: $(this).data('link'),
      selected: false
    });
  }).delegate('p.J-desc', 'click', function() {
    $(this).find('.J-more').toggle();
  }).delegate('p.J-desc a', 'click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var link = $(this).attr('href');
    chrome.tabs.create({
      url: link,
      selected: false
    });
  }).delegate('span.J-qrcode', 'click', function() {
    var $t = $(this);
    var link = $t.data('url');
    var title = $t.data('title');
    chrome.tabs.create({
      url: './qrcode.html?url=' + encodeURIComponent(link) + '&title=' + encodeURIComponent(title),
      selected: false
    });
  });

  function append(json, source) {

    if (json.errno === 0) {
      var now = +new Date();
      PAGE++;
      var html = '';
      // console.log(json.data);
      json.data.forEach(function(v) {
        var detail = v.detail;
        var thtml = trimHtml(detail, {limit: 80, suffix: ''});
        v.detail = thtml.html;

        v.more = thtml.more;
        v.mallname = (v.mallname || '').slice(0, 10);
        if (!v.more) {
          v.more = '';
        }
        html += TPL(Template, v);
      });
      $content.append(html);

      if (FIRST && json.maxid) {
        FIRST = false;
        localStorage.maxCnDealId = json.maxid;
        chrome.browserAction.setBadgeBackgroundColor({
          color: [255, 68, 68, 255]
        });
        chrome.browserAction.setBadgeText({
          text: ''
        });
        chrome.browserAction.setTitle({
          title: '里面条目您都看过了，等有更新了我立马儿通知您！'
        });
        if (json.todayTotal) {
          var total = localStorage.todayTotal = json.todayTotal;
          $('#J-total').show().find('.J-text').text(total);
        }
      }
      if (source !== 'from cache') {
        try {
          json.expire = now + 60 * 60 * 2000; //两分钟过期
          sessionStorage.newData = JSON.stringify(json);
        } catch (e) {}
      }
    }
    $loading.hide();
    $loadmore.show();
  }
  $('[data-toggle="tooltip"]').tooltip();
  //绑定开关事件
  $('input[data-lsid="openNotice"]').attr('checked', !settings.openNotice);
  $('.J-switch').change(function() {
    var st = settings;
    var $t = $(this);
    var lsid = $t.data('lsid');
    st[lsid] = !this.checked;
    ls.settings = JSON.stringify(st);
    chrome.runtime.sendMessage({
      action: 'updateSwitch',
      id: lsid,
      from: 'popup',
      value: !this.checked
    }, function() {});
  }).each(function(i, v) {
    new Switchery(v, {
      size: 'small',
      color: '#2d89f0'
    });
  });

  try {
    var data = sessionStorage.newData;
    data = JSON.parse(data);
    var now = +new Date();
    if (now < data.expire) {
      append(data, 'from cache');
    }
  } catch (e) {
    setTimeout(function() {
      $.getJSON(API.list + PAGE).done(append);
    }, 50);
  }
});

function trimHtml(html, options) {

    options = options || {};

    var limit = options.limit || 100,
        wordBreak = (typeof options.wordBreak !== 'undefined') ? options.wordBreak : false,
        suffix = options.suffix || '';

    var arr = html.replace(/</g, "\n<")
        .replace(/>/g, ">\n")
        .replace(/\n\n/g, "\n")
        .replace(/^\n/g, "")
        .replace(/\n$/g, "")
        .split("\n");

    var sum = 0,
        row, cut, add,
        tagMatch,
        tagName,
        tagStack = [],
        more = [];

    for (var i = 0; i < arr.length; i++) {

        row = arr[i];
        // count multiple spaces as one character
        rowCut = row.replace(/[ ]+/g, ' ');

        if (!row.length) {
            continue;
        }

        if (row[0] !== "<") {

            if (sum >= limit) {
                row = "";
                more.push(arr[i]);
            } else if ((sum + rowCut.length) >= limit) {

                cut = limit - sum;

                if (row[cut - 1] === ' ') {
                    while (cut) {
                        cut -= 1;
                        if (row[cut - 1] !== ' ') {
                            break;
                        }
                    }
                } else {

                    add = row.substring(cut).split('').indexOf(' ');

                    // break on halh of word
                    if (!wordBreak) {
                        if (add !== -1) {
                            cut += add;
                        } else {
                            cut = row.length;
                        }
                    }
                }

                row = row.substring(0, cut) + suffix;
                sum = limit;
                more.push(row.slice(cut + suffix.length));

            } else {
                sum += rowCut.length;
            }

        } else if (sum >= limit) {
            tagMatch = row.match(/[a-zA-Z]+/);

            tagName = tagMatch ? tagMatch[0] : '';

            if (tagName) {
                if (row.substring(0, 2) !== '</') {

                    tagStack.push(tagName);
                    row = '';
                    more.push(arr[i]);
                } else {

                    while (tagStack[tagStack.length - 1] !== tagName && tagStack.length) {
                        tagStack.pop();
                    }

                    if (tagStack.length) {
                        row = '';
                    more.push(arr[i]);

                    }

                    tagStack.pop();
                }
            } else {
                row = '';
                more.push(arr[i]);

            }
        }

        arr[i] = row;
    }

    return {
        html: arr.join("\n").replace(/\n/g, ""),
        more: more.join("\n").replace(/\n/g, "")
    };
}

//= include _tpl.js


chrome.runtime.sendMessage({
  action: 'startFeedTimer'
}, emptyFn);
