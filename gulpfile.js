// Gulp File for ExDoc
// ===================

// Dependencies
// ------------

var gulp = require('gulp')
var $ = require('gulp-load-plugins')({camelize: true})
var sequence = require('run-sequence')
var clean = require('gulp-clean')
var LessPluginNpmImport = require('less-plugin-npm-import')
var LessPluginAutoPrefix = require('less-plugin-autoprefix')
var Server = require('karma').Server

var config = require('./assets/webpack.config')

// Config
// ------

// Set variable via $ gulp --type production
var environment = $.util.env.type || 'development'
var isProduction = environment === 'production'

var distPath = 'lib/ex_doc/formatter/html/templates/dist'

var npmPlugin = new LessPluginNpmImport()
var autoprefixPlugin = new LessPluginAutoPrefix({
  browsers: ['last 2 versions']
})

// Tasks
// -----

gulp.task('clean', function () {
  return gulp.src(distPath, {read: false})
    .pipe(clean())
})

gulp.task('javascript', function () {
  return gulp.src('assets/js/app.js')
    .pipe($.webpack(isProduction ? config.production : config.development))
    .pipe($.if(isProduction, $.uglify()))
    .pipe($.size({title: 'js'}))
    .pipe(gulp.dest(distPath))
})

gulp.task('javascript-watch', function () {
  config.development.watch = true

  return gulp.src('assets/js/app.js')
    .pipe($.plumber())
    .pipe($.webpack(config.development))
    .pipe($.size({title: 'js'}))
    .pipe(gulp.dest(distPath))
})

gulp.task('less', function () {
  return gulp.src('assets/less/app.less')
    .pipe($.less({
      plugins: [
        npmPlugin,
        autoprefixPlugin
      ]
    }))
    .pipe($.plumber())
    .pipe($.if(isProduction, $.minifyCss({compatibility: 'ie8'})))
    .pipe($.size({title: 'less'}))
    .pipe(gulp.dest(distPath))
})

gulp.task('less-watch', function () {
  $.watch('assets/less/**/*.less', $.batch(function (events, done) {
    gulp.start('less', done)
  }))
})

gulp.task('lint', function () {
  return gulp.src([
    'gulpfile.js',
    'assets/**/*.js'
  ])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError())
})

gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/assets/karma.conf.js',
    singleRun: true
  }, done).start()
})

gulp.task('build', function (done) {
  sequence(
    'clean',
    ['javascript', 'less'],
    done
  )
})

gulp.task('development', function (done) {
  sequence(
    ['javascript-watch', 'less-watch'],
    done
  )
})

gulp.task('default', ['lint', 'test'])
