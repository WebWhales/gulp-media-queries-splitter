const gulp = require('gulp');
const mediaQueriesSplitter = require('../index');

gulp.task('test', function () {
    gulp.src('./input/*.css')
        .pipe(mediaQueriesSplitter([
            // Include all CSS rules
            {media: 'all', filename: 'all.css'},

            // Include only CSS rules without screen size based media queries
            {media: 'none', filename: 'base.css'},

            // Include CSS rules for small screen sizes and CSS rules without screen size based media queries
            {media: ['none', {minUntil: '576px'}, {max: '9999999px'}], filename: 'main.css'},

            // Include CSS rules for medium screen sizes (mostly used on tablet)
            {media: [{min: '576px', minUntil: '768px'}, {min: '576px', max: '768px'}], filename: 'tablet.css'},

            // Include CSS rules for bigger screen sizes (mostly used on desktop)
            {media: {min: '768px'}, filename: 'desktop.css'},
        ]))
        .pipe(gulp.dest('./output'))
});

gulp.task('default', ['test']);