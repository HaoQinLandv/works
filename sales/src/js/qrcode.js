(function(window, $) {
  //= include _tpl.js
  //= include _config.js
  var url = location.search.slice(1);
  if (url) {
    var query = urlQuery(url);
    url = query.url;
    var title = query.title;
    $(document).ready(function() {
      $('#J-qrcode').empty().qrcode({
        text: url,
        width: 400,
        height: 400
      });
      $('#J-qrtitle').html(title || '');
    });
  }



}(window, jQuery));
