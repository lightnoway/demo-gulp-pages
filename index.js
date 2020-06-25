const path = require('path');
const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const bs = browserSync.create()

const config = require(path.join(process.cwd(), 'gulp.module.config.js'));
config.build = {
  paths: {
    src: path.resolve('src'),
    dist: path.resolve('dist'),
    temp: path.resolve('.temp'),
    page: '*.html',
    style: 'assets/styles/*.scss',
    script: 'assets/scripts/*.js',
    image: 'assets/images/**',
    font: 'assets/fonts/**',
    public: path.resolve('public')
  }
};
const { paths } = config.build;
['page', 'style', 'script', 'image', 'font'].forEach(key => {
  paths[key] = path.join(paths.src, paths[key]);
})

const clean = () => {
  return del([paths.dist, 'temp'])
}

const style = () => {
  return src(paths.style, { base: paths.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
}

const script = () => {
  return src(paths.script, { base: paths.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
}

const page = () => {
  return src(paths.page, { base: paths.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
}

const image = () => {
  return src(paths.image, { base: paths.src })
    .pipe(plugins.imagemin())
    .pipe(dest(paths.dist))
}

const font = () => {
  return src(paths.font, { base: paths.src })
    .pipe(plugins.imagemin())
    .pipe(dest(paths.dist))
}

const extra = () => {
  return src(paths.public, { base: paths.public })
    .pipe(dest(paths.dist))
}

const serve = (([style, script, page], tempPath) => () => {
  [style, script, page] = [style, script, page].map(fnStream => () => fnStream().dest(tempPath).pipe(bs.stream()))
  watch(paths.style, style)
  watch(paths.script, script)
  watch(paths.page, page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    paths.image,
    paths.font,
    path.join(paths.public, '**')
  ], async () => bs.reload())

  bs.init({
    notify: false,
    port: 2080,
    // open: false,
    // files: 'dist/**',
    server: {
      baseDir: [
        tempPath,//style,script,page
        'src',//image,font
        'public'
      ],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
})([style, script, page], paths.temp)

const useref = () => {
  return src(path.join(paths.temp, '*.html'), { base: paths.temp })
    .pipe(plugins.useref({ searchPath: [paths.temp, '.'] }))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(paths.dist))
}

const compile = (([style, script, page], tempPath) => {
  [style, script, page] = [style, script, page].map(fnStream => () => fnStream().pipe(dest(tempPath)))
  return parallel(style, script, page);
})([style, script, page], paths.temp)

// 上线之前执行的任务
const build = series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}


/**
 * 封装工作流
 * 新项目:
 * - 数据,配置
 * - 依赖模块
 * - cli
 * - 包发布
 */