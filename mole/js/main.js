(function(window, document) {

    var $canvas, $timer = $('J-timer'),
        $progress = $('J-progress'),
        stage,
        lastWidth = 100,
        lastSecond = 30,
        width = 300,
        height = 300,
        duration = 30e3;
    var holes = [
        [50, 50],
        [150, 50],
        [250, 50],
        [50, 150],
        [150, 150],
        [250, 150],
        [50, 250],
        [150, 250],
        [250, 250]
    ];

    function $(id) {
        return document.getElementById(id);
    }

    function init() {
        $canvas = $('c');
        $canvas.width = width;
        $canvas.height = height;
        stage = new Stage('c', width, height);
        stage.on('update', timer);
        start();
    }

    function start() {
        var data = holes[stage.random(0, holes.length)];

        var cake = new Cake(data[0], data[1]);

        stage.addSprite(cake);
        stage.play();
        update();
    }

    function replay() {
        lastWidth = 100;
        lastSecond = 30;
    }
    //更新进度条和时间轴
    function timer() {
        var w = Math.ceil((1 - (stage.duration / duration)) * 100);
        var s = Math.ceil((duration - stage.duration) / 1000);
        if (lastWidth !== w && w >= 0) {
            lastWidth = w;
            $progress.style.width = w + '%';
        }
        if (lastSecond !== s && s >= 0) {
            lastSecond = s;
            $timer.innerHTML = s;
        }
    }
    //update
    function update() {
        if (stage.duration > duration) {
            stage.stop();
            console.log(stage.score);
            return;
        }
        requestAnimationFrame(update);
        stage.update();
    }

    window.onload = init;

}(window, document));
