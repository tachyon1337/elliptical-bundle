

var gulp=require('gulp');

gulp.task('default',function(){
    console.log('echo elliptical bundle');
});

gulp.task('build',function(){
    copyScripts();
});

function copyScripts(){
    gulp.src('./lib/*.js')
        .pipe(gulp.dest('./dist/scripts/'));
}