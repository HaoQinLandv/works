(function(window, document){
    var $canvas;
    function $(id){
        return document.getElementById(id);
    }
    function init(){
        $canvas = $('c');
        $canvas.width = 320;
        $canvas.height = 400;
        var stage = new Stage('c', $canvas.width, $canvas.height);
    }


    window.onload = init;

}(window, document));
