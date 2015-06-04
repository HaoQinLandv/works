(function(window, $){
    var $list = $('#banner');
    var len = $list.find('.banner').length;
    var index = 0, timeout = 3e3;;
    var timer = setTimeout(autoplay, timeout);

    function autoplay(){
        if(++index===len){
            index = 0;
        }
        $list.find('.banner').eq(index).animate({opacity: 1}, 600, function(){
            $(this).addClass('active').css({zIndex:1})
        });
        $list.find('.active').animate({opacity:0}, 600, function(){
            $(this).removeClass('active').css({zIndex:0})
        })
        timer = setTimeout(autoplay, timeout);
    }
    $('.J-install').click(function(){
        try{
            chrome.webstore.install('https://chrome.google.com/webstore/detail/fencnigkojiegaifcngopoenckcgbcoo', function(){
                alert('恭喜您，已经安装成功！');
            }, function(){
                alert('安装失败。。。\n可能当前网络不能访问chrome网站\n请按照下面的帮助重新安装');
            });
        }catch(e){
            console.log(e);
            location.href = 'http://zhufu.sinaapp.com/api/chrome-shopping.zip';
        }
    });
}(window,jQuery));
