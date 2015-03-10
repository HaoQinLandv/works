function TPL(html, data) {
    for (var i in data) {
        html = html.replace(new RegExp('{{\\s*' + i + '\\s*}}', 'g'), data[i]);
    }
    return html;
}

function urlQuery() {
    if (location.search) {
        var q = decodeURIComponent(location.search.substr(1));
        var obj = {};
        q.split('&').forEach(function(v) {
            var t = v.split('=');
            obj[t[0]] = t[1];
        });
        return obj;
    }
    return {};
}
