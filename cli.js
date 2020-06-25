#!/usr/bin/env node

const path = require('path');
const gulpPath = path.join(__dirname, './index.js');
/** 代理 gulp-cli */
// require('gulp-cli')();//require 执向main
//gulp-cli 中 cli文件做的事: main()

process.argv.push('--gulpfile');
process.argv.push(gulpPath);
process.argv.push('--cwd');
process.argv.push(process.cwd());

// console.log('cli cwd', process.cwd(), gulpPath);
/*
另一种做法,知道得少一些
*/
require('gulp-cli/bin/gulp.js');//只需要知道 package里bin的路径,不需要知道怎么实现pwd