function TPL(html, data) {
    for (var i in data) {
        html = html.replace(new RegExp('{{\\s*' + i + '\\s*}}', 'g'), data[i]);
    }
    return html;
}
