'use strict';

const parse = require('css-parse');
const gutil = require('gulp-util');
const PluginError = require('plugin-error');
const stringify = require('css-stringify');
const transform = require('stream').Transform;

const mediaQueriesSplitter = {
    /**
     * @param {array} rules
     * @param {int} currentIndex
     * @returns {boolean|object}
     */
    findNextNonCommentStylesheetRule: (rules, currentIndex) => {
        let nextRule = false;

        while (typeof rules[++currentIndex] !== 'undefined') {
            if (rules[currentIndex].type !== 'comment') {
                nextRule = rules[currentIndex];

                break;
            }
        }

        return nextRule;
    },

    handle: (options) => {
        let outputFiles = [],
            stream = new transform({objectMode: true});

        options = Object.assign(options || {});

        stream._transform = (file, enc, cb) => {
            if (!file || !file.contents) {
                return cb(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new PluginError('gulp-media-queries-splitter', 'Streaming not supported!'));
                return cb(null, file);
            }

            let contents = file.contents ? file.contents.toString(enc) : '',
                rules = parse(contents).stylesheet.rules,
                usingSourceMap = file.sourceMap ? JSON.parse(JSON.stringify(file.sourceMap)) : false;

            rules.forEach((rule, ruleIndex) => {
                let _rule = rule;

                // Check whether the current rule is a comment, keep it with the next non-comment rule (if there is any)
                if (rule.type === 'comment') {
                    _rule = mediaQueriesSplitter.findNextNonCommentStylesheetRule(rules, ruleIndex);

                    if (!_rule) {
                        _rule = rule;
                    }
                }

                // Only add the rule to the list if it's a @media rule, and if it's the matching rule. Or, add it if no specific media query was specified
                if (!Array.isArray(options)) {
                    options = [options];
                }

                options.forEach((option) => {
                    if (!option.media || !option.filename) {
                        return;
                    }

                    if (!Array.isArray(option.media)) {
                        option.media = [option.media];
                    }

                    option.media.forEach((optionMedia) => {
                        let outputFile = '',
                            isMediaWidthRule = false,
                            ruleMediaMin = null,
                            ruleMediaMax = null;

                        if (_rule.type === 'media' && _rule.media) {
                            ruleMediaMin = _rule.media.match(/\(min-width:\s*([0-9]+)px\)/);
                            ruleMediaMax = _rule.media.match(/\(max-width:\s*([0-9]+)px\)/);

                            if ((ruleMediaMin && ruleMediaMin[1]) || (ruleMediaMax && ruleMediaMax[1])) {
                                isMediaWidthRule = true;
                            }
                        }

                        if (typeof optionMedia === 'string') {
                            if (optionMedia === 'all' || (optionMedia === 'none' && !isMediaWidthRule)) {
                                outputFile = option.filename;
                            }
                        } else if (typeof optionMedia === 'object' && isMediaWidthRule) {
                            let optionMediaMin = optionMedia.min ? parseInt(optionMedia.min, 10) : 0,
                                optionMediaMinUntil = optionMedia.minUntil ? parseInt(optionMedia.minUntil, 10) : 0,
                                optionMediaMax = optionMedia.max ? parseInt(optionMedia.max, 10) : 0;

                            try {
                                if (optionMediaMin && optionMediaMax) {
                                    if (ruleMediaMin[1] && ruleMediaMin[1] >= optionMediaMin && (!optionMediaMinUntil || ruleMediaMin[1] < optionMediaMinUntil) && ruleMediaMax[1] && ruleMediaMax[1] < optionMediaMax) {
                                        outputFile = option.filename;
                                    }
                                } else if (optionMediaMin && !ruleMediaMax) {
                                    if (ruleMediaMin[1] && ruleMediaMin[1] >= optionMediaMin && (!optionMediaMinUntil || ruleMediaMin[1] < optionMediaMinUntil)) {
                                        outputFile = option.filename;
                                    }
                                } else if (optionMediaMax && !ruleMediaMin) {
                                    if (ruleMediaMax[1] && ruleMediaMax[1] < optionMediaMax) {
                                        outputFile = option.filename;
                                    }
                                }
                            } catch (error) {
                            }
                        }

                        if (outputFile) {
                            if (typeof outputFiles[outputFile] === 'undefined') {
                                outputFiles[outputFile] = [];
                            }

                            outputFiles[outputFile].push(rule);
                        }
                    });
                });
            });

            for (let filename in outputFiles) {
                stream.push(new gutil.File({
                    cwd: '',
                    base: '',
                    path: filename,
                    // Turn the CSS rule tree back into a proper stylesheet
                    contents: new Buffer(stringify({
                        type: 'stylesheet',
                        stylesheet: {rules: outputFiles[filename]}
                    }))
                }));
            }

            cb();
        };

        return stream;
    }
};

module.exports = mediaQueriesSplitter.handle;