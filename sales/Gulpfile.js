var gulp = require('gulp');
var include = require('gulp-include');
var pkg = require('./package');
var plumber = require('gulp-plumber');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var rimraf = require('gulp-rimraf');
var gutil = require('gulp-util');
var filter = require('gulp-filter');
var ejs = require('gulp-ejs'),
    minifyHtml = require('gulp-minify-html');
var uglify = require('gulp-uglify'),
    compass = require('gulp-compass'),
    minifyCSS = require('gulp-minify-css');
var imagemin = require('gulp-imagemin'),
    pngcrush = require('imagemin-pngcrush');

var jsFilter = filter(function(file) {
        return !/_.*\.js$/.test(file.path);
    }),
    uglifyFilter = filter(function(file) {
        return !/\.min\.js$/.test(file.path);
    }),
    cssFilter = filter(function(file) {
        return !/\.min\.css$/.test(file.path);
    });
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
//
var Path = {
    sass: 'sass/*.scss',
    css: 'css/*.css',
    img: 'img/**/*',
    js: '**/*.js',
    html: '*.html'
};
Object.keys(Path).forEach(function(k) {
    Path[k] = src + '/' + Path[k];
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

//compass
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
        .pipe(cssFilter)
        .pipe(gutil.env.type === 'prod' ? minifyCSS() : gutil.noop())
        .pipe(cssFilter.restore())
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

gulp.task('js', function() {
    return gulp.src(Path.js)
        .pipe(plumber())
        .pipe(jsFilter)
        .pipe(include())
        .pipe(uglifyFilter)
        .pipe(gutil.env.type === 'prod' ? uglify() : gutil.noop())
        .pipe(uglifyFilter.restore())
        .pipe(gulp.dest(dest));
});

gulp.task('img', function() {
    return gulp.src(Path.img)
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(Dest.img));
});

gulp.task('zip', function() {
    return gulp.src(dest + '/*.*')
        .pipe(plumber())
        .pipe(zip('aio.zip'))
        .pipe(gulp.dest('.'));
});

//default
gulp.task('default', ['sass', 'css', 'js', 'html', 'img'], function() {
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

    ['css', 'js', 'img', 'sass', 'html'].forEach(function(v) {
        if (Path[v]) {
            gulp.watch(Path[v], [v]);
        }
    });
    gulp.watch(src + '/tpl/**', ['html'])

});
