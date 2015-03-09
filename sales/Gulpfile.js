var gulp = require('gulp');
var include = require('gulp-include');
var pkg = require('./package');
var plumber = require('gulp-plumber');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var rimraf = require('gulp-rimraf');
var gutil = require('gulp-util');

var gIf = require('gulp-if');
var ejs = require('gulp-ejs'),
    minifyHtml = require('gulp-minify-html');
var uglify = require('gulp-uglify'),
    compass = require('gulp-compass'),
    minifyCSS = require('gulp-minify-css');

//需要复制的目录和文件
var copyFiles = ['font/**', 'sound/**'];
//目录结构
var dest = './dest',
    src = './src';
var Dest = {
    css: 'css',
    img: 'img',
    js: 'js'
};
Object.keys(Dest).forEach(function(k) {
    Dest[k] = dest + '/' + Dest[k];
});
//source来源
var Path = {
    sass: 'sass/*.scss',
    css: 'css/*.css',
    img: 'img/**/*',
    js: ['**/*.js', '!**/_*.js'],
    html: '*.html'
};
Object.keys(Path).forEach(function(k) {
    if (Array.isArray(Path[k])) {
        Path[k].forEach(function(v, i) {
            Path[k][i] = src + '/' + Path[k][i];
        });
    }
});
//清理
gulp.task('clean', function() {
    return gulp.src(dest, {
            read: false
        })
        .pipe(plumber())
        .pipe(rimraf({
            force: true
        }));
});

//compass任务
gulp.task('sass', function() {

    return gulp.src(Path.sass)
        .pipe(plumber())
        .pipe(compass({
            config_file: src + '/compass.rb',
            sass: src + '/sass',
            css: dest + '/css'
        }))
        .pipe(gutil.env.type === 'prod' ? minifyCSS() : gutil.noop())
        .pipe(gulp.dest(Dest.css));
});
gulp.task('css', function() {
    return gulp.src(Path.css)
        .pipe(plumber())
        .pipe(gIf('!*.min.css', gutil.env.type === 'prod' ? minifyCSS() : gutil.noop()))
        .pipe(gulp.dest(Dest.css));
});

//ejs转成html
gulp.task('html', function() {
    return gulp.src(Path.html)
        .pipe(plumber())
        .pipe(ejs())
        .pipe(gutil.env.type === 'prod' ? minifyHtml() : gutil.noop())
        .pipe(gulp.dest(dest));
});
//js压缩和include任务
gulp.task('js', function() {
    return gulp.src(Path.js)
        .pipe(plumber())
        .pipe(include())
        .pipe(gIf('!*.min.js', gutil.env.type === 'prod' ? uglify() : gutil.noop()))
        .pipe(gulp.dest(dest));
});

//img
gulp.task('img', function() {
    return gulp.src(Path.img)
        .pipe(plumber())
        // .pipe(imagemin())
        .pipe(gulp.dest(Dest.img));
});
//打包
gulp.task('zip', function() {
    return gulp.src(dest + '/*.*')
        .pipe(plumber())
        .pipe(zip('aio.zip'))
        .pipe(gulp.dest('.'));
});

//default
gulp.task('default', ['sass', 'css', 'js', 'html'], function() {
    copyFiles.forEach(function(v) {
        if (v) {
            gulp.src(src + '/' + v)
                .pipe(gulp.dest(dest + '/' + v.replace('/**', '')));
        }
    });
    gulp.src(['manifest.json'].map(function(v) {
            return src + '/' + v;
        }))
        .pipe(replace('<%=version%>', pkg.version))
        .pipe(gulp.dest(dest));

});
gulp.task('build', ['clean', 'default', 'zip']);
//gulp build --type prod

//watcher
gulp.task('watch', function() {

    ['css', 'js', 'sass', 'html'].forEach(function(v) {
        if (Path[v]) {
            var watcher = gulp.watch(Path[v], [v]);
            watcher.on('change', function(event) {
                console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
            });
        }
    });
    gulp.watch(src + '/tpl/**', ['html'])

});
