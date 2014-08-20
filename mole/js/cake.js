var Cake = function(x, y) {
    this.x = x;
    this.y = y;
    this.duration = 0;
    this.init('enter');
};
var img = new Image();
img.src = './img/sprite.png';
Cake.prototype = new Sprite('cake', {
    img: img,
    width: 82,
    height: 83,
    curAnimate: 'enter',
    frames: {
        enter: {
            fps: 100,
            times: 1,
            data: [
                [0, 0, 163, 165, 8, 8],
                [0, 0, 163, 165, 16, 16],
                [0, 0, 163, 165, 26, 26],
                [0, 0, 163, 165, 38, 38],
                [0, 0, 163, 165, 52, 52],
                [0, 0, 163, 165, 68, 68],
                [0, 0, 163, 165, 86, 86],
                [0, 0, 163, 165, 106, 106],
                [0, 0, 163, 165, 106, 106],
                [0, 0, 163, 165, 106, 106],
                [0, 0, 163, 165, 82, 83]
            ]
        },
        normal: {
            fps: 3,
            times: 0,
            data: [
                [0, 0, 163, 165, 82, 83],
                [0, 175, 163, 165, 82, 83]
            ]
        },
        touch: {
            fps: 3,
            times: 1,
            data: [
                [77, 1, 99, 88]
            ]
        }
    }
});

Cake.prototype.constructor = Cake;
Cake.prototype.evtClick = function(e, stage) {
    if (this.curAnimate === 'enter' || this.status === 'clicked') {
        return false;
    }
    var x = e.x,
        y = e.y;

    var x0 = this.x + this.dx;
    var y0 = this.y + this.dy;
    var x1 = this.x - this.dx;
    var y1 = this.y - this.dy;

    // console.log(x, y, x0, x1, y0, y1);
    if (x > x0 && x < x1 && y > y0 && y < y1) {
        this.status = 'clicked';
        this.clickTime = Date.now();
        this.setAni('touch');
        // 分数加倍
        stage.addScore(stage.hits);
        return true;
    }
    return false;
};
Cake.prototype.nextAni = function() {
    if (this.curAnimate === 'enter') {
        this.setAni('normal');
        return true;
    }
    return false;
};
