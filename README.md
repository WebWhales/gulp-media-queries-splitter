# gulp-media-queries-splitter

> Split CSS files into several CSS files based on media queries

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-media-queries-splitter`

## Options

`gulp-media-queries-splitter` takes an array of configuration objects to generate the new CSS files with. You can provide multiple configuration objects, each using the following options:

- `media` (required) — possible values are:
   - `all` — to include all CSS rules regardless of the media query;
   - `none` — to include all CSS rules that do not belong to a media query, or that belong to a media query without `min-width` or `max-width` declarations;
   - an object containing the following options:
       - `min` (optional, default: `0`) — defines the `min-width` value of a media query to include CSS rules from;
       - `minUntil` (optional) — defines the maximum value for the `min-width` value of a media query to include CSS rules from; 
       - `max` (optional) — defines the `max-width` value of a media query to include CSS rules from.
   - an array containing the previous possible values (either `all`, `none` or an object). 
- `filename` (required) — the destination filename to put the CSS rules in that matches the configuration in the `media` option.

## Usage

```javascript
const gulp = require('gulp');
const mediaQueriesSplitter = require('gulp-media-queries-splitter');

gulp.task('split-css', function () {
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
```

## Errors

`gulp-media-queries-splitter` emits an 'error' event if a source file is being loaded using a stream.