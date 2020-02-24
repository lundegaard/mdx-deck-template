'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var mdxDeck = require('mdx-deck');
var core = require('@emotion/core');

function Diff() {}
Diff.prototype = {
  diff: function diff(oldString, newString) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var callback = options.callback;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    this.options = options;
    var self = this;

    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    } // Allow subclasses to massage the input prior to running


    oldString = this.castInput(oldString);
    newString = this.castInput(newString);
    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));
    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{
      newPos: -1,
      components: []
    }]; // Seed editLength = 0, i.e. the content starts with the same values

    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return done([{
        value: this.join(newString),
        count: newString.length
      }]);
    } // Main worker method. checks all permutations of a given edit length for acceptance.


    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = void 0;

        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        } // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph


        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list

          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }

        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
    } // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.


    if (callback) {
      (function exec() {
        setTimeout(function () {
          // This should not happen, but we want to be safe.

          /* istanbul ignore next */
          if (editLength > maxEditLength) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();

        if (ret) {
          return ret;
        }
      }
    }
  },
  pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];

    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = {
        count: last.count + 1,
        added: added,
        removed: removed
      };
    } else {
      components.push({
        count: 1,
        added: added,
        removed: removed
      });
    }
  },
  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;

    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({
        count: commonCount
      });
    }

    basePath.newPos = newPos;
    return oldPos;
  },
  equals: function equals(left, right) {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  },
  removeEmpty: function removeEmpty(array) {
    var ret = [];

    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }

    return ret;
  },
  castInput: function castInput(value) {
    return value;
  },
  tokenize: function tokenize(value) {
    return value.split('');
  },
  join: function join(chars) {
    return chars.join('');
  }
};

function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];

    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });
        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }

      newPos += component.count; // Common case

      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.

      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  } // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.


  var lastComponent = components[componentLen - 1];

  if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path) {
  return {
    newPos: path.newPos,
    components: path.components.slice(0)
  };
}

//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF

var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
var reWhitespace = /\S/;
var wordDiff = new Diff();

wordDiff.equals = function (left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }

  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};

wordDiff.tokenize = function (value) {
  var tokens = value.split(/(\s+|[()[\]{}'"]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

var lineDiff = new Diff();

lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  } // Merge the content and line separators into single tokens


  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }

      retLines.push(line);
    }
  }

  return retLines;
};

function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}

var sentenceDiff = new Diff();

sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

var cssDiff = new Diff();

cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

var objectPrototypeToString = Object.prototype.toString;
var jsonDiff = new Diff(); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;

jsonDiff.castInput = function (value) {
  var _this$options = this.options,
      undefinedReplacement = _this$options.undefinedReplacement,
      _this$options$stringi = _this$options.stringifyReplacer,
      stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
    return typeof v === 'undefined' ? undefinedReplacement : v;
  } : _this$options$stringi;
  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
};

jsonDiff.equals = function (left, right) {
  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
};
// object that is already on the "stack" of items being processed. Accepts an optional replacer

function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  if (replacer) {
    obj = replacer(key, obj);
  }

  var i;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  var canonicalizedObj;

  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);

    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
    }

    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if (_typeof(obj) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);

    var sortedKeys = [],
        _key;

    for (_key in obj) {
      /* istanbul ignore else */
      if (obj.hasOwnProperty(_key)) {
        sortedKeys.push(_key);
      }
    }

    sortedKeys.sort();

    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
    }

    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }

  return canonicalizedObj;
}

var arrayDiff = new Diff();

arrayDiff.tokenize = function (value) {
  return value.slice();
};

arrayDiff.join = arrayDiff.removeEmpty = function (value) {
  return value;
};

function parsePatch(uniDiff) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      list = [],
      i = 0;

  function parseIndex() {
    var index = {};
    list.push(index); // Parse diff metadata

    while (i < diffstr.length) {
      var line = diffstr[i]; // File header found, end parsing diff metadata

      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      } // Diff index


      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);

      if (header) {
        index.index = header[1];
      }

      i++;
    } // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header


    parseFileHeader(index);
    parseFileHeader(index); // Parse hunks

    index.hunks = [];

    while (i < diffstr.length) {
      var _line = diffstr[i];

      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        // Ignore unexpected content unless in strict mode
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  } // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.


  function parseFileHeader(index) {
    var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);

    if (fileHeader) {
      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
      var data = fileHeader[2].split('\t', 2);
      var fileName = data[0].replace(/\\\\/g, '\\');

      if (/^".*"$/.test(fileName)) {
        fileName = fileName.substr(1, fileName.length - 2);
      }

      index[keyPrefix + 'FileName'] = fileName;
      index[keyPrefix + 'Header'] = (data[1] || '').trim();
      i++;
    }
  } // Parses a hunk
  // This assumes that we are at the start of a hunk.


  function parseHunk() {
    var chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: +chunkHeader[2] || 1,
      newStart: +chunkHeader[3],
      newLines: +chunkHeader[4] || 1,
      lines: [],
      linedelimiters: []
    };
    var addCount = 0,
        removeCount = 0;

    for (; i < diffstr.length; i++) {
      // Lines starting with '---' could be mistaken for the "remove line" operation
      // But they could be the header for the next file. Therefore prune such cases out.
      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
        break;
      }

      var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? ' ' : diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || '\n');

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    } // Handle the empty block count case


    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }

    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    } // Perform optional sanity checking


    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }

      if (removeCount !== hunk.oldLines) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}

// Iterator that traverses in the range of [min, max], stepping
// by distance from a given start position. I.e. for [0, 4], with
// start of 2, this will iterate 2, 3, 1, 4, 0.
function distanceIterator (start, minLine, maxLine) {
  var wantForward = true,
      backwardExhausted = false,
      forwardExhausted = false,
      localOffset = 1;
  return function iterator() {
    if (wantForward && !forwardExhausted) {
      if (backwardExhausted) {
        localOffset++;
      } else {
        wantForward = false;
      } // Check if trying to fit beyond text length, and if not, check it fits
      // after offset location (or desired location on first iteration)


      if (start + localOffset <= maxLine) {
        return localOffset;
      }

      forwardExhausted = true;
    }

    if (!backwardExhausted) {
      if (!forwardExhausted) {
        wantForward = true;
      } // Check if trying to fit before text beginning, and if not, check it fits
      // before offset location


      if (minLine <= start - localOffset) {
        return -localOffset++;
      }

      backwardExhausted = true;
      return iterator();
    } // We tried to fit hunk before text beginning and beyond text length, then
    // hunk can't fit on the text. Return undefined

  };
}

function applyPatch(source, uniDiff) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (typeof uniDiff === 'string') {
    uniDiff = parsePatch(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  } // Apply the diff to the input


  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      hunks = uniDiff.hunks,
      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) {
    return line === patchContent;
  },
      errorCount = 0,
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0,
      offset = 0,
      removeEOFNL,
      addEOFNL;
  /**
   * Checks if the hunk exactly fits on the provided location
   */


  function hunkFits(hunk, toPos) {
    for (var j = 0; j < hunk.lines.length; j++) {
      var line = hunk.lines[j],
          operation = line.length > 0 ? line[0] : ' ',
          content = line.length > 0 ? line.substr(1) : line;

      if (operation === ' ' || operation === '-') {
        // Context sanity check
        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
          errorCount++;

          if (errorCount > fuzzFactor) {
            return false;
          }
        }

        toPos++;
      }
    }

    return true;
  } // Search best fit offsets for each hunk based on the previous ones


  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i],
        maxLine = lines.length - hunk.oldLines,
        localOffset = 0,
        toPos = offset + hunk.oldStart - 1;
    var iterator = distanceIterator(toPos, minLine, maxLine);

    for (; localOffset !== undefined; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }

    if (localOffset === undefined) {
      return false;
    } // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text


    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  } // Apply patch hunks


  var diffOffset = 0;

  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i],
        _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;

    diffOffset += _hunk.newLines - _hunk.oldLines;

    if (_toPos < 0) {
      // Creating a new file
      _toPos = 0;
    }

    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j],
          operation = line.length > 0 ? line[0] : ' ',
          content = line.length > 0 ? line.substr(1) : line,
          delimiter = _hunk.linedelimiters[j];

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
        lines.splice(_toPos, 0, content);
        delimiters.splice(_toPos, 0, delimiter);
        _toPos++;
      } else if (operation === '\\') {
        var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;

        if (previousOperation === '+') {
          removeEOFNL = true;
        } else if (previousOperation === '-') {
          addEOFNL = true;
        }
      }
    }
  } // Handle EOFNL insertion/removal


  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
    delimiters.push('\n');
  }

  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }

  return lines.join('');
} // Wrapper that supports multiple file patches via callbacks.

function grammarNotFound(_ref) {
  var lang = _ref.lang;

  return {
    element: React__default.createElement(ErrorBox, {
      header: "Oops, there's a problem",
      body: React__default.createElement(
        React__default.Fragment,
        null,
        "Syntax highlighter for ",
        React__default.createElement(
          Mark,
          null,
          "\"",
          lang,
          "\""
        ),
        " not found.",
        React__default.createElement(
          "p",
          null,
          "You can try importing it from prismjs with: ",
          React__default.createElement("br", null),
          React__default.createElement(
            Mark,
            null,
            "import \"prismjs/components/prism-",
            lang,
            "\""
          )
        ),
        "(See",
        " ",
        React__default.createElement(
          "a",
          {
            href: "https://prismjs.com/#supported-languages",
            style: { color: "grey" }
          },
          "all the supported languages"
        ),
        ")"
      )
    })
  };
}

function invalidFocusNumber(n) {
  return {
    withFocusString: function withFocusString(focusString) {
      return {
        withStepIndex: function withStepIndex(stepIndex) {
          return {
            element: React__default.createElement(ErrorBox, {
              header: React__default.createElement(StepErrorHeader, { stepIndex: stepIndex }),
              body: React__default.createElement(
                React__default.Fragment,
                null,
                React__default.createElement(
                  Mark,
                  null,
                  "\"",
                  n,
                  "\""
                ),
                " isn't a valid number",
                " ",
                n != focusString && React__default.createElement(
                  Mark,
                  null,
                  " (in \"",
                  focusString,
                  "\")"
                )
              )
            })
          };
        }
      };
    }
  };
}

function invalidLineOrColumnNumber() {
  return {
    withFocusString: function withFocusString(focusString) {
      return {
        withStepIndex: function withStepIndex(stepIndex) {
          return {
            element: React__default.createElement(ErrorBox, {
              header: React__default.createElement(StepErrorHeader, { stepIndex: stepIndex }),
              body: React__default.createElement(
                React__default.Fragment,
                null,
                "Are you using \"0\" as a line or column number",
                " ",
                React__default.createElement(
                  Mark,
                  null,
                  "in \"",
                  focusString,
                  "\""
                ),
                "?",
                React__default.createElement("br", null),
                "(Line and column numbers should start at 1, not 0) ",
                React__default.createElement("br", null)
              )
            })
          };
        }
      };
    }
  };
}

function ErrorBox(_ref2) {
  var header = _ref2.header,
      body = _ref2.body;

  return React__default.createElement(
    "div",
    {
      style: {
        background: "#290000",
        color: "#b96f70",
        border: "2px solid #b96f70",
        padding: "10px 30px",
        maxWidth: "90vw",
        margin: "0 auto",
        fontFamily: "monospace",
        fontSize: "1rem"
      }
    },
    React__default.createElement(
      "h3",
      null,
      header
    ),
    React__default.createElement(
      "p",
      null,
      body
    )
  );
}

function StepErrorHeader(_ref3) {
  var stepIndex = _ref3.stepIndex;

  return React__default.createElement(
    React__default.Fragment,
    null,
    "Oops, there's a problem with the",
    " ",
    React__default.createElement(
      Mark,
      null,
      stepIndex + 1,
      React__default.createElement(
        "sup",
        null,
        ordinal(stepIndex + 1)
      ),
      " step"
    )
  );
}

function Mark(_ref4) {
  var children = _ref4.children;

  return React__default.createElement(
    "mark",
    { style: { background: "none", color: "pink", fontWeight: "bolder" } },
    children
  );
}

function ordinal(i) {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
    return "st";
  }
  if (j == 2 && k != 12) {
    return "nd";
  }
  if (j == 3 && k != 13) {
    return "rd";
  }
  return "th";
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

// https://github.com/PrismJS/prism/issues/1303#issuecomment-375353987
global.Prism = { disableWorkerMessageHandler: true };
var Prism$1 = require("prismjs");

var newlineRe = /\r\n|\r|\n/;

// Take a list of nested tokens
// (token.content may contain an array of tokens)
// and flatten it so content is always a string
// and type the type of the leaf
function flattenTokens(tokens) {
  var flatList = [];
  tokens.forEach(function (token) {
    if (Array.isArray(token.content)) {
      flatList.push.apply(flatList, toConsumableArray(flattenTokens(token.content)));
    } else {
      flatList.push(token);
    }
  });
  return flatList;
}

// Convert strings to tokens
function tokenizeStrings(prismTokens) {
  var parentType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "plain";

  return prismTokens.map(function (pt) {
    return typeof pt === "string" ? { type: parentType, content: pt } : {
      type: pt.type,
      content: Array.isArray(pt.content) ? tokenizeStrings(pt.content, pt.type) : pt.content
    };
  });
}

function tokenize(code) {
  var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "javascript";

  var grammar = Prism$1.languages[language];
  if (!grammar) {
    throw grammarNotFound({ lang: language });
  }
  var prismTokens = Prism$1.tokenize(code, Prism$1.languages[language]);
  var nestedTokens = tokenizeStrings(prismTokens);
  var tokens = flattenTokens(nestedTokens);

  var currentLine = [];
  var lines = [currentLine];
  tokens.forEach(function (token) {
    var contentLines = token.content.split(newlineRe);

    var firstContent = contentLines.shift();
    if (firstContent !== "") {
      currentLine.push({ type: token.type, content: firstContent });
    }
    contentLines.forEach(function (content) {
      currentLine = [];
      lines.push(currentLine);
      if (content !== "") {
        currentLine.push({ type: token.type, content: content });
      }
    });
  });
  return lines;
}

var newlineRe$1 = /\r\n|\r|\n/;

function myDiff(oldCode, newCode) {
  var changes = diffLines(oldCode || "", newCode);

  var oldIndex = -1;
  return changes.map(function (_ref) {
    var value = _ref.value,
        count = _ref.count,
        removed = _ref.removed,
        added = _ref.added;

    var lines = value.split(newlineRe$1);
    // check if last line is empty, if it is, remove it
    var lastLine = lines.pop();
    if (lastLine) {
      lines.push(lastLine);
    }
    var result = {
      oldIndex: oldIndex,
      lines: lines,
      count: count,
      removed: removed,
      added: added
    };
    if (!added) {
      oldIndex += count;
    }
    return result;
  });
}

function insert(array, index, elements) {
  return array.splice.apply(array, [index, 0].concat(toConsumableArray(elements)));
}

function slideDiff(lines, codes, slideIndex, language) {
  var prevLines = lines.filter(function (l) {
    return l.slides.includes(slideIndex - 1);
  });
  var prevCode = codes[slideIndex - 1] || "";
  var currCode = codes[slideIndex];

  var changes = myDiff(prevCode, currCode);

  changes.forEach(function (change) {
    if (change.added) {
      var prevLine = prevLines[change.oldIndex];
      var addAtIndex = lines.indexOf(prevLine) + 1;
      var addLines = change.lines.map(function (content) {
        return {
          content: content,
          slides: [slideIndex]
        };
      });
      insert(lines, addAtIndex, addLines);
    } else if (!change.removed) {
      for (var j = 1; j <= change.count; j++) {
        prevLines[change.oldIndex + j].slides.push(slideIndex);
      }
    }
  });

  var tokenLines = tokenize(currCode, language);
  var currLines = lines.filter(function (l) {
    return l.slides.includes(slideIndex);
  });
  currLines.forEach(function (line, index) {
    return line.tokens = tokenLines[index];
  });
}

function parseLines(codes, language) {
  var lines = [];
  for (var slideIndex = 0; slideIndex < codes.length; slideIndex++) {
    slideDiff(lines, codes, slideIndex, language);
  }
  return lines;
}

function getSlides(codes, language) {
  // codes are in reverse cronological order
  var lines = parseLines(codes, language);
  // console.log("lines", lines);
  return codes.map(function (_, slideIndex) {
    return lines.map(function (line, lineIndex) {
      return {
        content: line.content,
        tokens: line.tokens,
        isNew: !line.slides.includes(slideIndex + 1),
        show: line.slides.includes(slideIndex),
        key: lineIndex
      };
    }).filter(function (line) {
      return line.show;
    });
  });
}

function getCodes(rawSteps) {
  var codes = [];

  rawSteps.forEach(function (s, i) {
    if (s.lang === "diff" && i > 0) {
      codes[i] = applyPatch(codes[i - 1], s.code);
    } else {
      codes[i] = s.code;
    }
  });

  return codes;
}

function parseFocus(focus) {
  if (!focus) {
    // we'll replace the null by some default later in the code
    return null;
  }
  var focusStringValue = "" + focus;
  try {
    var _ref;

    var parts = focusStringValue.split(/,(?![^\[]*\])/g).map(parsePart);

    return new Map((_ref = []).concat.apply(_ref, toConsumableArray(parts)));
  } catch (e) {
    if (e.withFocusString) {
      // console.log(e.withFocusString(focus));
      throw e.withFocusString(focus);
    } else {
      throw e;
    }
  }
}

function parsePart(part) {
  // a part could be
  // - a line number: "2"
  // - a line range: "5:9"
  // - a line number with a column selector: "2[1,3:5,9]"
  var columnsMatch = part.match(/(\d+)\[(.+)\]/);
  if (columnsMatch) {
    var _ref2;

    var _columnsMatch = slicedToArray(columnsMatch, 3),
        _ = _columnsMatch[0],
        line = _columnsMatch[1],
        columns = _columnsMatch[2];

    var columnsList = columns.split(",").map(expandString);
    var index = line - 1;
    var columnIndexes = (_ref2 = []).concat.apply(_ref2, toConsumableArray(columnsList)).map(function (c) {
      return c - 1;
    });
    return [[index, columnIndexes]];
  } else {
    return expandString(part).map(function (lineNumber) {
      return [lineNumber - 1, true];
    });
  }
}

function expandString(part) {
  // Transforms something like
  // - "1:3" to [1,2,3]
  var _part$split = part.split(":"),
      _part$split2 = slicedToArray(_part$split, 2),
      start = _part$split2[0],
      end = _part$split2[1];

  // todo check if start is 0, line numbers and column numbers start at 1

  if (!isNaturalNumber(start)) {
    throw invalidFocusNumber(start);
  }

  var startNumber = +start;

  if (startNumber < 1) {
    throw invalidLineOrColumnNumber(start);
  }

  if (!end) {
    return [startNumber];
  } else {
    if (!isNaturalNumber(end)) {
      throw invalidFocusNumber(end);
    }

    var list = [];
    for (var i = startNumber; i <= +end; i++) {
      list.push(i);
    }
    return list;
  }
}

function isNaturalNumber(n) {
  n = n.toString(); // force the value incase it is not
  var n1 = Math.abs(n),
      n2 = parseInt(n, 10);
  return !isNaN(n1) && n2 === n1 && n1.toString() === n;
}

function parseSteps(rawSteps, lang) {
  var codes = getCodes(rawSteps);

  var stepsLines = getSlides(codes.reverse(), lang).reverse();
  var steps = rawSteps.map(function (step, i) {
    var lines = stepsLines[i];
    try {
      return parseStep(step, lines);
    } catch (e) {
      if (e.withStepIndex) {
        throw e.withStepIndex(i);
      } else {
        throw e;
      }
    }
  });

  steps.forEach(function (step) {
    var lines = step.lines,
        focusMap = step.focusMap;

    lines.forEach(function (line, index) {
      line.focus = focusMap.has(index);
      var columnFocus = focusMap.get(index);
      line.focusPerToken = Array.isArray(columnFocus);
      if (line.focusPerToken) {
        // this mutates the tokens array in order to change it to the same line in other steps
        splitTokensToColumns(line.tokens);
        line.tokens = setTokenFocus(line.tokens, columnFocus);
      }
    });
  });

  return steps;
}

function parseStep(step, lines) {
  var focus = step.focus,
      rest = objectWithoutProperties(step, ["focus"]);

  var focusMap = parseFocus(focus);

  if (!focusMap) {
    // default focus
    var indexes = lines.map(function (line, index) {
      return line.isNew ? index : null;
    }).filter(function (index) {
      return index !== null;
    });
    focusMap = new Map(indexes.map(function (i) {
      return [i, true];
    }));
  }

  var focusIndexes = [].concat(toConsumableArray(focusMap.keys()));
  var focusStart = Math.min.apply(Math, toConsumableArray(focusIndexes));
  var focusEnd = Math.max.apply(Math, toConsumableArray(focusIndexes));

  return _extends({
    lines: lines,
    focusMap: focusMap,
    focusStart: focusStart,
    focusEnd: focusEnd,
    focusCenter: (focusStart + focusEnd + 1) / 2,
    focusCount: focusEnd - focusStart + 1
  }, rest);
}

function splitTokensToColumns(tokenArray) {
  var tokens = [].concat(toConsumableArray(tokenArray));
  var key = 0;
  tokenArray.splice(0, tokenArray.length);
  tokens.forEach(function (token) {
    var chars = [].concat(toConsumableArray(token.content));
    chars.forEach(function (char) {
      return tokenArray.push(_extends({}, token, { content: char, key: key++ }));
    });
  });
}

function setTokenFocus(tokens, focusColumns) {
  // Assumes that tokens are already splitted in columns
  // Return new token objects to avoid changing other steps tokens
  return tokens.map(function (token, i) {
    return _extends({}, token, {
      focus: focusColumns.includes(i)
    });
  });
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var rebound = createCommonjsModule(function (module, exports) {
/**
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
(function (global, factory) {
	module.exports = factory();
}(commonjsGlobal, (function () {
var _onFrame = void 0;
if (typeof window !== 'undefined') {
  _onFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame;
}

if (!_onFrame && typeof process !== 'undefined' && process.title === 'node') {
  _onFrame = setImmediate;
}

_onFrame = _onFrame || function (callback) {
  window.setTimeout(callback, 1000 / 60);
};

var _onFrame$1 = _onFrame;

/* eslint-disable flowtype/no-weak-types */

var concat = Array.prototype.concat;
var slice = Array.prototype.slice;

// Bind a function to a context object.
function bind(func, context) {
  for (var _len = arguments.length, outerArgs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    outerArgs[_key - 2] = arguments[_key];
  }

  return function () {
    for (var _len2 = arguments.length, innerArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      innerArgs[_key2] = arguments[_key2];
    }

    func.apply(context, concat.call(outerArgs, slice.call(innerArgs)));
  };
}

// Add all the properties in the source to the target.
function extend(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

// Cross browser/node timer functions.
function onFrame(func) {
  return _onFrame$1(func);
}

// Lop off the first occurence of the reference in the Array.
function removeFirst(array, item) {
  var idx = array.indexOf(item);
  idx !== -1 && array.splice(idx, 1);
}

var colorCache = {};
/**
 * Converts a hex-formatted color string to its rgb-formatted equivalent. Handy
 * when performing color tweening animations
 * @public
 * @param colorString A hex-formatted color string
 * @return An rgb-formatted color string
 */
function hexToRGB(colorString) {
  if (colorCache[colorString]) {
    return colorCache[colorString];
  }
  var normalizedColor = colorString.replace('#', '');
  if (normalizedColor.length === 3) {
    normalizedColor = normalizedColor[0] + normalizedColor[0] + normalizedColor[1] + normalizedColor[1] + normalizedColor[2] + normalizedColor[2];
  }
  var parts = normalizedColor.match(/.{2}/g);
  if (!parts || parts.length < 3) {
    throw new Error('Expected a color string of format #rrggbb');
  }

  var ret = {
    r: parseInt(parts[0], 16),
    g: parseInt(parts[1], 16),
    b: parseInt(parts[2], 16)
  };

  colorCache[colorString] = ret;
  return ret;
}

/**
 * Converts a rgb-formatted color string to its hex-formatted equivalent. Handy
 * when performing color tweening animations
 * @public
 * @param colorString An rgb-formatted color string
 * @return A hex-formatted color string
 */
function rgbToHex(rNum, gNum, bNum) {
  var r = rNum.toString(16);
  var g = gNum.toString(16);
  var b = bNum.toString(16);
  r = r.length < 2 ? '0' + r : r;
  g = g.length < 2 ? '0' + g : g;
  b = b.length < 2 ? '0' + b : b;
  return '#' + r + g + b;
}

var util = Object.freeze({
	bind: bind,
	extend: extend,
	onFrame: onFrame,
	removeFirst: removeFirst,
	hexToRGB: hexToRGB,
	rgbToHex: rgbToHex
});

/**
 * This helper function does a linear interpolation of a value from
 * one range to another. This can be very useful for converting the
 * motion of a Spring to a range of UI property values. For example a
 * spring moving from position 0 to 1 could be interpolated to move a
 * view from pixel 300 to 350 and scale it from 0.5 to 1. The current
 * position of the `Spring` just needs to be run through this method
 * taking its input range in the _from_ parameters with the property
 * animation range in the _to_ parameters.
 * @public
 */
function mapValueInRange(value, fromLow, fromHigh, toLow, toHigh) {
  var fromRangeSize = fromHigh - fromLow;
  var toRangeSize = toHigh - toLow;
  var valueScale = (value - fromLow) / fromRangeSize;
  return toLow + valueScale * toRangeSize;
}

/**
 * Interpolate two hex colors in a 0 - 1 range or optionally provide a
 * custom range with fromLow,fromHight. The output will be in hex by default
 * unless asRGB is true in which case it will be returned as an rgb string.
 *
 * @public
 * @param asRGB Whether to return an rgb-style string
 * @return A string in hex color format unless asRGB is true, in which case a string in rgb format
 */
function interpolateColor(val, startColorStr, endColorStr) {
  var fromLow = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var fromHigh = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
  var asRGB = arguments[5];

  var startColor = hexToRGB(startColorStr);
  var endColor = hexToRGB(endColorStr);
  var r = Math.floor(mapValueInRange(val, fromLow, fromHigh, startColor.r, endColor.r));
  var g = Math.floor(mapValueInRange(val, fromLow, fromHigh, startColor.g, endColor.g));
  var b = Math.floor(mapValueInRange(val, fromLow, fromHigh, startColor.b, endColor.b));
  if (asRGB) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  } else {
    return rgbToHex(r, g, b);
  }
}

function degreesToRadians(deg) {
  return deg * Math.PI / 180;
}

function radiansToDegrees(rad) {
  return rad * 180 / Math.PI;
}

var MathUtil = Object.freeze({
	mapValueInRange: mapValueInRange,
	interpolateColor: interpolateColor,
	degreesToRadians: degreesToRadians,
	radiansToDegrees: radiansToDegrees
});

// Math for converting from
// [Origami](http://facebook.github.io/origami/) to
// [Rebound](http://facebook.github.io/rebound).
// You mostly don't need to worry about this, just use
// SpringConfig.fromOrigamiTensionAndFriction(v, v);

function tensionFromOrigamiValue(oValue) {
  return (oValue - 30.0) * 3.62 + 194.0;
}

function origamiValueFromTension(tension) {
  return (tension - 194.0) / 3.62 + 30.0;
}

function frictionFromOrigamiValue(oValue) {
  return (oValue - 8.0) * 3.0 + 25.0;
}

function origamiFromFriction(friction) {
  return (friction - 25.0) / 3.0 + 8.0;
}

var OrigamiValueConverter = Object.freeze({
	tensionFromOrigamiValue: tensionFromOrigamiValue,
	origamiValueFromTension: origamiValueFromTension,
	frictionFromOrigamiValue: frictionFromOrigamiValue,
	origamiFromFriction: origamiFromFriction
});

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};









var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

/**
 * Plays each frame of the SpringSystem on animation
 * timing loop. This is the default type of looper for a new spring system
 * as it is the most common when developing UI.
 * @public
 */
/**
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

var AnimationLooper = function () {
  function AnimationLooper() {
    classCallCheck(this, AnimationLooper);
    this.springSystem = null;
  }

  AnimationLooper.prototype.run = function run() {
    var springSystem = getSpringSystem.call(this);

    onFrame(function () {
      springSystem.loop(Date.now());
    });
  };

  return AnimationLooper;
}();

/**
 * Resolves the SpringSystem to a resting state in a
 * tight and blocking loop. This is useful for synchronously generating
 * pre-recorded animations that can then be played on a timing loop later.
 * Sometimes this lead to better performance to pre-record a single spring
 * curve and use it to drive many animations; however, it can make dynamic
 * response to user input a bit trickier to implement.
 * @public
 */
var SimulationLooper = function () {
  function SimulationLooper(timestep) {
    classCallCheck(this, SimulationLooper);
    this.springSystem = null;
    this.time = 0;
    this.running = false;

    this.timestep = timestep || 16.667;
  }

  SimulationLooper.prototype.run = function run() {
    var springSystem = getSpringSystem.call(this);

    if (this.running) {
      return;
    }
    this.running = true;
    while (!springSystem.getIsIdle()) {
      springSystem.loop(this.time += this.timestep);
    }
    this.running = false;
  };

  return SimulationLooper;
}();

/**
 * Resolves the SpringSystem one step at a
 * time controlled by an outside loop. This is useful for testing and
 * verifying the behavior of a SpringSystem or if you want to control your own
 * timing loop for some reason e.g. slowing down or speeding up the
 * simulation.
 * @public
 */
var SteppingSimulationLooper = function () {
  function SteppingSimulationLooper() {
    classCallCheck(this, SteppingSimulationLooper);
    this.springSystem = null;
    this.time = 0;
    this.running = false;
  }

  SteppingSimulationLooper.prototype.run = function run() {}
  // this.run is NOOP'd here to allow control from the outside using
  // this.step.


  // Perform one step toward resolving the SpringSystem.
  ;

  SteppingSimulationLooper.prototype.step = function step(timestep) {
    var springSystem = getSpringSystem.call(this);
    springSystem.loop(this.time += timestep);
  };

  return SteppingSimulationLooper;
}();

function getSpringSystem() {
  if (this.springSystem == null) {
    throw new Error('cannot run looper without a springSystem');
  }
  return this.springSystem;
}



var Loopers = Object.freeze({
	AnimationLooper: AnimationLooper,
	SimulationLooper: SimulationLooper,
	SteppingSimulationLooper: SteppingSimulationLooper
});

/**
 * Provides math for converting from Origami PopAnimation
 * config values to regular Origami tension and friction values. If you are
 * trying to replicate prototypes made with PopAnimation patches in Origami,
 * then you should create your springs with
 * SpringSystem.createSpringWithBouncinessAndSpeed, which uses this Math
 * internally to create a spring to match the provided PopAnimation
 * configuration from Origami.
 */
var BouncyConversion = function () {
  function BouncyConversion(bounciness, speed) {
    classCallCheck(this, BouncyConversion);

    this.bounciness = bounciness;
    this.speed = speed;

    var b = this.normalize(bounciness / 1.7, 0, 20.0);
    b = this.projectNormal(b, 0.0, 0.8);
    var s = this.normalize(speed / 1.7, 0, 20.0);

    this.bouncyTension = this.projectNormal(s, 0.5, 200);
    this.bouncyFriction = this.quadraticOutInterpolation(b, this.b3Nobounce(this.bouncyTension), 0.01);
  }

  BouncyConversion.prototype.normalize = function normalize(value, startValue, endValue) {
    return (value - startValue) / (endValue - startValue);
  };

  BouncyConversion.prototype.projectNormal = function projectNormal(n, start, end) {
    return start + n * (end - start);
  };

  BouncyConversion.prototype.linearInterpolation = function linearInterpolation(t, start, end) {
    return t * end + (1.0 - t) * start;
  };

  BouncyConversion.prototype.quadraticOutInterpolation = function quadraticOutInterpolation(t, start, end) {
    return this.linearInterpolation(2 * t - t * t, start, end);
  };

  BouncyConversion.prototype.b3Friction1 = function b3Friction1(x) {
    return 0.0007 * Math.pow(x, 3) - 0.031 * Math.pow(x, 2) + 0.64 * x + 1.28;
  };

  BouncyConversion.prototype.b3Friction2 = function b3Friction2(x) {
    return 0.000044 * Math.pow(x, 3) - 0.006 * Math.pow(x, 2) + 0.36 * x + 2;
  };

  BouncyConversion.prototype.b3Friction3 = function b3Friction3(x) {
    return 0.00000045 * Math.pow(x, 3) - 0.000332 * Math.pow(x, 2) + 0.1078 * x + 5.84;
  };

  BouncyConversion.prototype.b3Nobounce = function b3Nobounce(tension) {
    var friction = 0;
    if (tension <= 18) {
      friction = this.b3Friction1(tension);
    } else if (tension > 18 && tension <= 44) {
      friction = this.b3Friction2(tension);
    } else {
      friction = this.b3Friction3(tension);
    }
    return friction;
  };

  return BouncyConversion;
}();

/**
 * Maintains a set of tension and friction constants
 * for a Spring. You can use fromOrigamiTensionAndFriction to convert
 * values from the [Origami](http://facebook.github.io/origami/)
 * design tool directly to Rebound spring constants.
 * @public
 */

var SpringConfig = function () {

  /**
   * Convert an origami Spring tension and friction to Rebound spring
   * constants. If you are prototyping a design with Origami, this
   * makes it easy to make your springs behave exactly the same in
   * Rebound.
   * @public
   */
  SpringConfig.fromOrigamiTensionAndFriction = function fromOrigamiTensionAndFriction(tension, friction) {
    return new SpringConfig(tensionFromOrigamiValue(tension), frictionFromOrigamiValue(friction));
  };

  /**
   * Convert an origami PopAnimation Spring bounciness and speed to Rebound
   * spring constants. If you are using PopAnimation patches in Origami, this
   * utility will provide springs that match your prototype.
   * @public
   */


  SpringConfig.fromBouncinessAndSpeed = function fromBouncinessAndSpeed(bounciness, speed) {
    var bouncyConversion = new BouncyConversion(bounciness, speed);
    return SpringConfig.fromOrigamiTensionAndFriction(bouncyConversion.bouncyTension, bouncyConversion.bouncyFriction);
  };

  /**
   * Create a SpringConfig with no tension or a coasting spring with some
   * amount of Friction so that it does not coast infininitely.
   * @public
   */


  SpringConfig.coastingConfigWithOrigamiFriction = function coastingConfigWithOrigamiFriction(friction) {
    return new SpringConfig(0, frictionFromOrigamiValue(friction));
  };

  function SpringConfig(tension, friction) {
    classCallCheck(this, SpringConfig);

    this.tension = tension;
    this.friction = friction;
  }

  return SpringConfig;
}();

SpringConfig.DEFAULT_ORIGAMI_SPRING_CONFIG = SpringConfig.fromOrigamiTensionAndFriction(40, 7);

/**
 * Consists of a position and velocity. A Spring uses
 * this internally to keep track of its current and prior position and
 * velocity values.
 */
var PhysicsState = function PhysicsState() {
  classCallCheck(this, PhysicsState);
  this.position = 0;
  this.velocity = 0;
};

/**
 * Provides a model of a classical spring acting to
 * resolve a body to equilibrium. Springs have configurable
 * tension which is a force multipler on the displacement of the
 * spring from its rest point or `endValue` as defined by [Hooke's
 * law](http://en.wikipedia.org/wiki/Hooke's_law). Springs also have
 * configurable friction, which ensures that they do not oscillate
 * infinitely. When a Spring is displaced by updating it's resting
 * or `currentValue`, the SpringSystems that contain that Spring
 * will automatically start looping to solve for equilibrium. As each
 * timestep passes, `SpringListener` objects attached to the Spring
 * will be notified of the updates providing a way to drive an
 * animation off of the spring's resolution curve.
 * @public
 */

var Spring = function () {
  function Spring(springSystem) {
    classCallCheck(this, Spring);
    this.listeners = [];
    this._startValue = 0;
    this._currentState = new PhysicsState();
    this._displacementFromRestThreshold = 0.001;
    this._endValue = 0;
    this._overshootClampingEnabled = false;
    this._previousState = new PhysicsState();
    this._restSpeedThreshold = 0.001;
    this._tempState = new PhysicsState();
    this._timeAccumulator = 0;
    this._wasAtRest = true;

    this._id = 's' + Spring._ID++;
    this._springSystem = springSystem;
  }

  /**
   * Remove a Spring from simulation and clear its listeners.
   * @public
   */


  Spring.prototype.destroy = function destroy() {
    this.listeners = [];
    this._springSystem.deregisterSpring(this);
  };

  /**
   * Get the id of the spring, which can be used to retrieve it from
   * the SpringSystems it participates in later.
   * @public
   */


  Spring.prototype.getId = function getId() {
    return this._id;
  };

  /**
   * Set the configuration values for this Spring. A SpringConfig
   * contains the tension and friction values used to solve for the
   * equilibrium of the Spring in the physics loop.
   * @public
   */


  Spring.prototype.setSpringConfig = function setSpringConfig(springConfig) {
    this._springConfig = springConfig;
    return this;
  };

  /**
   * Retrieve the SpringConfig used by this Spring.
   * @public
   */


  Spring.prototype.getSpringConfig = function getSpringConfig() {
    return this._springConfig;
  };

  /**
   * Set the current position of this Spring. Listeners will be updated
   * with this value immediately. If the rest or `endValue` is not
   * updated to match this value, then the spring will be dispalced and
   * the SpringSystem will start to loop to restore the spring to the
   * `endValue`.
   *
   * A common pattern is to move a Spring around without animation by
   * calling.
   *
   * ```
   * spring.setCurrentValue(n).setAtRest();
   * ```
   *
   * This moves the Spring to a new position `n`, sets the endValue
   * to `n`, and removes any velocity from the `Spring`. By doing
   * this you can allow the `SpringListener` to manage the position
   * of UI elements attached to the spring even when moving without
   * animation. For example, when dragging an element you can
   * update the position of an attached view through a spring
   * by calling `spring.setCurrentValue(x)`. When
   * the gesture ends you can update the Springs
   * velocity and endValue
   * `spring.setVelocity(gestureEndVelocity).setEndValue(flingTarget)`
   * to cause it to naturally animate the UI element to the resting
   * position taking into account existing velocity. The codepaths for
   * synchronous movement and spring driven animation can
   * be unified using this technique.
   * @public
   */


  Spring.prototype.setCurrentValue = function setCurrentValue(currentValue, skipSetAtRest) {
    this._startValue = currentValue;
    this._currentState.position = currentValue;
    if (!skipSetAtRest) {
      this.setAtRest();
    }
    this.notifyPositionUpdated(false, false);
    return this;
  };

  /**
   * Get the position that the most recent animation started at. This
   * can be useful for determining the number off oscillations that
   * have occurred.
   * @public
   */


  Spring.prototype.getStartValue = function getStartValue() {
    return this._startValue;
  };

  /**
   * Retrieve the current value of the Spring.
   * @public
   */


  Spring.prototype.getCurrentValue = function getCurrentValue() {
    return this._currentState.position;
  };

  /**
   * Get the absolute distance of the Spring from its resting endValue
   * position.
   * @public
   */


  Spring.prototype.getCurrentDisplacementDistance = function getCurrentDisplacementDistance() {
    return this.getDisplacementDistanceForState(this._currentState);
  };

  /**
   * Get the absolute distance of the Spring from a given state value
   */


  Spring.prototype.getDisplacementDistanceForState = function getDisplacementDistanceForState(state) {
    return Math.abs(this._endValue - state.position);
  };

  /**
   * Set the endValue or resting position of the spring. If this
   * value is different than the current value, the SpringSystem will
   * be notified and will begin running its solver loop to resolve
   * the Spring to equilibrium. Any listeners that are registered
   * for onSpringEndStateChange will also be notified of this update
   * immediately.
   * @public
   */


  Spring.prototype.setEndValue = function setEndValue(endValue) {
    if (this._endValue === endValue && this.isAtRest()) {
      return this;
    }
    this._startValue = this.getCurrentValue();
    this._endValue = endValue;
    this._springSystem.activateSpring(this.getId());
    for (var i = 0, len = this.listeners.length; i < len; i++) {
      var listener = this.listeners[i];
      var onChange = listener.onSpringEndStateChange;
      onChange && onChange(this);
    }
    return this;
  };

  /**
   * Retrieve the endValue or resting position of this spring.
   * @public
   */


  Spring.prototype.getEndValue = function getEndValue() {
    return this._endValue;
  };

  /**
   * Set the current velocity of the Spring, in pixels per second. As
   * previously mentioned, this can be useful when you are performing
   * a direct manipulation gesture. When a UI element is released you
   * may call setVelocity on its animation Spring so that the Spring
   * continues with the same velocity as the gesture ended with. The
   * friction, tension, and displacement of the Spring will then
   * govern its motion to return to rest on a natural feeling curve.
   * @public
   */


  Spring.prototype.setVelocity = function setVelocity(velocity) {
    if (velocity === this._currentState.velocity) {
      return this;
    }
    this._currentState.velocity = velocity;
    this._springSystem.activateSpring(this.getId());
    return this;
  };

  /**
   * Get the current velocity of the Spring, in pixels per second.
   * @public
   */


  Spring.prototype.getVelocity = function getVelocity() {
    return this._currentState.velocity;
  };

  /**
   * Set a threshold value for the movement speed of the Spring below
   * which it will be considered to be not moving or resting.
   * @public
   */


  Spring.prototype.setRestSpeedThreshold = function setRestSpeedThreshold(restSpeedThreshold) {
    this._restSpeedThreshold = restSpeedThreshold;
    return this;
  };

  /**
   * Retrieve the rest speed threshold for this Spring.
   * @public
   */


  Spring.prototype.getRestSpeedThreshold = function getRestSpeedThreshold() {
    return this._restSpeedThreshold;
  };

  /**
   * Set a threshold value for displacement below which the Spring
   * will be considered to be not displaced i.e. at its resting
   * `endValue`.
   * @public
   */


  Spring.prototype.setRestDisplacementThreshold = function setRestDisplacementThreshold(displacementFromRestThreshold) {
    this._displacementFromRestThreshold = displacementFromRestThreshold;
  };

  /**
   * Retrieve the rest displacement threshold for this spring.
   * @public
   */


  Spring.prototype.getRestDisplacementThreshold = function getRestDisplacementThreshold() {
    return this._displacementFromRestThreshold;
  };

  /**
   * Enable overshoot clamping. This means that the Spring will stop
   * immediately when it reaches its resting position regardless of
   * any existing momentum it may have. This can be useful for certain
   * types of animations that should not oscillate such as a scale
   * down to 0 or alpha fade.
   * @public
   */


  Spring.prototype.setOvershootClampingEnabled = function setOvershootClampingEnabled(enabled) {
    this._overshootClampingEnabled = enabled;
    return this;
  };

  /**
   * Check if overshoot clamping is enabled for this spring.
   * @public
   */


  Spring.prototype.isOvershootClampingEnabled = function isOvershootClampingEnabled() {
    return this._overshootClampingEnabled;
  };

  /**
   * Check if the Spring has gone past its end point by comparing
   * the direction it was moving in when it started to the current
   * position and end value.
   * @public
   */


  Spring.prototype.isOvershooting = function isOvershooting() {
    var start = this._startValue;
    var end = this._endValue;
    return this._springConfig.tension > 0 && (start < end && this.getCurrentValue() > end || start > end && this.getCurrentValue() < end);
  };

  /**
   * The main solver method for the Spring. It takes
   * the current time and delta since the last time step and performs
   * an RK4 integration to get the new position and velocity state
   * for the Spring based on the tension, friction, velocity, and
   * displacement of the Spring.
   * @public
   */


  Spring.prototype.advance = function advance(time, realDeltaTime) {
    var isAtRest = this.isAtRest();

    if (isAtRest && this._wasAtRest) {
      return;
    }

    var adjustedDeltaTime = realDeltaTime;
    if (realDeltaTime > Spring.MAX_DELTA_TIME_SEC) {
      adjustedDeltaTime = Spring.MAX_DELTA_TIME_SEC;
    }

    this._timeAccumulator += adjustedDeltaTime;

    var tension = this._springConfig.tension;
    var friction = this._springConfig.friction;
    var position = this._currentState.position;
    var velocity = this._currentState.velocity;
    var tempPosition = this._tempState.position;
    var tempVelocity = this._tempState.velocity;
    var aVelocity = void 0;
    var aAcceleration = void 0;
    var bVelocity = void 0;
    var bAcceleration = void 0;
    var cVelocity = void 0;
    var cAcceleration = void 0;
    var dVelocity = void 0;
    var dAcceleration = void 0;
    var dxdt = void 0;
    var dvdt = void 0;

    while (this._timeAccumulator >= Spring.SOLVER_TIMESTEP_SEC) {
      this._timeAccumulator -= Spring.SOLVER_TIMESTEP_SEC;

      if (this._timeAccumulator < Spring.SOLVER_TIMESTEP_SEC) {
        this._previousState.position = position;
        this._previousState.velocity = velocity;
      }

      aVelocity = velocity;
      aAcceleration = tension * (this._endValue - tempPosition) - friction * velocity;

      tempPosition = position + aVelocity * Spring.SOLVER_TIMESTEP_SEC * 0.5;
      tempVelocity = velocity + aAcceleration * Spring.SOLVER_TIMESTEP_SEC * 0.5;
      bVelocity = tempVelocity;
      bAcceleration = tension * (this._endValue - tempPosition) - friction * tempVelocity;

      tempPosition = position + bVelocity * Spring.SOLVER_TIMESTEP_SEC * 0.5;
      tempVelocity = velocity + bAcceleration * Spring.SOLVER_TIMESTEP_SEC * 0.5;
      cVelocity = tempVelocity;
      cAcceleration = tension * (this._endValue - tempPosition) - friction * tempVelocity;

      tempPosition = position + cVelocity * Spring.SOLVER_TIMESTEP_SEC;
      tempVelocity = velocity + cAcceleration * Spring.SOLVER_TIMESTEP_SEC;
      dVelocity = tempVelocity;
      dAcceleration = tension * (this._endValue - tempPosition) - friction * tempVelocity;

      dxdt = 1.0 / 6.0 * (aVelocity + 2.0 * (bVelocity + cVelocity) + dVelocity);
      dvdt = 1.0 / 6.0 * (aAcceleration + 2.0 * (bAcceleration + cAcceleration) + dAcceleration);

      position += dxdt * Spring.SOLVER_TIMESTEP_SEC;
      velocity += dvdt * Spring.SOLVER_TIMESTEP_SEC;
    }

    this._tempState.position = tempPosition;
    this._tempState.velocity = tempVelocity;

    this._currentState.position = position;
    this._currentState.velocity = velocity;

    if (this._timeAccumulator > 0) {
      this._interpolate(this._timeAccumulator / Spring.SOLVER_TIMESTEP_SEC);
    }

    if (this.isAtRest() || this._overshootClampingEnabled && this.isOvershooting()) {
      if (this._springConfig.tension > 0) {
        this._startValue = this._endValue;
        this._currentState.position = this._endValue;
      } else {
        this._endValue = this._currentState.position;
        this._startValue = this._endValue;
      }
      this.setVelocity(0);
      isAtRest = true;
    }

    var notifyActivate = false;
    if (this._wasAtRest) {
      this._wasAtRest = false;
      notifyActivate = true;
    }

    var notifyAtRest = false;
    if (isAtRest) {
      this._wasAtRest = true;
      notifyAtRest = true;
    }

    this.notifyPositionUpdated(notifyActivate, notifyAtRest);
  };

  Spring.prototype.notifyPositionUpdated = function notifyPositionUpdated(notifyActivate, notifyAtRest) {
    for (var i = 0, len = this.listeners.length; i < len; i++) {
      var listener = this.listeners[i];
      if (notifyActivate && listener.onSpringActivate) {
        listener.onSpringActivate(this);
      }

      if (listener.onSpringUpdate) {
        listener.onSpringUpdate(this);
      }

      if (notifyAtRest && listener.onSpringAtRest) {
        listener.onSpringAtRest(this);
      }
    }
  };

  /**
   * Check if the SpringSystem should advance. Springs are advanced
   * a final frame after they reach equilibrium to ensure that the
   * currentValue is exactly the requested endValue regardless of the
   * displacement threshold.
   * @public
   */


  Spring.prototype.systemShouldAdvance = function systemShouldAdvance() {
    return !this.isAtRest() || !this.wasAtRest();
  };

  Spring.prototype.wasAtRest = function wasAtRest() {
    return this._wasAtRest;
  };

  /**
   * Check if the Spring is atRest meaning that it's currentValue and
   * endValue are the same and that it has no velocity. The previously
   * described thresholds for speed and displacement define the bounds
   * of this equivalence check. If the Spring has 0 tension, then it will
   * be considered at rest whenever its absolute velocity drops below the
   * restSpeedThreshold.
   * @public
   */


  Spring.prototype.isAtRest = function isAtRest() {
    return Math.abs(this._currentState.velocity) < this._restSpeedThreshold && (this.getDisplacementDistanceForState(this._currentState) <= this._displacementFromRestThreshold || this._springConfig.tension === 0);
  };

  /**
   * Force the spring to be at rest at its current position. As
   * described in the documentation for setCurrentValue, this method
   * makes it easy to do synchronous non-animated updates to ui
   * elements that are attached to springs via SpringListeners.
   * @public
   */


  Spring.prototype.setAtRest = function setAtRest() {
    this._endValue = this._currentState.position;
    this._tempState.position = this._currentState.position;
    this._currentState.velocity = 0;
    return this;
  };

  Spring.prototype._interpolate = function _interpolate(alpha) {
    this._currentState.position = this._currentState.position * alpha + this._previousState.position * (1 - alpha);
    this._currentState.velocity = this._currentState.velocity * alpha + this._previousState.velocity * (1 - alpha);
  };

  Spring.prototype.getListeners = function getListeners() {
    return this.listeners;
  };

  Spring.prototype.addListener = function addListener(newListener) {
    this.listeners.push(newListener);
    return this;
  };

  Spring.prototype.removeListener = function removeListener(listenerToRemove) {
    removeFirst(this.listeners, listenerToRemove);
    return this;
  };

  Spring.prototype.removeAllListeners = function removeAllListeners() {
    this.listeners = [];
    return this;
  };

  Spring.prototype.currentValueIsApproximately = function currentValueIsApproximately(value) {
    return Math.abs(this.getCurrentValue() - value) <= this.getRestDisplacementThreshold();
  };

  return Spring;
}();

Spring._ID = 0;
Spring.MAX_DELTA_TIME_SEC = 0.064;
Spring.SOLVER_TIMESTEP_SEC = 0.001;

/**
 * A set of Springs that all run on the same physics
 * timing loop. To get started with a Rebound animation, first
 * create a new SpringSystem and then add springs to it.
 * @public
 */

var SpringSystem = function () {
  function SpringSystem(looper) {
    classCallCheck(this, SpringSystem);
    this.listeners = [];
    this._activeSprings = [];
    this._idleSpringIndices = [];
    this._isIdle = true;
    this._lastTimeMillis = -1;
    this._springRegistry = {};

    this.looper = looper || new AnimationLooper();
    this.looper.springSystem = this;
  }

  /**
   * A SpringSystem is iterated by a looper. The looper is responsible
   * for executing each frame as the SpringSystem is resolved to idle.
   * There are three types of Loopers described below AnimationLooper,
   * SimulationLooper, and SteppingSimulationLooper. AnimationLooper is
   * the default as it is the most useful for common UI animations.
   * @public
   */


  SpringSystem.prototype.setLooper = function setLooper(looper) {
    this.looper = looper;
    looper.springSystem = this;
  };

  /**
   * Add a new spring to this SpringSystem. This Spring will now be solved for
   * during the physics iteration loop. By default the spring will use the
   * default Origami spring config with 40 tension and 7 friction, but you can
   * also provide your own values here.
   * @public
   */


  SpringSystem.prototype.createSpring = function createSpring(tension, friction) {
    var springConfig = void 0;
    if (tension === undefined || friction === undefined) {
      springConfig = SpringConfig.DEFAULT_ORIGAMI_SPRING_CONFIG;
    } else {
      springConfig = SpringConfig.fromOrigamiTensionAndFriction(tension, friction);
    }
    return this.createSpringWithConfig(springConfig);
  };

  /**
   * Add a spring with a specified bounciness and speed. To replicate Origami
   * compositions based on PopAnimation patches, use this factory method to
   * create matching springs.
   * @public
   */


  SpringSystem.prototype.createSpringWithBouncinessAndSpeed = function createSpringWithBouncinessAndSpeed(bounciness, speed) {
    var springConfig = void 0;
    if (bounciness === undefined || speed === undefined) {
      springConfig = SpringConfig.DEFAULT_ORIGAMI_SPRING_CONFIG;
    } else {
      springConfig = SpringConfig.fromBouncinessAndSpeed(bounciness, speed);
    }
    return this.createSpringWithConfig(springConfig);
  };

  /**
   * Add a spring with the provided SpringConfig.
   * @public
   */


  SpringSystem.prototype.createSpringWithConfig = function createSpringWithConfig(springConfig) {
    var spring = new Spring(this);
    this.registerSpring(spring);
    spring.setSpringConfig(springConfig);
    return spring;
  };

  /**
   * Check if a SpringSystem is idle or active. If all of the Springs in the
   * SpringSystem are at rest, i.e. the physics forces have reached equilibrium,
   * then this method will return true.
   * @public
   */


  SpringSystem.prototype.getIsIdle = function getIsIdle() {
    return this._isIdle;
  };

  /**
   * Retrieve a specific Spring from the SpringSystem by id. This
   * can be useful for inspecting the state of a spring before
   * or after an integration loop in the SpringSystem executes.
   * @public
   */


  SpringSystem.prototype.getSpringById = function getSpringById(id) {
    return this._springRegistry[id];
  };

  /**
   * Get a listing of all the springs registered with this
   * SpringSystem.
   * @public
   */


  SpringSystem.prototype.getAllSprings = function getAllSprings() {
    var vals = [];
    for (var _id in this._springRegistry) {
      if (this._springRegistry.hasOwnProperty(_id)) {
        vals.push(this._springRegistry[_id]);
      }
    }
    return vals;
  };

  /**
   * Manually add a spring to this system. This is called automatically
   * if a Spring is created with SpringSystem#createSpring.
   *
   * This method sets the spring up in the registry so that it can be solved
   * in the solver loop.
   * @public
   */


  SpringSystem.prototype.registerSpring = function registerSpring(spring) {
    this._springRegistry[spring.getId()] = spring;
  };

  /**
   * Deregister a spring with this SpringSystem. The SpringSystem will
   * no longer consider this Spring during its integration loop once
   * this is called. This is normally done automatically for you when
   * you call Spring#destroy.
   * @public
   */


  SpringSystem.prototype.deregisterSpring = function deregisterSpring(spring) {
    removeFirst(this._activeSprings, spring);
    delete this._springRegistry[spring.getId()];
  };

  SpringSystem.prototype.advance = function advance(time, deltaTime) {
    while (this._idleSpringIndices.length > 0) {
      this._idleSpringIndices.pop();
    }
    for (var i = 0, len = this._activeSprings.length; i < len; i++) {
      var spring = this._activeSprings[i];
      if (spring.systemShouldAdvance()) {
        spring.advance(time / 1000.0, deltaTime / 1000.0);
      } else {
        this._idleSpringIndices.push(this._activeSprings.indexOf(spring));
      }
    }
    while (this._idleSpringIndices.length > 0) {
      var idx = this._idleSpringIndices.pop();
      idx >= 0 && this._activeSprings.splice(idx, 1);
    }
  };

  /**
   * This is the main solver loop called to move the simulation
   * forward through time. Before each pass in the solver loop
   * onBeforeIntegrate is called on an any listeners that have
   * registered themeselves with the SpringSystem. This gives you
   * an opportunity to apply any constraints or adjustments to
   * the springs that should be enforced before each iteration
   * loop. Next the advance method is called to move each Spring in
   * the systemShouldAdvance forward to the current time. After the
   * integration step runs in advance, onAfterIntegrate is called
   * on any listeners that have registered themselves with the
   * SpringSystem. This gives you an opportunity to run any post
   * integration constraints or adjustments on the Springs in the
   * SpringSystem.
   * @public
   */


  SpringSystem.prototype.loop = function loop(currentTimeMillis) {
    var listener = void 0;
    if (this._lastTimeMillis === -1) {
      this._lastTimeMillis = currentTimeMillis - 1;
    }
    var ellapsedMillis = currentTimeMillis - this._lastTimeMillis;
    this._lastTimeMillis = currentTimeMillis;

    var i = 0;
    var len = this.listeners.length;
    for (i = 0; i < len; i++) {
      listener = this.listeners[i];
      listener.onBeforeIntegrate && listener.onBeforeIntegrate(this);
    }

    this.advance(currentTimeMillis, ellapsedMillis);
    if (this._activeSprings.length === 0) {
      this._isIdle = true;
      this._lastTimeMillis = -1;
    }

    for (i = 0; i < len; i++) {
      listener = this.listeners[i];
      listener.onAfterIntegrate && listener.onAfterIntegrate(this);
    }

    if (!this._isIdle) {
      this.looper.run();
    }
  };

  /**
   * Used to notify the SpringSystem that a Spring has become displaced.
   * The system responds by starting its solver loop up if it is currently idle.
   */


  SpringSystem.prototype.activateSpring = function activateSpring(springId) {
    var spring = this._springRegistry[springId];
    if (this._activeSprings.indexOf(spring) === -1) {
      this._activeSprings.push(spring);
    }
    if (this.getIsIdle()) {
      this._isIdle = false;
      this.looper.run();
    }
  };

  /**
   * Add a listener to the SpringSystem to receive before/after integration
   * notifications allowing Springs to be constrained or adjusted.
   * @public
   */


  SpringSystem.prototype.addListener = function addListener(listener) {
    this.listeners.push(listener);
  };

  /**
   * Remove a previously added listener on the SpringSystem.
   * @public
   */


  SpringSystem.prototype.removeListener = function removeListener(listener) {
    removeFirst(this.listeners, listener);
  };

  /**
   * Remove all previously added listeners on the SpringSystem.
   * @public
   */


  SpringSystem.prototype.removeAllListeners = function removeAllListeners() {
    this.listeners = [];
  };

  return SpringSystem;
}();

var index = _extends({}, Loopers, {
  OrigamiValueConverter: OrigamiValueConverter,
  MathUtil: MathUtil,
  Spring: Spring,
  SpringConfig: SpringConfig,
  SpringSystem: SpringSystem,
  util: _extends({}, util, MathUtil)
});

return index;

})));
});

// based on https://github.com/streamich/react-use/blob/master/src/useSpring.ts

function useSpring(_ref) {
  var _ref$target = _ref.target,
      target = _ref$target === undefined ? 0 : _ref$target,
      _ref$current = _ref.current,
      current = _ref$current === undefined ? null : _ref$current,
      _ref$tension = _ref.tension,
      tension = _ref$tension === undefined ? 0 : _ref$tension,
      _ref$friction = _ref.friction,
      friction = _ref$friction === undefined ? 13 : _ref$friction,
      _ref$round = _ref.round,
      round = _ref$round === undefined ? function (x) {
    return x;
  } : _ref$round;

  var _useState = React.useState(null),
      _useState2 = slicedToArray(_useState, 2),
      spring = _useState2[0],
      setSpring = _useState2[1];

  var _useState3 = React.useState(target),
      _useState4 = slicedToArray(_useState3, 2),
      value = _useState4[0],
      setValue = _useState4[1];

  React.useEffect(function () {
    var listener = {
      onSpringUpdate: function onSpringUpdate(spring) {
        var value = spring.getCurrentValue();
        setValue(round(value));
      }
    };

    if (!spring) {
      var newSpring = new rebound.SpringSystem().createSpring(tension, friction);
      newSpring.setCurrentValue(target);
      setSpring(newSpring);
      newSpring.addListener(listener);
      return;
    }

    return function () {
      spring.removeListener(listener);
      setSpring(null);
    };
  }, [tension, friction]);

  React.useEffect(function () {
    if (spring) {
      spring.setEndValue(target);
      if (current != null) {
        spring.setCurrentValue(current);
      }
    }
  }, [target, current]);

  return value;
}

function useStepSpring(stepsCount) {
  // step index according to mdx-deck
  var targetStepIndex = mdxDeck.useSteps(stepsCount - 1);

  // real number between 0 and stepsCount - 1
  var currentStepSpring = useSpring({
    target: targetStepIndex,
    round: function round(x) {
      return Math.round(x * 1000) / 1000;
    }
  });

  return currentStepSpring;
}

function useWindowResize(handler, deps) {
  React__default.useEffect(function () {
    window.addEventListener("resize", handler);
    return function () {
      window.removeEventListener("resize", handler);
    };
  }, deps);
}

// TODO remove this after https://github.com/jxnblk/mdx-deck/pull/359

function useTheme() {
  return React__default.useContext(core.ThemeContext);
}

var _extends$1 = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

function makeTheme(prismTheme) {
  var override = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return {
    codeSurfer: _extends$1({
      styles: prismTheme.styles,
      title: {
        background: prismTheme.plain.backgroundColor
      },
      subtitle: {
        color: "#d6deeb",
        background: "rgba(10,10,10,0.9)"
      },
      pre: {
        color: prismTheme.plain.color,
        background: prismTheme.plain.backgroundColor
      },
      code: {
        color: prismTheme.plain.color,
        background: prismTheme.plain.backgroundColor
      }
    }, override)
  };
}

function addColors(theme, prismTheme) {
  var stringStyle = theme.codeSurfer.styles.find(function (s) {
    return s.types.includes("string");
  });

  return _extends$1({
    colors: {
      text: prismTheme.plain.color,
      background: prismTheme.plain.backgroundColor,
      link: stringStyle && stringStyle.style.color,
      pre: prismTheme.plain.color,
      code: prismTheme.plain.color,
      preBackground: prismTheme.plain.backgroundColor
    }
  }, theme);
}

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme = {
  plain: {
    color: "#393A34",
    backgroundColor: "#f6f8fa"
  },
  styles: [{
    types: ["comment", "prolog", "doctype", "cdata"],
    style: {
      color: "#999988",
      fontStyle: "italic"
    }
  }, {
    types: ["namespace"],
    style: {
      opacity: 0.7
    }
  }, {
    types: ["string", "attr-value"],
    style: {
      color: "#e3116c"
    }
  }, {
    types: ["punctuation", "operator"],
    style: {
      color: "#393A34"
    }
  }, {
    types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"],
    style: {
      color: "#36acaa"
    }
  }, {
    types: ["atrule", "keyword", "attr-name", "selector"],
    style: {
      color: "#00a4db"
    }
  }, {
    types: ["function", "deleted", "tag"],
    style: {
      color: "#d73a49"
    }
  }, {
    types: ["function-variable"],
    style: {
      color: "#6f42c1"
    }
  }, {
    types: ["tag", "selector"],
    style: {
      color: "#00009f"
    }
  }]
};

var theme = makeTheme(prismTheme);
var fullTheme = addColors(theme, prismTheme);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$1 = {
  plain: {
    color: "#F8F8F2",
    backgroundColor: "#282A36"
  },
  styles: [{
    types: ["prolog", "constant", "builtin"],
    style: {
      color: "rgb(189, 147, 249)"
    }
  }, {
    types: ["inserted", "function"],
    style: {
      color: "rgb(80, 250, 123)"
    }
  }, {
    types: ["deleted"],
    style: {
      color: "rgb(255, 85, 85)"
    }
  }, {
    types: ["changed"],
    style: {
      color: "rgb(255, 184, 108)"
    }
  }, {
    types: ["punctuation", "symbol"],
    style: {
      color: "rgb(248, 248, 242)"
    }
  }, {
    types: ["string", "char", "tag", "selector"],
    style: {
      color: "rgb(255, 121, 198)"
    }
  }, {
    types: ["keyword", "variable"],
    style: {
      color: "rgb(189, 147, 249)",
      fontStyle: "italic"
    }
  }, {
    types: ["comment"],
    style: {
      color: "rgb(98, 114, 164)"
    }
  }, {
    types: ["attr-name"],
    style: {
      color: "rgb(241, 250, 140)"
    }
  }]
};

var theme$1 = makeTheme(prismTheme$1);
var fullTheme$1 = addColors(theme$1, prismTheme$1);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$2 = {
  plain: {
    backgroundColor: "#2a2734",
    color: "#9a86fd"
  },
  styles: [{
    types: ["comment", "prolog", "doctype", "cdata", "punctuation"],
    style: {
      color: "#6c6783"
    }
  }, {
    types: ["namespace"],
    style: {
      opacity: 0.7
    }
  }, {
    types: ["tag", "operator", "number"],
    style: {
      color: "#e09142"
    }
  }, {
    types: ["property", "function"],
    style: {
      color: "#9a86fd"
    }
  }, {
    types: ["tag-id", "selector", "atrule-id"],
    style: {
      color: "#eeebff"
    }
  }, {
    types: ["attr-name"],
    style: {
      color: "#c4b9fe"
    }
  }, {
    types: ["boolean", "string", "entity", "url", "attr-value", "keyword", "control", "directive", "unit", "statement", "regex", "at-rule", "placeholder", "variable"],
    style: {
      color: "#ffcc99"
    }
  }, {
    types: ["deleted"],
    style: {
      textDecorationLine: "line-through"
    }
  }, {
    types: ["inserted"],
    style: {
      textDecorationLine: "underline"
    }
  }, {
    types: ["italic"],
    style: {
      fontStyle: "italic"
    }
  }, {
    types: ["important", "bold"],
    style: {
      fontWeight: "bold"
    }
  }, {
    types: ["important"],
    style: {
      color: "#c4b9fe"
    }
  }]
};

var theme$2 = makeTheme(prismTheme$2);
var fullTheme$2 = addColors(theme$2, prismTheme$2);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$3 = {
  plain: {
    backgroundColor: "#faf8f5",
    color: "#728fcb"
  },
  styles: [{
    types: ["comment", "prolog", "doctype", "cdata", "punctuation"],
    style: {
      color: "#b6ad9a"
    }
  }, {
    types: ["namespace"],
    style: {
      opacity: 0.7
    }
  }, {
    types: ["tag", "operator", "number"],
    style: {
      color: "#063289"
    }
  }, {
    types: ["property", "function"],
    style: {
      color: "#b29762"
    }
  }, {
    types: ["tag-id", "selector", "atrule-id"],
    style: {
      color: "#2d2006"
    }
  }, {
    types: ["attr-name"],
    style: {
      color: "#896724"
    }
  }, {
    types: ["boolean", "string", "entity", "url", "attr-value", "keyword", "control", "directive", "unit", "statement", "regex", "at-rule"],
    style: {
      color: "#728fcb"
    }
  }, {
    types: ["placeholder", "variable"],
    style: {
      color: "#93abdc"
    }
  }, {
    types: ["deleted"],
    style: {
      textDecorationLine: "line-through"
    }
  }, {
    types: ["inserted"],
    style: {
      textDecorationLine: "underline"
    }
  }, {
    types: ["italic"],
    style: {
      fontStyle: "italic"
    }
  }, {
    types: ["important", "bold"],
    style: {
      fontWeight: "bold"
    }
  }, {
    types: ["important"],
    style: {
      color: "#896724"
    }
  }]
};

var theme$3 = makeTheme(prismTheme$3);
var fullTheme$3 = addColors(theme$3, prismTheme$3);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$4 = {
  plain: {
    color: "#d6deeb",
    backgroundColor: "#011627"
  },
  styles: [{
    types: ["changed"],
    style: {
      color: "rgb(162, 191, 252)",
      fontStyle: "italic"
    }
  }, {
    types: ["deleted"],
    style: {
      color: "rgba(239, 83, 80, 0.56)",
      fontStyle: "italic"
    }
  }, {
    types: ["inserted", "attr-name"],
    style: {
      color: "rgb(173, 219, 103)",
      fontStyle: "italic"
    }
  }, {
    types: ["comment"],
    style: {
      color: "rgb(99, 119, 119)",
      fontStyle: "italic"
    }
  }, {
    types: ["string", "url"],
    style: {
      color: "rgb(173, 219, 103)"
    }
  }, {
    types: ["variable"],
    style: {
      color: "rgb(214, 222, 235)"
    }
  }, {
    types: ["number"],
    style: {
      color: "rgb(247, 140, 108)"
    }
  }, {
    types: ["builtin", "char", "constant", "function"],
    style: {
      color: "rgb(130, 170, 255)"
    }
  }, {
    // This was manually added after the auto-generation
    // so that punctuations are not italicised
    types: ["punctuation"],
    style: {
      color: "rgb(199, 146, 234)"
    }
  }, {
    types: ["selector", "doctype"],
    style: {
      color: "rgb(199, 146, 234)",
      fontStyle: "italic"
    }
  }, {
    types: ["class-name"],
    style: {
      color: "rgb(255, 203, 139)"
    }
  }, {
    types: ["tag", "operator", "keyword"],
    style: {
      color: "rgb(127, 219, 202)"
    }
  }, {
    types: ["boolean"],
    style: {
      color: "rgb(255, 88, 116)"
    }
  }, {
    types: ["property"],
    style: {
      color: "rgb(128, 203, 196)"
    }
  }, {
    types: ["namespace"],
    style: {
      color: "rgb(178, 204, 214)"
    }
  }]
};

var theme$4 = makeTheme(prismTheme$4, {
  title: { background: "rgba(1, 22, 39, 0.8)" }
});
var fullTheme$4 = addColors(theme$4, prismTheme$4);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var colors = {
  char: "#D8DEE9",
  comment: "#999999",
  keyword: "#c5a5c5",
  primitive: "#5a9bcf",
  string: "#8dc891",
  variable: "#d7deea",
  boolean: "#ff8b50",
  punctuation: "#5FB3B3",
  tag: "#fc929e",
  function: "#79b6f2",
  className: "#FAC863",
  method: "#6699CC",
  operator: "#fc929e"
};

var prismTheme$5 = {
  plain: {
    backgroundColor: "#282c34",
    color: "#ffffff"
  },
  styles: [{
    types: ["attr-name"],
    style: {
      color: colors.keyword
    }
  }, {
    types: ["attr-value"],
    style: {
      color: colors.string
    }
  }, {
    types: ["comment", "block-comment", "prolog", "doctype", "cdata"],
    style: {
      color: colors.comment
    }
  }, {
    types: ["property", "number", "function-name", "constant", "symbol", "deleted"],
    style: {
      color: colors.primitive
    }
  }, {
    types: ["boolean"],
    style: {
      color: colors.boolean
    }
  }, {
    types: ["tag"],
    style: {
      color: colors.tag
    }
  }, {
    types: ["string"],
    style: {
      color: colors.string
    }
  }, {
    types: ["punctuation"],
    style: {
      color: colors.string
    }
  }, {
    types: ["selector", "char", "builtin", "inserted"],
    style: {
      color: colors.char
    }
  }, {
    types: ["function"],
    style: {
      color: colors.function
    }
  }, {
    types: ["operator", "entity", "url", "variable"],
    style: {
      color: colors.variable
    }
  }, {
    types: ["keyword"],
    style: {
      color: colors.keyword
    }
  }, {
    types: ["at-rule", "class-name"],
    style: {
      color: colors.className
    }
  }, {
    types: ["important"],
    style: {
      fontWeight: "400"
    }
  }, {
    types: ["bold"],
    style: {
      fontWeight: "bold"
    }
  }, {
    types: ["italic"],
    style: {
      fontStyle: "italic"
    }
  }, {
    types: ["namespace"],
    style: {
      opacity: 0.7
    }
  }]
};

var theme$5 = makeTheme(prismTheme$5);
var fullTheme$5 = addColors(theme$5, prismTheme$5);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$6 = {
  plain: {
    color: "#9EFEFF",
    backgroundColor: "#2D2A55"
  },
  styles: [{
    types: ["changed"],
    style: {
      color: "rgb(255, 238, 128)"
    }
  }, {
    types: ["deleted"],
    style: {
      color: "rgba(239, 83, 80, 0.56)"
    }
  }, {
    types: ["inserted"],
    style: {
      color: "rgb(173, 219, 103)"
    }
  }, {
    types: ["comment"],
    style: {
      color: "rgb(179, 98, 255)",
      fontStyle: "italic"
    }
  }, {
    types: ["punctuation"],
    style: {
      color: "rgb(255, 255, 255)"
    }
  }, {
    types: ["constant"],
    style: {
      color: "rgb(255, 98, 140)"
    }
  }, {
    types: ["string", "url"],
    style: {
      color: "rgb(165, 255, 144)"
    }
  }, {
    types: ["variable"],
    style: {
      color: "rgb(255, 238, 128)"
    }
  }, {
    types: ["number", "boolean"],
    style: {
      color: "rgb(255, 98, 140)"
    }
  }, {
    types: ["attr-name"],
    style: {
      color: "rgb(255, 180, 84)"
    }
  }, {
    types: ["keyword", "operator", "property", "namespace", "tag", "selector", "doctype"],
    style: {
      color: "rgb(255, 157, 0)"
    }
  }, {
    types: ["builtin", "char", "constant", "function", "class-name"],
    style: {
      color: "rgb(250, 208, 0)"
    }
  }]
};

var theme$6 = makeTheme(prismTheme$6);
var fullTheme$6 = addColors(theme$6, prismTheme$6);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$7 = {
  plain: {
    color: "#282a2e",
    backgroundColor: "#ffffff"
  },
  styles: [{
    types: ["comment"],
    style: {
      color: "rgb(197, 200, 198)"
    }
  }, {
    types: ["string", "number", "builtin", "variable"],
    style: {
      color: "rgb(150, 152, 150)"
    }
  }, {
    types: ["class-name", "function", "tag", "attr-name"],
    style: {
      color: "rgb(40, 42, 46)"
    }
  }]
};

var theme$7 = makeTheme(prismTheme$7);
var fullTheme$7 = addColors(theme$7, prismTheme$7);

// From: https://github.com/FormidableLabs/prism-react-renderer/blob/master/themes/

var prismTheme$8 = {
  plain: {
    color: "#9CDCFE",
    backgroundColor: "#1E1E1E"
  },
  styles: [{
    types: ["prolog"],
    style: {
      color: "rgb(0, 0, 128)"
    }
  }, {
    types: ["comment"],
    style: {
      color: "rgb(106, 153, 85)"
    }
  }, {
    types: ["builtin", "changed", "keyword"],
    style: {
      color: "rgb(86, 156, 214)"
    }
  }, {
    types: ["number", "inserted"],
    style: {
      color: "rgb(181, 206, 168)"
    }
  }, {
    types: ["constant"],
    style: {
      color: "rgb(100, 102, 149)"
    }
  }, {
    types: ["attr-name", "variable"],
    style: {
      color: "rgb(156, 220, 254)"
    }
  }, {
    types: ["deleted", "string", "attr-value"],
    style: {
      color: "rgb(206, 145, 120)"
    }
  }, {
    types: ["selector"],
    style: {
      color: "rgb(215, 186, 125)"
    }
  }, {
    // Fix tag color
    types: ["tag"],
    style: {
      color: "rgb(78, 201, 176)"
    }
  }, {
    // Fix tag color for HTML
    types: ["tag"],
    languages: ["markup"],
    style: {
      color: "rgb(86, 156, 214)"
    }
  }, {
    types: ["punctuation", "operator"],
    style: {
      color: "rgb(212, 212, 212)"
    }
  }, {
    // Fix punctuation color for HTML
    types: ["punctuation"],
    languages: ["markup"],
    style: {
      color: "#808080"
    }
  }, {
    types: ["function"],
    style: {
      color: "rgb(220, 220, 170)"
    }
  }, {
    types: ["class-name"],
    style: {
      color: "rgb(78, 201, 176)"
    }
  }, {
    types: ["char"],
    style: {
      color: "rgb(209, 105, 105)"
    }
  }]
};

var theme$8 = makeTheme(prismTheme$8);
var fullTheme$8 = addColors(theme$8, prismTheme$8);

function useSafeTheme() {
  var unsafeTheme = useTheme();
  return unsafeTheme.codeSurfer ? unsafeTheme : _extends({}, unsafeTheme, { codeSurfer: theme.codeSurfer });
}

function useTokenStyles() {
  var theme$$1 = useSafeTheme();

  var themeStylesByType = React__default.useMemo(function () {
    var themeStylesByType = Object.create(null);

    var styles = theme$$1.codeSurfer.styles;
    styles.forEach(function (_ref) {
      var types = _ref.types,
          style = _ref.style;

      types.forEach(function (type) {
        themeStylesByType[type] = Object.assign(themeStylesByType[type] || {}, style);
      });
    });
    return themeStylesByType;
  }, [theme$$1]);

  var getStyleForToken = React__default.useMemo(function () {
    return function (token) {
      return themeStylesByType[token.type] || {};
    };
  }, [themeStylesByType]);

  return getStyleForToken;
}

function usePreStyle() {
  var theme$$1 = useSafeTheme();
  return theme$$1.codeSurfer.pre || {};
}

function useContainerStyle() {
  var theme$$1 = useSafeTheme();
  return theme$$1.codeSurfer.container || {};
}

function useTitleStyle() {
  var theme$$1 = useSafeTheme();
  var base = {
    position: "absolute",
    top: 0,
    width: "100%",
    margin: 0,
    padding: "1em 0"
  };
  var style = theme$$1.codeSurfer.title || {};
  return _extends({}, base, style);
}

function useSubtitleStyle() {
  var theme$$1 = useSafeTheme();
  var base = {
    position: "absolute",
    bottom: 0,
    width: "calc(100% - 2em)",
    boxSizing: "border-box",
    margin: "0.3em 1em",
    padding: "0.5em",
    background: "rgba(2,2,2,0.9)"
  };
  var style = theme$$1.codeSurfer.subtitle || {};
  return _extends({}, base, style);
}

var Tuple = function () {
  function Tuple(prev, next) {
    classCallCheck(this, Tuple);

    this.prev = prev;
    this.next = next;
  }

  createClass(Tuple, [{
    key: "spread",
    value: function spread() {
      var prev = this.prev;
      var next = this.next;
      return [prev, next];
    }
  }, {
    key: "select",
    value: function select(selector) {
      var _spread = this.spread(),
          _spread2 = slicedToArray(_spread, 2),
          prev = _spread2[0],
          next = _spread2[1];

      return new Tuple(prev != null ? selector(prev) : prev, next != null ? selector(next) : next);
    }
  }, {
    key: "_getChildrenMap",
    value: function _getChildrenMap() {
      if (!this._dict) {
        var _spread3 = this.spread(),
            _spread4 = slicedToArray(_spread3, 2),
            _spread4$ = _spread4[0],
            prevs = _spread4$ === undefined ? [] : _spread4$,
            _spread4$2 = _spread4[1],
            nexts = _spread4$2 === undefined ? [] : _spread4$2;

        var unsortedMap = new Map(prevs.map(function (prev) {
          return [prev.key, { prev: prev }];
        }));
        nexts.forEach(function (next) {
          var _ref = unsortedMap.get(next.key) || {},
              prev = _ref.prev;

          unsortedMap.set(next.key, { prev: prev, next: next });
        });

        var sortedKeys = [].concat(toConsumableArray(unsortedMap.keys()));
        sortedKeys.sort(function (a, b) {
          return a < b ? -1 : a > b ? 1 : 0;
        });
        this._dict = new Map(sortedKeys.map(function (key) {
          var _unsortedMap$get = unsortedMap.get(key),
              prev = _unsortedMap$get.prev,
              next = _unsortedMap$get.next;

          return [key, new Tuple(prev, next)];
        }));
      }
      return this._dict;
    }
  }, {
    key: "get",
    value: function get$$1(key) {
      var childrenMap = this._getChildrenMap();
      return childrenMap.get(key);
    }
  }, {
    key: "map",
    value: function map(mapper) {
      var _this = this;

      var childrenMap = this._getChildrenMap();
      var result = [];
      childrenMap.forEach(function (tuple, key) {
        return result.push(mapper(tuple, key, _this));
      });
      return result;
    }
  }]);
  return Tuple;
}();

function context(tuple, t, parentCtx) {
  var ctx = {
    useSelect: function useSelect(selector) {
      var newTuple = React__default.useMemo(function () {
        return tuple.select(selector);
      }, [tuple]);
      return context(newTuple, t, ctx);
    },
    map: function map(mapper) {
      return tuple.map(function (childTuple, key) {
        return mapper(context(childTuple, t, ctx), key);
      });
    },
    animate: function animate(animation) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _tuple$spread = tuple.spread(),
          _tuple$spread2 = slicedToArray(_tuple$spread, 2),
          prev = _tuple$spread2[0],
          next = _tuple$spread2[1];

      if (config.when && !config.when(prev, next)) {
        return {};
      }

      var staggeredT = t;

      if (config.stagger) {
        var items = parentCtx.map(function (childCtx) {
          var _childCtx$spread = childCtx.spread(),
              _childCtx$spread2 = slicedToArray(_childCtx$spread, 2),
              prevChild = _childCtx$spread2[0],
              nextChild = _childCtx$spread2[1];

          if (!config.when(prevChild, nextChild)) {
            return null;
          }
          return {
            isThisChild: prevChild === prev && nextChild === next
          };
        }).filter(function (x) {
          return x != null;
        });

        var N = items.length;
        if (N > 1) {
          var currentIndex = items.findIndex(function (x) {
            return x.isThisChild;
          });
          var duration = 1 - config.stagger;
          var tick = config.stagger / (N - 1);
          staggeredT = Math.min(1, Math.max(0, (t - currentIndex * tick) / duration));
        }
      }

      return animation(prev, next, staggeredT);
    },
    animations: function animations(_animations) {
      var results = _animations.map(function (_ref) {
        var animation = _ref.animation,
            config = objectWithoutProperties(_ref, ["animation"]);
        return ctx.animate(animation, config);
      });
      return merge$1(results);
    },
    spread: function spread() {
      return tuple.spread();
    }
  };
  return ctx;
}

function useAnimationContext(items, playhead) {
  var prev = items[Math.floor(playhead)];
  var next = items[Math.floor(playhead) + 1];
  var tuple = React__default.useMemo(function () {
    return new Tuple(prev, next);
  }, [prev, next]);
  return context(tuple, playhead % 1);
}

var MULTIPLY = "multiply";

function merge$1(results) {
  var composite = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : MULTIPLY;

  var firstResult = results[0];
  if (results.length < 2) {
    return firstResult;
  }
  if (Array.isArray(firstResult)) {
    return firstResult.map(function (_, i) {
      return mergeResults(results.map(function (result) {
        return result[i];
      }), composite);
    });
  } else {
    var merged = Object.assign.apply(Object, [{}].concat(toConsumableArray(results)));

    if (composite === MULTIPLY) {
      var opacities = results.map(function (x) {
        return x.opacity;
      }).filter(function (x) {
        return x != null;
      });
      if (opacities.length !== 0) {
        merged.opacity = opacities.reduce(function (a, b) {
          return a * b;
        });
      }
    }
    return merged;
  }
}

var easing = {
  // no easing, no acceleration
  linear: function linear(t) {
    return t;
  },
  // accelerating from zero velocity
  easeInQuad: function easeInQuad(t) {
    return t * t;
  },
  // decelerating to zero velocity
  easeOutQuad: function easeOutQuad(t) {
    return t * (2 - t);
  },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  // accelerating from zero velocity
  easeInCubic: function easeInCubic(t) {
    return t * t * t;
  },
  // decelerating to zero velocity
  easeOutCubic: function easeOutCubic(t) {
    return --t * t * t + 1;
  },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  // accelerating from zero velocity
  easeInQuart: function easeInQuart(t) {
    return t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuart: function easeOutQuart(t) {
    return 1 - --t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  // accelerating from zero velocity
  easeInQuint: function easeInQuint(t) {
    return t * t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuint: function easeOutQuint(t) {
    return 1 + --t * t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

var MULTIPLY$1 = "multiply";

/* eslint-disable */
function mergeResults$1(results, composite) {
  var firstResult = results[0];
  if (results.length < 2) {
    return firstResult;
  }
  if (Array.isArray(firstResult)) {
    return firstResult.map(function (_, i) {
      return mergeResults$1(results.map(function (result) {
        return result[i];
      }), composite);
    });
  } else {
    var merged = Object.assign.apply(Object, [{}].concat(toConsumableArray(results)));

    if (composite === MULTIPLY$1) {
      var opacities = results.map(function (x) {
        return x.opacity;
      }).filter(function (x) {
        return x != null;
      });
      if (opacities.length !== 0) {
        merged.opacity = opacities.reduce(function (a, b) {
          return a * b;
        });
      }
    }
    return merged;
  }
}

var playhead = {
  always: function always(props, context) {
    return function (t) {
      return props.value;
    };
  },
  step: function step(props, context) {
    return function (t) {
      var from = props.from,
          to = props.to;

      return t < 0.5 ? from : to;
    };
  },
  tween: function tween(props, context) {
    return function (t) {
      var from = props.from,
          to = props.to,
          _props$ease = props.ease,
          ease = _props$ease === undefined ? easing.linear : _props$ease;


      var style = {};
      Object.keys(from).forEach(function (key) {
        var value = from[key] + (to[key] - from[key]) * ease(t);
        if (key === "x") {
          style["transform"] = "translateX(" + value + "px)";
        } else {
          style[key] = value;
        }
      });

      return style;
    };
  },
  chain: function chain(_ref, ctx) {
    var fns = _ref.children,
        durations = _ref.durations;

    return function (t) {
      var style = run(fns[0], 0, ctx);
      var lowerDuration = 0;
      for (var i = 0; i < fns.length; i++) {
        var fn = fns[i];
        var thisDuration = durations[i];
        var upperDuration = lowerDuration + thisDuration;
        if (lowerDuration <= t && t <= upperDuration) {
          var innerT = (t - lowerDuration) / thisDuration;
          style = mergeResults$1([style, run(fn, innerT, ctx)]);
        } else if (upperDuration < t) {
          // merge the end of previous animation
          style = mergeResults$1([style, run(fn, 1, ctx)]);
        } else if (t < lowerDuration) {
          // merge the start of future animation
          style = mergeResults$1([run(fn, 0, ctx), style]);
        }
        lowerDuration = upperDuration;
      }
      return style;
    };
  },
  delay: function delay() {
    return function () {
      return {};
    };
  },
  parallel: function parallel(_ref2, ctx) {
    var fns = _ref2.children;

    return function (t) {
      var styles = fns.map(function (fn) {
        return run(fn, t, ctx);
      });
      var result = mergeResults$1(styles, MULTIPLY$1);
      return result;
    };
  },
  list: function list(_ref3, ctx) {
    var items = _ref3.forEach,
        children = _ref3.children;
    return function (t) {
      var mapper = children[0];
      var results = items.map(mapper);
      return results.map(function (element) {
        return run(element, t, ctx);
      });
    };
  }
};

function createAnimation(type, config) {
  for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  var props = _extends({}, config, { children: children });
  return {
    type: typeof type === "string" ? playhead[type] : type,
    props: props
  };
}

function Context() {
  throw Error("shouldnt run Context");
}

function run(node, t) {
  var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (node.type === Context) {
    var _node$props = node.props,
        children = _node$props.children,
        patch = objectWithoutProperties(_node$props, ["children"]);

    var newContext = _extends({}, context, patch);
    return run(children[0], t, newContext);
  }

  var result = node.type(node.props, context);
  if (result.type) {
    return run(result, t, context);
  } else {
    return result(t);
  }
}

/* @jsx createAnimation */

function FadeIn() {
  return createAnimation("tween", { from: { opacity: 0 }, to: { opacity: 1 } });
}
function FadeOut() {
  return createAnimation("tween", { from: { opacity: 1 }, to: { opacity: 0 } });
}

function FadeOutIn() {
  return createAnimation(
    "chain",
    { durations: [0.5, 0.5] },
    createAnimation(FadeOut, null),
    createAnimation(FadeIn, null)
  );
}

var dx = 250;
var offOpacity = 0.3;
var outOpacity = 0;
var outHieght = 0;

var SlideToLeft = function SlideToLeft() {
  return createAnimation("tween", {
    from: { x: 0, opacity: 1 },
    to: { x: -dx, opacity: outOpacity },
    ease: easing.easeInQuad
  });
};

function ShrinkHeight(_ref) {
  var lineHeight = _ref.lineHeight;

  if (!lineHeight) {
    return createAnimation("step", { from: { height: null }, to: { height: 0 } });
  }
  return createAnimation("tween", {
    from: { height: lineHeight },
    to: { height: outHieght },
    ease: easing.easeInOutQuad
  });
}

function ExitLine(_ref2) {
  var lineHeight = _ref2.lineHeight;

  return createAnimation(
    "chain",
    { durations: [0.35, 0.3, 0.35] },
    createAnimation(SlideToLeft, null),
    createAnimation(ShrinkHeight, { lineHeight: lineHeight })
  );
}

var SlideFromRight = function SlideFromRight() {
  return createAnimation("tween", {
    from: { x: dx, opacity: outOpacity },
    to: { x: 0, opacity: 1 },
    ease: easing.easeOutQuad
  });
};

function GrowHeight(_ref3) {
  var lineHeight = _ref3.lineHeight;

  if (!lineHeight) {
    return createAnimation("step", { from: { height: 0 }, to: { height: null } });
  }
  return createAnimation("tween", {
    from: { height: outHieght },
    to: { height: lineHeight },
    ease: easing.easeInOutQuad
  });
}

function EnterLine(_ref4) {
  var lineHeight = _ref4.lineHeight;

  return createAnimation(
    "chain",
    { durations: [0.35, 0.3, 0.35] },
    createAnimation("delay", null),
    createAnimation(GrowHeight, { lineHeight: lineHeight }),
    createAnimation(SlideFromRight, null)
  );
}

var fadeIn = function fadeIn(t) {
  return run(createAnimation(FadeIn, null), t);
};
var fadeOut = function fadeOut(t) {
  return run(createAnimation(FadeOut, null), t);
};
var fadeOutIn = function fadeOutIn(t) {
  return run(createAnimation(FadeOutIn, null), t);
};

function switchText(prev, next, t) {
  // TODO merge with fadeBackground and fadeText
  if (t < 0.5) {
    return prev && prev.value;
  } else {
    return next && next.value;
  }
}

var exitLine = function exitLine(prev, next, t) {
  var dimensions = (prev || next).dimensions;
  return run(createAnimation(ExitLine, { lineHeight: dimensions && dimensions.lineHeight }), t);
};
var enterLine = function enterLine(prev, next, t) {
  var dimensions = (prev || next).dimensions;
  return run(createAnimation(EnterLine, { lineHeight: dimensions && dimensions.lineHeight }), t);
};
var focusLine = function focusLine(prev, next, t) {
  return run(createAnimation("tween", {
    from: { opacity: prev && prev.focus ? 1 : offOpacity },
    to: { opacity: next && next.focus ? 1 : offOpacity }
  }), t);
};
var focusToken = function focusToken(prev, next, t) {
  var from = prev && prev.focus === false ? offOpacity : 1;
  var to = next && next.focus === false ? offOpacity : 1;
  return run(createAnimation("tween", { from: { opacity: from }, to: { opacity: to } }), t);
};

var tween = function tween(from, to) {
  return function (prev, next, t) {
    var result = run(createAnimation("tween", {
      from: { value: from || 0 },
      to: { value: to || 0 },
      ease: easing.easeInOut
    }), t);

    return result.value;
  };
};

var scaleToFocus = function scaleToFocus(prev, next, t) {
  var dimensions = (prev || next).dimensions;

  if (!dimensions) {
    return function (t) {
      return {
        scale: 1
      };
    };
  }

  var prevZoom = getZoom(prev);
  var nextZoom = getZoom(next);

  return run(createAnimation("tween", {
    from: {
      scale: prevZoom || nextZoom
    },
    to: {
      scale: nextZoom || prevZoom
    },
    ease: easing.easeInOutQuad
  }), t);
};

function getZoom(step) {
  if (!step) return null;

  var _step$dimensions = step.dimensions,
      paddingBottom = _step$dimensions.paddingBottom,
      paddingTop = _step$dimensions.paddingTop,
      containerHeight = _step$dimensions.containerHeight,
      containerWidth = _step$dimensions.containerWidth,
      contentWidth = _step$dimensions.contentWidth,
      lineHeight = _step$dimensions.lineHeight;


  var contentHeight = step.focusCount * lineHeight;
  var availableHeight = containerHeight - Math.max(paddingBottom, paddingTop) * 2;
  var yZoom = availableHeight / contentHeight;

  // if there are lines that are too long for the container
  var xZoom = 0.9 * containerWidth / contentWidth;

  return Math.min(yZoom, 1, xZoom);
  // return 1;
}

function CodeSurferContainer(_ref) {
  var stepPlayhead = _ref.stepPlayhead,
      info = _ref.info;
  var dimensions = info.dimensions,
      steps = info.steps;

  var ctx = useAnimationContext(steps, stepPlayhead);

  return React__default.createElement(
    "div",
    {
      className: "cs-container",
      style: _extends({}, useContainerStyle(), {
        width: "100%",
        height: dimensions ? dimensions.containerHeight : "100%",
        maxHeight: "100%",
        position: "relative"
      })
    },
    React__default.createElement(CodeSurferContent, { dimensions: dimensions, ctx: ctx }),
    React__default.createElement(Title, { ctx: ctx.useSelect(function (step) {
        return step.title;
      }) }),
    React__default.createElement(Subtitle, { ctx: ctx.useSelect(function (step) {
        return step.subtitle;
      }) })
  );
}

var heightChangingAnimations = [{
  animation: exitLine,
  when: function when(prev, next) {
    return prev && !next;
  },
  stagger: 0.2
}, {
  animation: enterLine,
  when: function when(prev, next) {
    return next && !prev;
  },
  stagger: 0.2
}];
/**
 * This part wasn't easy...
 * We need to adjust the scroll as the lines keep changing height
 * So we animate between the prev focus center and the next focus center
 * but taking into acount the height of the lines that are on top of the center
 * for each frame
 */
function useScrollTop(dimensions, stepCtx) {
  if (!dimensions) return 0;

  var linesCtx = stepCtx.useSelect(function (step) {
    return step.lines;
  });

  var _stepCtx$spread = stepCtx.spread(),
      _stepCtx$spread2 = slicedToArray(_stepCtx$spread, 2),
      prevStep = _stepCtx$spread2[0],
      nextStep = _stepCtx$spread2[1];

  var _React$useMemo = React__default.useMemo(function () {
    var allPrevLines = linesCtx.map(function (ctx) {
      return ctx.animate(function (prev, next) {
        return prev;
      });
    });
    var allNextLines = linesCtx.map(function (ctx) {
      return ctx.animate(function (prev, next) {
        return next;
      });
    });

    var prevCenter = prevStep ? prevStep.focusCenter : 0;
    var nextCenter = nextStep ? nextStep.focusCenter : 0;

    var prevCenterLine = prevStep && prevStep.lines[Math.floor(prevCenter)];
    var nextCenterLine = nextStep && nextStep.lines[Math.floor(nextCenter)];

    var realPrevCenter = prevStep ? allPrevLines.indexOf(prevCenterLine) + prevCenter % 1 : 0;
    var realNextCenter = nextStep ? allNextLines.indexOf(nextCenterLine) + nextCenter % 1 : 0;

    return [realPrevCenter, realNextCenter];
  }, [prevStep, nextStep]),
      _React$useMemo2 = slicedToArray(_React$useMemo, 2),
      realPrevCenter = _React$useMemo2[0],
      realNextCenter = _React$useMemo2[1];

  var currentCenter = stepCtx.animate(tween(realPrevCenter, realNextCenter));

  var scrollTop = 0;

  var lineStyles = linesCtx.map(function (ctx) {
    return ctx.animations(heightChangingAnimations);
  });

  var i = 0;
  while (i <= currentCenter - 1) {
    var h = lineStyles[i].height;
    scrollTop += h == null ? dimensions.lineHeight : h;
    i += 1;
  }
  if (i != currentCenter) {
    var _h = lineStyles[i].height;
    var height = _h == null ? dimensions.lineHeight : _h;
    scrollTop += height * (currentCenter - i);
  }

  return scrollTop;
}

function CodeSurferContent(_ref2) {
  var dimensions = _ref2.dimensions,
      ctx = _ref2.ctx;

  var ref = React__default.useRef();

  var scrollTop = useScrollTop(dimensions, ctx);
  React__default.useLayoutEffect(function () {
    ref.current.scrollTop = scrollTop;
  }, [scrollTop]);

  var _ctx$animate = ctx.animate(scaleToFocus),
      scale = _ctx$animate.scale;

  var verticalOrigin = dimensions ? dimensions.containerHeight / 2 + scrollTop : 0;

  var linesCtx = ctx.useSelect(function (step) {
    return step.lines;
  });

  return React__default.createElement(
    "pre",
    {
      className: "cs-content",
      ref: ref,
      style: _extends({}, usePreStyle(), {
        margin: 0,
        height: "100%",
        overflow: "hidden"
      })
    },
    React__default.createElement(
      "code",
      {
        className: "cs-scaled-content",
        style: _extends({}, usePreStyle(), {
          display: "block",
          height: dimensions ? dimensions.contentHeight : "100%",
          width: dimensions && dimensions.contentWidth,
          margin: dimensions && "0 " + (dimensions.containerWidth - dimensions.contentWidth) / 2 + "px",
          transform: "scale(" + scale + ")",
          transformOrigin: "center " + verticalOrigin + "px"
        })
      },
      React__default.createElement("div", { style: { height: dimensions && dimensions.containerHeight / 2 } }),
      linesCtx.map(function (ctx, key) {
        return React__default.createElement(Line, { ctx: ctx, key: key });
      }),
      React__default.createElement("div", { style: { height: dimensions && dimensions.containerHeight / 2 } })
    )
  );
}

function Line(_ref3) {
  var ctx = _ref3.ctx;

  var lineStyle = ctx.animations([].concat(heightChangingAnimations, [{
    animation: focusLine
  }]));

  var _ctx$animate2 = ctx.animate(function (prev, next) {
    return {
      lineTokens: (prev || next).tokens,
      key: (prev || next).key,
      focusPerToken: prev && prev.focusPerToken || next && next.focusPerToken
    };
  }),
      lineTokens = _ctx$animate2.lineTokens,
      key = _ctx$animate2.key,
      focusPerToken = _ctx$animate2.focusPerToken;

  var getStyleForToken = useTokenStyles();

  var tokens = [];

  var tokensCtx = ctx.useSelect(function (line) {
    return line.tokens;
  });

  if (focusPerToken) {
    tokens = tokensCtx.map(function (tokenCtx) {
      return _extends({}, tokenCtx.animate(function (prev, next) {
        return prev || next;
      }), {
        animatedStyle: tokenCtx.animate(focusToken)
      });
    });
  } else {
    tokens = lineTokens.map(function (token) {
      return _extends({}, token, { animatedStyle: {} });
    });
  }

  return React__default.createElement(
    "div",
    {
      style: _extends({
        overflow: "hidden"
      }, lineStyle)
    },
    React__default.createElement(
      "div",
      {
        style: { display: "inline-block" },
        className: "cs-line cs-line-" + key
      },
      tokens.map(function (token, i) {
        return React__default.createElement(
          "span",
          {
            key: i,
            style: _extends({}, getStyleForToken(token), token.animatedStyle)
          },
          token.content
        );
      })
    )
  );
}

function Title(_ref4) {
  var ctx = _ref4.ctx;

  var text = ctx.animate(switchText);
  var bgStyle = ctx.animate(fadeBackground);
  var textStyle = ctx.animate(fadeText);

  if (!text) return null;

  return React__default.createElement(
    "h4",
    {
      className: "cs-title",
      style: _extends({}, useTitleStyle(), bgStyle)
    },
    React__default.createElement(
      "span",
      { style: textStyle },
      text
    )
  );
}
function Subtitle(_ref5) {
  var ctx = _ref5.ctx;

  var text = ctx.animate(switchText);
  var bgStyle = ctx.animate(fadeBackground);
  var textStyle = ctx.animate(fadeText);

  if (!text) return null;

  return React__default.createElement(
    "p",
    {
      className: "cs-subtitle",
      style: _extends({}, useSubtitleStyle(), bgStyle)
    },
    React__default.createElement(
      "span",
      { style: textStyle },
      text
    )
  );
}

function fadeBackground(prev, next, t) {
  var opacity = 1;
  if (!prev) {
    opacity = t;
  }
  if (!next) {
    opacity = 1 - t;
  }
  return { opacity: opacity };
}

function fadeText(prev, next, t) {
  if (prev && next && prev.value !== next.value) {
    return fadeOutIn(t);
  }
  if (!prev) {
    return fadeIn(t);
  }
  if (!next) {
    return fadeOut(t);
  }
  return { opacity: 1 };
}

var CodeSurferMeasurer = React__default.forwardRef(function (_ref, ref) {
  var info = _ref.info;

  var cref = React__default.useRef();

  React__default.useImperativeHandle(ref, function () {
    return {
      measure: function measure(data) {
        var containers = cref.current.querySelectorAll(".cs-container");
        var stepsDimensions = [].concat(toConsumableArray(containers)).map(function (container, i) {
          return getStepDimensions(container, data.steps[i]);
        });

        var containerHeight = Math.max.apply(Math, toConsumableArray(stepsDimensions.map(function (d) {
          return d.containerHeight;
        })));

        var containerWidth = Math.max.apply(Math, toConsumableArray(stepsDimensions.map(function (d) {
          return d.containerWidth;
        })));

        var contentWidth = Math.max.apply(Math, toConsumableArray(stepsDimensions.map(function (d) {
          return d.contentWidth;
        })));

        return _extends({}, data, {
          dimensions: {
            lineHeight: stepsDimensions[0].lineHeight,
            contentWidth: contentWidth,
            containerHeight: containerHeight,
            containerWidth: containerWidth
          },
          steps: data.steps.map(function (step, i) {
            return _extends({}, step, {
              lines: step.lines.map(function (l) {
                return _extends({}, l, {
                  dimensions: { lineHeight: stepsDimensions[i].lineHeight }
                });
              }),
              dimensions: {
                paddingTop: stepsDimensions[i].paddingTop,
                paddingBottom: stepsDimensions[i].paddingBottom,
                lineHeight: stepsDimensions[i].lineHeight,
                contentWidth: contentWidth,
                containerHeight: containerHeight,
                containerWidth: containerWidth
              }
            });
          })
        });
      }
    };
  });

  return React__default.createElement(
    "div",
    { ref: cref, style: { overflow: "auto", height: "100%", width: "100%" } },
    info.steps.map(function (step, i) {
      return React__default.createElement(
        "div",
        {
          key: i,
          style: {
            overflow: "auto",
            height: "100%",
            width: "100%"
          }
        },
        React__default.createElement(CodeSurferContainer, { info: info, stepPlayhead: i })
      );
    })
  );
});

function getStepDimensions(container, step) {
  var longestLine = getLongestLine(step);
  var longestLineKey = longestLine && longestLine.key;
  var lines = container.querySelectorAll(".cs-line");
  var firstLine = lines[0];
  var containerParent = container.parentElement;
  var title = container.querySelector(".cs-title");
  var subtitle = container.querySelector(".cs-subtitle");

  var lineCount = step.lines.length;
  var heightOverflow = containerParent.scrollHeight - containerParent.clientHeight;
  var avaliableHeight = container.scrollHeight - heightOverflow;

  var lineHeight = firstLine.clientHeight;
  var paddingTop = title ? outerHeight(title) : lineHeight;
  var paddingBottom = subtitle ? outerHeight(subtitle) : lineHeight;

  var codeHeight = lineCount * lineHeight * 2;
  var maxContentHeight = codeHeight + paddingTop + paddingBottom;
  var containerHeight = Math.min(maxContentHeight, avaliableHeight);
  var containerWidth = container.clientWidth;
  var contentHeight = codeHeight + containerHeight;

  var contentWidth = container.querySelector(".cs-line-" + longestLineKey).clientWidth;

  return {
    lineHeight: lineHeight,
    contentHeight: contentHeight,
    contentWidth: contentWidth,
    paddingTop: paddingTop,
    paddingBottom: paddingBottom,
    containerHeight: containerHeight,
    containerWidth: containerWidth
  };
}

function outerHeight(element) {
  var styles = window.getComputedStyle(element);
  var margin = parseFloat(styles["marginTop"]) + parseFloat(styles["marginBottom"]);
  return element.offsetHeight + margin;
}

function getLongestLine(step) {
  var longestLine = step.lines.reduce(function (a, b) {
    return a.content.length > b.content.length ? a : b;
  });
  return longestLine;
}

Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': /<!DOCTYPE[\s\S]+?>/i,
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
				inside: {
					'punctuation': [
						/^=/,
						{
							pattern: /^(\s*)["']|["']$/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
	/**
	 * Adds an inlined language to markup.
	 *
	 * An example of an inlined language is CSS with `<style>` tags.
	 *
	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addInlined('style', 'css');
	 */
	value: function addInlined(tagName, lang) {
		var includedCdataInside = {};
		includedCdataInside['language-' + lang] = {
			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
			lookbehind: true,
			inside: Prism.languages[lang]
		};
		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

		var inside = {
			'included-cdata': {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: includedCdataInside
			}
		};
		inside['language-' + lang] = {
			pattern: /[\s\S]+/,
			inside: Prism.languages[lang]
		};

		var def = {};
		def[tagName] = {
			pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[[\s\S]*?\]\]>\s*|[\s\S])*?(?=<\/__>)/.source.replace(/__/g, tagName), 'i'),
			lookbehind: true,
			greedy: true,
			inside: inside
		};

		Prism.languages.insertBefore('markup', 'cdata', def);
	}
});

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

(function(Prism) {
	var insideString = {
		variable: [
			// Arithmetic Environment
			{
				pattern: /\$?\(\([\s\S]+?\)\)/,
				inside: {
					// If there is a $ sign at the beginning highlight $(( and )) as variable
					variable: [{
							pattern: /(^\$\(\([\s\S]+)\)\)/,
							lookbehind: true
						},
						/^\$\(\(/
					],
					number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee]-?\d+)?/,
					// Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
					operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
					// If there is no $ sign at the beginning highlight (( and )) as punctuation
					punctuation: /\(\(?|\)\)?|,|;/
				}
			},
			// Command Substitution
			{
				pattern: /\$\([^)]+\)|`[^`]+`/,
				greedy: true,
				inside: {
					variable: /^\$\(|^`|\)$|`$/
				}
			},
			/\$(?:[\w#?*!@]+|\{[^}]+\})/i
		]
	};

	Prism.languages.bash = {
		'shebang': {
			pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/,
			alias: 'important'
		},
		'comment': {
			pattern: /(^|[^"{\\])#.*/,
			lookbehind: true
		},
		'string': [
			//Support for Here-Documents https://en.wikipedia.org/wiki/Here_document
			{
				pattern: /((?:^|[^<])<<\s*)["']?(\w+?)["']?\s*\r?\n(?:[\s\S])*?\r?\n\2/,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			{
				pattern: /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
				greedy: true,
				inside: insideString
			}
		],
		'variable': insideString.variable,
		// Originally based on http://ss64.com/bash/
		'function': {
			pattern: /(^|[\s;|&])(?:add|alias|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|hash|head|help|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logout|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tail|tar|tee|test|time|timeout|times|top|touch|tr|traceroute|trap|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zip|zypper)(?=$|[\s;|&])/,
			lookbehind: true
		},
		'keyword': {
			pattern: /(^|[\s;|&])(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|[\s;|&])/,
			lookbehind: true
		},
		'boolean': {
			pattern: /(^|[\s;|&])(?:true|false)(?=$|[\s;|&])/,
			lookbehind: true
		},
		'operator': /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
		'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];]/
	};

	var inside = insideString.variable[1].inside;
	inside.string = Prism.languages.bash.string;
	inside['function'] = Prism.languages.bash['function'];
	inside.keyword = Prism.languages.bash.keyword;
	inside['boolean'] = Prism.languages.bash['boolean'];
	inside.operator = Prism.languages.bash.operator;
	inside.punctuation = Prism.languages.bash.punctuation;

	Prism.languages.shell = Prism.languages.bash;
})(Prism);

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(?:true|false)\b/,
	'function': /\w+(?=\()/,
	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.c = Prism.languages.extend('clike', {
	'class-name': {
		pattern: /(\b(?:enum|struct)\s+)\w+/,
		lookbehind: true
	},
	'keyword': /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
	'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
	'number': /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i
});

Prism.languages.insertBefore('c', 'string', {
	'macro': {
		// allow for multiline macro definitions
		// spaces after the # character compile fine with gcc
		pattern: /(^\s*)#\s*[a-z]+(?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
		lookbehind: true,
		alias: 'property',
		inside: {
			// highlight the path of the include statement as a string
			'string': {
				pattern: /(#\s*include\s*)(?:<.+?>|("|')(?:\\?.)+?\2)/,
				lookbehind: true
			},
			// highlight macro directives as keywords
			'directive': {
				pattern: /(#\s*)\b(?:define|defined|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
				lookbehind: true,
				alias: 'keyword'
			}
		}
	},
	// highlight predefined macros as constants
	'constant': /\b(?:__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|stdin|stdout|stderr)\b/
});

delete Prism.languages.c['boolean'];

Prism.languages.cpp = Prism.languages.extend('c', {
	'class-name': {
		pattern: /(\b(?:class|enum|struct)\s+)\w+/,
		lookbehind: true
	},
	'keyword': /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
	'boolean': /\b(?:true|false)\b/,
	'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/
});

Prism.languages.insertBefore('cpp', 'string', {
	'raw-string': {
		pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
		alias: 'string',
		greedy: true
	}
});

(function (Prism) {

	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

	Prism.languages.css = {
		'comment': /\/\*[\s\S]*?\*\//,
		'atrule': {
			pattern: /@[\w-]+?[\s\S]*?(?:;|(?=\s*\{))/i,
			inside: {
				'rule': /@[\w-]+/
				// See rest below
			}
		},
		'url': RegExp('url\\((?:' + string.source + '|.*?)\\)', 'i'),
		'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
		'string': {
			pattern: string,
			greedy: true
		},
		'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
		'important': /!important\b/i,
		'function': /[-a-z0-9]+(?=\()/i,
		'punctuation': /[(){};:,]/
	};

	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

	var markup = Prism.languages.markup;
	if (markup) {
		markup.tag.addInlined('style', 'css');

		Prism.languages.insertBefore('inside', 'attr-value', {
			'style-attr': {
				pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
				inside: {
					'attr-name': {
						pattern: /^\s*style/i,
						inside: markup.tag.inside
					},
					'punctuation': /^\s*=\s*['"]|['"]\s*$/,
					'attr-value': {
						pattern: /.+/i,
						inside: Prism.languages.css
					}
				},
				alias: 'language-css'
			}
		}, markup.tag);
	}

}(Prism));

Prism.languages.css.selector = {
	pattern: Prism.languages.css.selector,
	inside: {
		'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
		'pseudo-class': /:[-\w]+/,
		'class': /\.[-:.\w]+/,
		'id': /#[-:.\w]+/,
		'attribute': {
			pattern: /\[(?:[^[\]"']|("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1)*\]/,
			greedy: true,
			inside: {
				'punctuation': /^\[|\]$/,
				'case-sensitivity': {
					pattern: /(\s)[si]$/i,
					lookbehind: true,
					alias: 'keyword'
				},
				'namespace': {
					pattern: /^(\s*)[-*\w\xA0-\uFFFF]*\|(?!=)/,
					lookbehind: true,
					inside: {
						'punctuation': /\|$/
					}
				},
				'attribute': {
					pattern: /^(\s*)[-\w\xA0-\uFFFF]+/,
					lookbehind: true
				},
				'value': [
					/("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
					{
						pattern: /(=\s*)[-\w\xA0-\uFFFF]+(?=\s*$)/,
						lookbehind: true
					}
				],
				'operator': /[|~*^$]?=/
			}
		},
		'n-th': {
			pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
			lookbehind: true,
			inside: {
				'number': /[\dn]+/,
				'operator': /[+-]/
			}
		},
		'punctuation': /[()]/
	}
};

Prism.languages.insertBefore('css', 'property', {
	'variable': {
		pattern: /(^|[^-\w\xA0-\uFFFF])--[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*/i,
		lookbehind: true
	}
});

Prism.languages.insertBefore('css', 'function', {
	'operator': {
		pattern: /(\s)[+\-*\/](?=\s)/,
		lookbehind: true
	},
	'hexcode': /#[\da-f]{3,8}/i,
	'entity': /\\[\da-f]{1,8}/i,
	'unit': {
		pattern: /(\d)(?:%|[a-z]+)/,
		lookbehind: true
	},
	'number': /-?[\d.]+/
});

Prism.languages.javascript = Prism.languages.extend('clike', {
	'class-name': [
		Prism.languages.clike['class-name'],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
			lookbehind: true
		}
	],
	'keyword': [
		{
			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		},
	],
	'number': /\b(?:(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+)n?|\d+n|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	'operator': /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
		lookbehind: true,
		greedy: true
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
		alias: 'function'
	},
	'parameter': [
		{
			pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
			inside: Prism.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		}
	],
	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\${[^}]+}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\${|}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.markup.tag.addInlined('script', 'javascript');
}

Prism.languages.js = Prism.languages.javascript;

(function(Prism) {

var javascript = Prism.util.clone(Prism.languages.javascript);

Prism.languages.jsx = Prism.languages.extend('markup', javascript);
Prism.languages.jsx.tag.pattern= /<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{(?:\{[^}]*\}|[^{}])*\}|[^{}])+\}))?|\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}))*\s*\/?)?>/i;

Prism.languages.jsx.tag.inside['tag'].pattern = /^<\/?[^\s>\/]*/i;
Prism.languages.jsx.tag.inside['attr-value'].pattern = /=(?!\{)(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i;
Prism.languages.jsx.tag.inside['tag'].inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;

Prism.languages.insertBefore('inside', 'attr-name', {
	'spread': {
		pattern: /\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}/,
		inside: {
			'punctuation': /\.{3}|[{}.]/,
			'attr-value': /\w+/
		}
	}
}, Prism.languages.jsx.tag);

Prism.languages.insertBefore('inside', 'attr-value',{
	'script': {
		// Allow for two levels of nesting
		pattern: /=(\{(?:\{(?:\{[^}]*\}|[^}])*\}|[^}])+\})/i,
		inside: {
			'script-punctuation': {
				pattern: /^=(?={)/,
				alias: 'punctuation'
			},
			rest: Prism.languages.jsx
		},
		'alias': 'language-javascript'
	}
}, Prism.languages.jsx.tag);

// The following will handle plain text inside tags
var stringifyToken = function (token) {
	if (!token) {
		return '';
	}
	if (typeof token === 'string') {
		return token;
	}
	if (typeof token.content === 'string') {
		return token.content;
	}
	return token.content.map(stringifyToken).join('');
};

var walkTokens = function (tokens) {
	var openedTags = [];
	for (var i = 0; i < tokens.length; i++) {
		var token = tokens[i];
		var notTagNorBrace = false;

		if (typeof token !== 'string') {
			if (token.type === 'tag' && token.content[0] && token.content[0].type === 'tag') {
				// We found a tag, now find its kind

				if (token.content[0].content[0].content === '</') {
					// Closing tag
					if (openedTags.length > 0 && openedTags[openedTags.length - 1].tagName === stringifyToken(token.content[0].content[1])) {
						// Pop matching opening tag
						openedTags.pop();
					}
				} else {
					if (token.content[token.content.length - 1].content === '/>') ; else {
						// Opening tag
						openedTags.push({
							tagName: stringifyToken(token.content[0].content[1]),
							openedBraces: 0
						});
					}
				}
			} else if (openedTags.length > 0 && token.type === 'punctuation' && token.content === '{') {

				// Here we might have entered a JSX context inside a tag
				openedTags[openedTags.length - 1].openedBraces++;

			} else if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces > 0 && token.type === 'punctuation' && token.content === '}') {

				// Here we might have left a JSX context inside a tag
				openedTags[openedTags.length - 1].openedBraces--;

			} else {
				notTagNorBrace = true;
			}
		}
		if (notTagNorBrace || typeof token === 'string') {
			if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
				// Here we are inside a tag, and not inside a JSX context.
				// That's plain text: drop any tokens matched.
				var plainText = stringifyToken(token);

				// And merge text with adjacent text
				if (i < tokens.length - 1 && (typeof tokens[i + 1] === 'string' || tokens[i + 1].type === 'plain-text')) {
					plainText += stringifyToken(tokens[i + 1]);
					tokens.splice(i + 1, 1);
				}
				if (i > 0 && (typeof tokens[i - 1] === 'string' || tokens[i - 1].type === 'plain-text')) {
					plainText = stringifyToken(tokens[i - 1]) + plainText;
					tokens.splice(i - 1, 1);
					i--;
				}

				tokens[i] = new Prism.Token('plain-text', plainText, null, plainText);
			}
		}

		if (token.content && typeof token.content !== 'string') {
			walkTokens(token.content);
		}
	}
};

Prism.hooks.add('after-tokenize', function (env) {
	if (env.language !== 'jsx' && env.language !== 'tsx') {
		return;
	}
	walkTokens(env.tokens);
});

}(Prism));

(function (Prism) {

	Prism.languages.insertBefore('javascript', 'function-variable', {
		'method-variable': {
			pattern: RegExp('(\\.\\s*)' + Prism.languages.javascript['function-variable'].pattern.source),
			lookbehind: true,
			alias: ['function-variable', 'method', 'function', 'property-access']
		}
	});

	Prism.languages.insertBefore('javascript', 'function', {
		'method': {
			pattern: RegExp('(\\.\\s*)' + Prism.languages.javascript['function'].source),
			lookbehind: true,
			alias: ['function', 'property-access']
		}
	});

	Prism.languages.insertBefore('javascript', 'constant', {
		'known-class-name': [
			{
				// standard built-ins
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
				pattern: /\b(?:(?:(?:Uint|Int)(?:8|16|32)|Uint8Clamped|Float(?:32|64))?Array|ArrayBuffer|BigInt|Boolean|DataView|Date|Error|Function|Intl|JSON|Math|Number|Object|Promise|Proxy|Reflect|RegExp|String|Symbol|(?:Weak)?(?:Set|Map)|WebAssembly)\b/,
				alias: 'class-name'
			},
			{
				// errors
				pattern: /\b(?:[A-Z]\w*)Error\b/,
				alias: 'class-name'
			}
		]
	});

	Prism.languages.javascript['keyword'].unshift(
		{
			pattern: /\b(?:as|default|export|from|import)\b/,
			alias: 'module'
		},
		{
			pattern: /\bnull\b/,
			alias: ['null', 'nil']
		},
		{
			pattern: /\bundefined\b/,
			alias: 'nil'
		}
	);

	Prism.languages.insertBefore('javascript', 'operator', {
		'spread': {
			pattern: /\.{3}/,
			alias: 'operator'
		},
		'arrow': {
			pattern: /=>/,
			alias: 'operator'
		}
	});

	Prism.languages.insertBefore('javascript', 'punctuation', {
		'property-access': {
			pattern: /(\.\s*)[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*/,
			lookbehind: true
		},
		'maybe-class-name': {
			pattern: /(^|[^$\w\xA0-\uFFFF])[A-Z][$\w\xA0-\uFFFF]+/,
			lookbehind: true
		},
		'dom': {
			// this contains only a few commonly used DOM variables
			pattern: /\b(?:document|location|navigator|performance|(?:local|session)Storage|window)\b/,
			alias: 'variable'
		},
		'console': {
			pattern: /\bconsole(?=\s*\.)/,
			alias: 'class-name'
		}
	});


	// add 'maybe-class-name' to tokens which might be a class name
	var maybeClassNameTokens = ['function', 'function-variable', 'method', 'method-variable', 'property-access'];

	for (var i = 0; i < maybeClassNameTokens.length; i++) {
		var token = maybeClassNameTokens[i];
		var value = Prism.languages.javascript[token];

		// convert regex to object
		if (Prism.util.type(value) === 'RegExp') {
			value = Prism.languages.javascript[token] = {
				pattern: value
			};
		}

		// keep in mind that we don't support arrays

		var inside = value.inside || {};
		value.inside = inside;

		inside['maybe-class-name'] = /^[A-Z][\s\S]*/;
	}

}(Prism));

(function(Prism) {

// Ignore comments starting with { to privilege string interpolation highlighting
var comment = /#(?!\{).+/,
    interpolation = {
    	pattern: /#\{[^}]+\}/,
    	alias: 'variable'
    };

Prism.languages.coffeescript = Prism.languages.extend('javascript', {
	'comment': comment,
	'string': [

		// Strings are multiline
		{
			pattern: /'(?:\\[\s\S]|[^\\'])*'/,
			greedy: true
		},

		{
			// Strings are multiline
			pattern: /"(?:\\[\s\S]|[^\\"])*"/,
			greedy: true,
			inside: {
				'interpolation': interpolation
			}
		}
	],
	'keyword': /\b(?:and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
	'class-member': {
		pattern: /@(?!\d)\w+/,
		alias: 'variable'
	}
});

Prism.languages.insertBefore('coffeescript', 'comment', {
	'multiline-comment': {
		pattern: /###[\s\S]+?###/,
		alias: 'comment'
	},

	// Block regexp can contain comments and interpolation
	'block-regex': {
		pattern: /\/{3}[\s\S]*?\/{3}/,
		alias: 'regex',
		inside: {
			'comment': comment,
			'interpolation': interpolation
		}
	}
});

Prism.languages.insertBefore('coffeescript', 'string', {
	'inline-javascript': {
		pattern: /`(?:\\[\s\S]|[^\\`])*`/,
		inside: {
			'delimiter': {
				pattern: /^`|`$/,
				alias: 'punctuation'
			},
			rest: Prism.languages.javascript
		}
	},

	// Block strings
	'multiline-string': [
		{
			pattern: /'''[\s\S]*?'''/,
			greedy: true,
			alias: 'string'
		},
		{
			pattern: /"""[\s\S]*?"""/,
			greedy: true,
			alias: 'string',
			inside: {
				interpolation: interpolation
			}
		}
	]

});

Prism.languages.insertBefore('coffeescript', 'keyword', {
	// Object property
	'property': /(?!\d)\w+(?=\s*:(?!:))/
});

delete Prism.languages.coffeescript['template-string'];

Prism.languages.coffee = Prism.languages.coffeescript;
}(Prism));

Prism.languages.diff = {
	'coord': [
		// Match all kinds of coord lines (prefixed by "+++", "---" or "***").
		/^(?:\*{3}|-{3}|\+{3}).*$/m,
		// Match "@@ ... @@" coord lines in unified diff.
		/^@@.*@@$/m,
		// Match coord lines in normal diff (starts with a number).
		/^\d+.*$/m
	],

	// Match inserted and deleted lines. Support both +/- and >/< styles.
	'deleted': /^[-<].*$/m,
	'inserted': /^[+>].*$/m,

	// Match "different" lines (prefixed with "!") in context diff.
	'diff': {
		'pattern': /^!(?!!).+$/m,
		'alias': 'important'
	}
};

Prism.languages.git = {
	/*
	 * A simple one line comment like in a git status command
	 * For instance:
	 * $ git status
	 * # On branch infinite-scroll
	 * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
	 * # and have 1 and 2 different commits each, respectively.
	 * nothing to commit (working directory clean)
	 */
	'comment': /^#.*/m,

	/*
	 * Regexp to match the changed lines in a git diff output. Check the example below.
	 */
	'deleted': /^[-–].*/m,
	'inserted': /^\+.*/m,

	/*
	 * a string (double and simple quote)
	 */
	'string': /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/m,

	/*
	 * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
	 * For instance:
	 * $ git add file.txt
	 */
	'command': {
		pattern: /^.*\$ git .*$/m,
		inside: {
			/*
			 * A git command can contain a parameter starting by a single or a double dash followed by a string
			 * For instance:
			 * $ git diff --cached
			 * $ git log -p
			 */
			'parameter': /\s--?\w+/m
		}
	},

	/*
	 * Coordinates displayed in a git diff command
	 * For instance:
	 * $ git diff
	 * diff --git file.txt file.txt
	 * index 6214953..1d54a52 100644
	 * --- file.txt
	 * +++ file.txt
	 * @@ -1 +1,2 @@
	 * -Here's my tetx file
	 * +Here's my text file
	 * +And this is the second line
	 */
	'coord': /^@@.*@@$/m,

	/*
	 * Match a "commit [SHA1]" line in a git log output.
	 * For instance:
	 * $ git log
	 * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
	 * Author: lgiraudel
	 * Date:   Mon Feb 17 11:18:34 2014 +0100
	 *
	 *     Add of a new line
	 */
	'commit_sha1': /^commit \w{40}$/m
};

Prism.languages.go = Prism.languages.extend('clike', {
	'keyword': /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
	'builtin': /\b(?:bool|byte|complex(?:64|128)|error|float(?:32|64)|rune|string|u?int(?:8|16|32|64)?|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(?:ln)?|real|recover)\b/,
	'boolean': /\b(?:_|iota|nil|true|false)\b/,
	'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
	'number': /(?:\b0x[a-f\d]+|(?:\b\d+\.?\d*|\B\.\d+)(?:e[-+]?\d+)?)i?/i,
	'string': {
		pattern: /(["'`])(\\[\s\S]|(?!\1)[^\\])*\1/,
		greedy: true
	}
});
delete Prism.languages.go['class-name'];

Prism.languages.graphql = {
	'comment': /#.*/,
	'string': {
		pattern: /"(?:\\.|[^\\"\r\n])*"/,
		greedy: true
	},
	'number': /(?:\B-|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
	'boolean': /\b(?:true|false)\b/,
	'variable': /\$[a-z_]\w*/i,
	'directive': {
		pattern: /@[a-z_]\w*/i,
		alias: 'function'
	},
	'attr-name': {
		pattern: /[a-z_]\w*(?=\s*(?:\((?:[^()"]|"(?:\\.|[^\\"\r\n])*")*\))?:)/i,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:enum|implements|interface|on|scalar|type|union)\s+)[a-zA-Z_]\w*/,
		lookbehind: true
	},
	'fragment': {
		pattern: /(\bfragment\s+|\.{3}\s*(?!on\b))[a-zA-Z_]\w*/,
		lookbehind: true,
		alias: 'function'
	},
	'keyword': /\b(?:enum|fragment|implements|input|interface|mutation|on|query|scalar|schema|type|union)\b/,
	'operator': /[!=|]|\.{3}/,
	'punctuation': /[!(){}\[\]:=,]/,
	'constant': /\b(?!ID\b)[A-Z][A-Z_\d]*\b/
};

Prism.languages.json = {
	'comment': /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
	'property': {
		pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
		greedy: true
	},
	'string': {
		pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
		greedy: true
	},
	'number': /-?\d+\.?\d*(e[+-]?\d+)?/i,
	'punctuation': /[{}[\],]/,
	'operator': /:/,
	'boolean': /\b(?:true|false)\b/,
	'null': {
		pattern: /\bnull\b/,
		alias: 'keyword'
	}
};

/* FIXME :
 :extend() is not handled specifically : its highlighting is buggy.
 Mixin usage must be inside a ruleset to be highlighted.
 At-rules (e.g. import) containing interpolations are buggy.
 Detached rulesets are highlighted as at-rules.
 A comment before a mixin usage prevents the latter to be properly highlighted.
 */

Prism.languages.less = Prism.languages.extend('css', {
	'comment': [
		/\/\*[\s\S]*?\*\//,
		{
			pattern: /(^|[^\\])\/\/.*/,
			lookbehind: true
		}
	],
	'atrule': {
		pattern: /@[\w-]+?(?:\([^{}]+\)|[^(){};])*?(?=\s*\{)/i,
		inside: {
			'punctuation': /[:()]/
		}
	},
	// selectors and mixins are considered the same
	'selector': {
		pattern: /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\([^{}]*\)|[^{};@])*?(?=\s*\{)/,
		inside: {
			// mixin parameters
			'variable': /@+[\w-]+/
		}
	},

	'property': /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/i,
	'operator': /[+\-*\/]/
});

Prism.languages.insertBefore('less', 'property', {
	'variable': [
		// Variable declaration (the colon must be consumed!)
		{
			pattern: /@[\w-]+\s*:/,
			inside: {
				"punctuation": /:/
			}
		},

		// Variable usage
		/@@?[\w-]+/
	],
	'mixin-usage': {
		pattern: /([{;]\s*)[.#](?!\d)[\w-]+.*?(?=[(;])/,
		lookbehind: true,
		alias: 'function'
	}
});

Prism.languages.makefile = {
	'comment': {
		pattern: /(^|[^\\])#(?:\\(?:\r\n|[\s\S])|[^\\\r\n])*/,
		lookbehind: true
	},
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},

	// Built-in target names
	'builtin': /\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,

	// Targets
	'symbol': {
		pattern: /^[^:=\r\n]+(?=\s*:(?!=))/m,
		inside: {
			'variable': /\$+(?:[^(){}:#=\s]+|(?=[({]))/
		}
	},
	'variable': /\$+(?:[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,

	'keyword': [
		// Directives
		/-include\b|\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|include|override|private|sinclude|undefine|unexport|vpath)\b/,
		// Functions
		{
			pattern: /(\()(?:addsuffix|abspath|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:s|list)?)(?=[ \t])/,
			lookbehind: true
		}
	],
	'operator': /(?:::|[?:+!])?=|[|@]/,
	'punctuation': /[:;(){}]/
};

Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', {
	'blockquote': {
		// > ...
		pattern: /^>(?:[\t ]*>)*/m,
		alias: 'punctuation'
	},
	'code': [
		{
			// Prefixed by 4 spaces or 1 tab
			pattern: /^(?: {4}|\t).+/m,
			alias: 'keyword'
		},
		{
			// `code`
			// ``code``
			pattern: /``.+?``|`[^`\n]+`/,
			alias: 'keyword'
		},
		{
			// ```optional language
			// code block
			// ```
			pattern: /^```[\s\S]*?^```$/m,
			greedy: true,
			inside: {
				'code-block': {
					pattern: /^(```.*(?:\r?\n|\r))[\s\S]+?(?=(?:\r?\n|\r)^```$)/m,
					lookbehind: true
				},
				'code-language': {
					pattern: /^(```).+/,
					lookbehind: true
				},
				'punctuation': /```/
			}
		}
	],
	'title': [
		{
			// title 1
			// =======

			// title 2
			// -------
			pattern: /\S.*(?:\r?\n|\r)(?:==+|--+)/,
			alias: 'important',
			inside: {
				punctuation: /==+$|--+$/
			}
		},
		{
			// # title 1
			// ###### title 6
			pattern: /(^\s*)#+.+/m,
			lookbehind: true,
			alias: 'important',
			inside: {
				punctuation: /^#+|#+$/
			}
		}
	],
	'hr': {
		// ***
		// ---
		// * * *
		// -----------
		pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
		lookbehind: true,
		alias: 'punctuation'
	},
	'list': {
		// * item
		// + item
		// - item
		// 1. item
		pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
		lookbehind: true,
		alias: 'punctuation'
	},
	'url-reference': {
		// [id]: http://example.com "Optional title"
		// [id]: http://example.com 'Optional title'
		// [id]: http://example.com (Optional title)
		// [id]: <http://example.com> "Optional title"
		pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
		inside: {
			'variable': {
				pattern: /^(!?\[)[^\]]+/,
				lookbehind: true
			},
			'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
			'punctuation': /^[\[\]!:]|[<>]/
		},
		alias: 'url'
	},
	'bold': {
		// **strong**
		// __strong__

		// Allow only one line break
		pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
		lookbehind: true,
		greedy: true,
		inside: {
			'punctuation': /^\*\*|^__|\*\*$|__$/
		}
	},
	'italic': {
		// *em*
		// _em_

		// Allow only one line break
		pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
		lookbehind: true,
		greedy: true,
		inside: {
			'punctuation': /^[*_]|[*_]$/
		}
	},
	'strike': {
		// ~~strike through~~
		// ~strike~

		// Allow only one line break
		pattern: /(^|[^\\])(~~?)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
		lookbehind: true,
		greedy: true,
		inside: {
			'punctuation': /^~~?|~~?$/
		}
	},
	'url': {
		// [example](http://example.com "Optional title")
		// [example] [id]
		pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
		inside: {
			'variable': {
				pattern: /(!?\[)[^\]]+(?=\]$)/,
				lookbehind: true
			},
			'string': {
				pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
			}
		}
	}
});

['bold', 'italic', 'strike'].forEach(function (token) {
	['url', 'bold', 'italic', 'strike'].forEach(function (inside) {
		if (token !== inside) {
			Prism.languages.markdown[token].inside[inside] = Prism.languages.markdown[inside];
		}
	});
});

Prism.hooks.add('after-tokenize', function (env) {
	if (env.language !== 'markdown' && env.language !== 'md') {
		return;
	}

	function walkTokens(tokens) {
		if (!tokens || typeof tokens === 'string') {
			return;
		}

		for (var i = 0, l = tokens.length; i < l; i++) {
			var token = tokens[i];

			if (token.type !== 'code') {
				walkTokens(token.content);
				continue;
			}

			var codeLang = token.content[1];
			var codeBlock = token.content[3];

			if (codeLang && codeBlock &&
				codeLang.type === 'code-language' && codeBlock.type === 'code-block' &&
				typeof codeLang.content === 'string') {

				// this might be a language that Prism does not support
				var alias = 'language-' + codeLang.content.trim().split(/\s+/)[0].toLowerCase();

				// add alias
				if (!codeBlock.alias) {
					codeBlock.alias = [alias];
				} else if (typeof codeBlock.alias === 'string') {
					codeBlock.alias = [codeBlock.alias, alias];
				} else {
					codeBlock.alias.push(alias);
				}
			}
		}
	}

	walkTokens(env.tokens);
});

Prism.hooks.add('wrap', function (env) {
	if (env.type !== 'code-block') {
		return;
	}

	var codeLang = '';
	for (var i = 0, l = env.classes.length; i < l; i++) {
		var cls = env.classes[i];
		var match = /language-(.+)/.exec(cls);
		if (match) {
			codeLang = match[1];
			break;
		}
	}

	var grammar = Prism.languages[codeLang];

	if (!grammar) {
		return;
	}

	// reverse Prism.util.encode
	var code = env.content.replace(/&lt;/g, '<').replace(/&amp;/g, '&');

	env.content = Prism.highlight(code, grammar, codeLang);
});

Prism.languages.md = Prism.languages.markdown;

Prism.languages.objectivec = Prism.languages.extend('c', {
	'keyword': /\b(?:asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|in|self|super)\b|(?:@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,
	'string': /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|@"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
	'operator': /-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/
});

delete Prism.languages.objectivec['class-name'];

Prism.languages.ocaml = {
	'comment': /\(\*[\s\S]*?\*\)/,
	'string': [
		{
			pattern: /"(?:\\.|[^\\\r\n"])*"/,
			greedy: true
		},
		{
			pattern: /(['`])(?:\\(?:\d+|x[\da-f]+|.)|(?!\1)[^\\\r\n])\1/i,
			greedy: true
		}
	],
	'number': /\b(?:0x[\da-f][\da-f_]+|(?:0[bo])?\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?)/i,
	'type': {
		pattern: /\B['`]\w*/,
		alias: 'variable'
	},
	'directive': {
		pattern: /\B#\w+/,
		alias: 'function'
	},
	'keyword': /\b(?:as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|match|method|module|mutable|new|object|of|open|prefix|private|rec|then|sig|struct|to|try|type|val|value|virtual|where|while|with)\b/,
	'boolean': /\b(?:false|true)\b/,
	// Custom operators are allowed
	'operator': /:=|[=<>@^|&+\-*\/$%!?~][!$%&*+\-.\/:<=>?@^|~]*|\b(?:and|asr|land|lor|lxor|lsl|lsr|mod|nor|or)\b/,
	'punctuation': /[(){}\[\]|_.,:;]/
};

Prism.languages.python = {
	'comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true
	},
	'string-interpolation': {
		pattern: /(?:f|rf|fr)(?:("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
		greedy: true,
		inside: {
			'interpolation': {
				// "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
				pattern: /((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,
				lookbehind: true,
				inside: {
					'format-spec': {
						pattern: /(:)[^:(){}]+(?=}$)/,
						lookbehind: true
					},
					'conversion-option': {
						pattern: /![sra](?=[:}]$)/,
						alias: 'punctuation'
					},
					rest: null
				}
			},
			'string': /[\s\S]+/
		}
	},
	'triple-quoted-string': {
		pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]+?\1/i,
		greedy: true,
		alias: 'string'
	},
	'string': {
		pattern: /(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
		greedy: true
	},
	'function': {
		pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
		lookbehind: true
	},
	'class-name': {
		pattern: /(\bclass\s+)\w+/i,
		lookbehind: true
	},
	'decorator': {
		pattern: /(^\s*)@\w+(?:\.\w+)*/i,
		lookbehind: true,
		alias: ['annotation', 'punctuation'],
		inside: {
			'punctuation': /\./
		}
	},
	'keyword': /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
	'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
	'boolean': /\b(?:True|False|None)\b/,
	'number': /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
	'operator': /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;

Prism.languages.reason = Prism.languages.extend('clike', {
	'comment': {
		pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
		lookbehind: true
	},
	'string': {
		pattern: /"(?:\\(?:\r\n|[\s\S])|[^\\\r\n"])*"/,
		greedy: true
	},
	// 'class-name' must be matched *after* 'constructor' defined below
	'class-name': /\b[A-Z]\w*/,
	'keyword': /\b(?:and|as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|method|module|mutable|new|nonrec|object|of|open|or|private|rec|sig|struct|switch|then|to|try|type|val|virtual|when|while|with)\b/,
	'operator': /\.{3}|:[:=]|\|>|->|=(?:==?|>)?|<=?|>=?|[|^?'#!~`]|[+\-*\/]\.?|\b(?:mod|land|lor|lxor|lsl|lsr|asr)\b/
});
Prism.languages.insertBefore('reason', 'class-name', {
	'character': {
		pattern: /'(?:\\x[\da-f]{2}|\\o[0-3][0-7][0-7]|\\\d{3}|\\.|[^'\\\r\n])'/,
		alias: 'string'
	},
	'constructor': {
		// Negative look-ahead prevents from matching things like String.capitalize
		pattern: /\b[A-Z]\w*\b(?!\s*\.)/,
		alias: 'variable'
	},
	'label': {
		pattern: /\b[a-z]\w*(?=::)/,
		alias: 'symbol'
	}
});

// We can't match functions property, so let's not even try.
delete Prism.languages.reason.function;

(function(Prism) {
	Prism.languages.sass = Prism.languages.extend('css', {
		// Sass comments don't need to be closed, only indented
		'comment': {
			pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m,
			lookbehind: true
		}
	});

	Prism.languages.insertBefore('sass', 'atrule', {
		// We want to consume the whole line
		'atrule-line': {
			// Includes support for = and + shortcuts
			pattern: /^(?:[ \t]*)[@+=].+/m,
			inside: {
				'atrule': /(?:@[\w-]+|[+=])/m
			}
		}
	});
	delete Prism.languages.sass.atrule;


	var variable = /\$[-\w]+|#\{\$[-\w]+\}/;
	var operator = [
		/[+*\/%]|[=!]=|<=?|>=?|\b(?:and|or|not)\b/,
		{
			pattern: /(\s+)-(?=\s)/,
			lookbehind: true
		}
	];

	Prism.languages.insertBefore('sass', 'property', {
		// We want to consume the whole line
		'variable-line': {
			pattern: /^[ \t]*\$.+/m,
			inside: {
				'punctuation': /:/,
				'variable': variable,
				'operator': operator
			}
		},
		// We want to consume the whole line
		'property-line': {
			pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s]+.*)/m,
			inside: {
				'property': [
					/[^:\s]+(?=\s*:)/,
					{
						pattern: /(:)[^:\s]+/,
						lookbehind: true
					}
				],
				'punctuation': /:/,
				'variable': variable,
				'operator': operator,
				'important': Prism.languages.sass.important
			}
		}
	});
	delete Prism.languages.sass.property;
	delete Prism.languages.sass.important;

	// Now that whole lines for other patterns are consumed,
	// what's left should be selectors
	Prism.languages.insertBefore('sass', 'punctuation', {
		'selector': {
			pattern: /([ \t]*)\S(?:,?[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,?[^,\r\n]+)*)*/,
			lookbehind: true
		}
	});

}(Prism));

Prism.languages.scss = Prism.languages.extend('css', {
	'comment': {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
		lookbehind: true
	},
	'atrule': {
		pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	// url, compassified
	'url': /(?:[-a-z]+-)*url(?=\()/i,
	// CSS selector regex is not appropriate for Sass
	// since there can be lot more things (var, @ directive, nesting..)
	// a selector must start at the end of a property or after a brace (end of other rules or nesting)
	// it can contain some characters that aren't used for defining rules or end of selector, & (parent selector), or interpolated variable
	// the end of a selector is found when there is no rules in it ( {} or {\s}) or if there is a property (because an interpolated var
	// can "pass" as a selector- e.g: proper#{$erty})
	// this one was hard to do, so please be careful if you edit this one :)
	'selector': {
		// Initial look-ahead is used to prevent matching of blank selectors
		pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()]|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}]+[:{][^}]+))/m,
		inside: {
			'parent': {
				pattern: /&/,
				alias: 'important'
			},
			'placeholder': /%[-\w]+/,
			'variable': /\$[-\w]+|#\{\$[-\w]+\}/
		}
	},
	'property': {
		pattern: /(?:[\w-]|\$[-\w]+|#\{\$[-\w]+\})+(?=\s*:)/,
		inside: {
			'variable': /\$[-\w]+|#\{\$[-\w]+\}/
		}
	}
});

Prism.languages.insertBefore('scss', 'atrule', {
	'keyword': [
		/@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
		{
			pattern: /( +)(?:from|through)(?= )/,
			lookbehind: true
		}
	]
});

Prism.languages.insertBefore('scss', 'important', {
	// var and interpolated vars
	'variable': /\$[-\w]+|#\{\$[-\w]+\}/
});

Prism.languages.insertBefore('scss', 'function', {
	'placeholder': {
		pattern: /%[-\w]+/,
		alias: 'selector'
	},
	'statement': {
		pattern: /\B!(?:default|optional)\b/i,
		alias: 'keyword'
	},
	'boolean': /\b(?:true|false)\b/,
	'null': {
		pattern: /\bnull\b/,
		alias: 'keyword'
	},
	'operator': {
		pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
		lookbehind: true
	}
});

Prism.languages.scss['atrule'].inside.rest = Prism.languages.scss;

Prism.languages.sql = {
	'comment': {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
		lookbehind: true
	},
	'variable': [
		{
			pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
			greedy: true
		},
		/@[\w.$]+/
	],
	'string': {
		pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
		greedy: true,
		lookbehind: true
	},
	'function': /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
	'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
	'boolean': /\b(?:TRUE|FALSE|NULL)\b/i,
	'number': /\b0x[\da-f]+\b|\b\d+\.?\d*|\B\.\d+\b/i,
	'operator': /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
	'punctuation': /[;[\]()`,.]/
};

(function (Prism) {
	var inside = {
		'url': /url\((["']?).*?\1\)/i,
		'string': {
			pattern: /("|')(?:(?!\1)[^\\\r\n]|\\(?:\r\n|[\s\S]))*\1/,
			greedy: true
		},
		'interpolation': null, // See below
		'func': null, // See below
		'important': /\B!(?:important|optional)\b/i,
		'keyword': {
			pattern: /(^|\s+)(?:(?:if|else|for|return|unless)(?=\s+|$)|@[\w-]+)/,
			lookbehind: true
		},
		'hexcode': /#[\da-f]{3,6}/i,
		'number': /\b\d+(?:\.\d+)?%?/,
		'boolean': /\b(?:true|false)\b/,
		'operator': [
			// We want non-word chars around "-" because it is
			// accepted in property names.
			/~|[+!\/%<>?=]=?|[-:]=|\*[*=]?|\.+|&&|\|\||\B-\B|\b(?:and|in|is(?: a| defined| not|nt)?|not|or)\b/
		],
		'punctuation': /[{}()\[\];:,]/
	};

	inside['interpolation'] = {
		pattern: /\{[^\r\n}:]+\}/,
		alias: 'variable',
		inside: {
			'delimiter': {
				pattern: /^{|}$/,
				alias: 'punctuation'
			},
			rest: inside
		}
	};
	inside['func'] = {
		pattern: /[\w-]+\([^)]*\).*/,
		inside: {
			'function': /^[^(]+/,
			rest: inside
		}
	};

	Prism.languages.stylus = {
		'comment': {
			pattern: /(^|[^\\])(\/\*[\s\S]*?\*\/|\/\/.*)/,
			lookbehind: true
		},
		'atrule-declaration': {
			pattern: /(^\s*)@.+/m,
			lookbehind: true,
			inside: {
				'atrule': /^@[\w-]+/,
				rest: inside
			}
		},
		'variable-declaration': {
			pattern: /(^[ \t]*)[\w$-]+\s*.?=[ \t]*(?:(?:\{[^}]*\}|.+)|$)/m,
			lookbehind: true,
			inside: {
				'variable': /^\S+/,
				rest: inside
			}
		},

		'statement': {
			pattern: /(^[ \t]*)(?:if|else|for|return|unless)[ \t]+.+/m,
			lookbehind: true,
			inside: {
				keyword: /^\S+/,
				rest: inside
			}
		},

		// A property/value pair cannot end with a comma or a brace
		// It cannot have indented content unless it ended with a semicolon
		'property-declaration': {
			pattern: /((?:^|\{)([ \t]*))(?:[\w-]|\{[^}\r\n]+\})+(?:\s*:\s*|[ \t]+)[^{\r\n]*(?:;|[^{\r\n,](?=$)(?!(\r?\n|\r)(?:\{|\2[ \t]+)))/m,
			lookbehind: true,
			inside: {
				'property': {
					pattern: /^[^\s:]+/,
					inside: {
						'interpolation': inside.interpolation
					}
				},
				rest: inside
			}
		},



		// A selector can contain parentheses only as part of a pseudo-element
		// It can span multiple lines.
		// It must end with a comma or an accolade or have indented content.
		'selector': {
			pattern: /(^[ \t]*)(?:(?=\S)(?:[^{}\r\n:()]|::?[\w-]+(?:\([^)\r\n]*\))?|\{[^}\r\n]+\})+)(?:(?:\r?\n|\r)(?:\1(?:(?=\S)(?:[^{}\r\n:()]|::?[\w-]+(?:\([^)\r\n]*\))?|\{[^}\r\n]+\})+)))*(?:,$|\{|(?=(?:\r?\n|\r)(?:\{|\1[ \t]+)))/m,
			lookbehind: true,
			inside: {
				'interpolation': inside.interpolation,
				'punctuation': /[{},]/
			}
		},

		'func': inside.func,
		'string': inside.string,
		'interpolation': inside.interpolation,
		'punctuation': /[{}()\[\];:.]/
	};
}(Prism));

Prism.languages.typescript = Prism.languages.extend('javascript', {
	// From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
	'keyword': /\b(?:abstract|as|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|var|void|while|with|yield)\b/,
	'builtin': /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/,
});

Prism.languages.ts = Prism.languages.typescript;

Prism.languages.wasm = {
	'comment': [
		/\(;[\s\S]*?;\)/,
		{
			pattern: /;;.*/,
			greedy: true
		}
	],
	'string': {
		pattern: /"(?:\\[\s\S]|[^"\\])*"/,
		greedy: true
	},
	'keyword': [
		{
			pattern: /\b(?:align|offset)=/,
			inside: {
				'operator': /=/
			}
		},
		{
			pattern: /\b(?:(?:f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))?|memory\.(?:grow|size))\b/,
			inside: {
				'punctuation': /\./
			}
		},
		/\b(?:anyfunc|block|br(?:_if|_table)?|call(?:_indirect)?|data|drop|elem|else|end|export|func|get_(?:global|local)|global|if|import|local|loop|memory|module|mut|nop|offset|param|result|return|select|set_(?:global|local)|start|table|tee_local|then|type|unreachable)\b/
	],
	'variable': /\$[\w!#$%&'*+\-./:<=>?@\\^_`|~]+/i,
	'number': /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/,
	'punctuation': /[()]/
};

Prism.languages.yaml = {
	'scalar': {
		pattern: /([\-:]\s*(?:![^\s]+)?[ \t]*[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)[^\r\n]+(?:\2[^\r\n]+)*)/,
		lookbehind: true,
		alias: 'string'
	},
	'comment': /#.*/,
	'key': {
		pattern: /(\s*(?:^|[:\-,[{\r\n?])[ \t]*(?:![^\s]+)?[ \t]*)[^\r\n{[\]},#\s]+?(?=\s*:\s)/,
		lookbehind: true,
		alias: 'atrule'
	},
	'directive': {
		pattern: /(^[ \t]*)%.+/m,
		lookbehind: true,
		alias: 'important'
	},
	'datetime': {
		pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?)(?=[ \t]*(?:$|,|]|}))/m,
		lookbehind: true,
		alias: 'number'
	},
	'boolean': {
		pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:true|false)[ \t]*(?=$|,|]|})/im,
		lookbehind: true,
		alias: 'important'
	},
	'null': {
		pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:null|~)[ \t]*(?=$|,|]|})/im,
		lookbehind: true,
		alias: 'important'
	},
	'string': {
		pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)("|')(?:(?!\2)[^\\\r\n]|\\.)*\2(?=[ \t]*(?:$|,|]|}|\s*#))/m,
		lookbehind: true,
		greedy: true
	},
	'number': {
		pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+\.?\d*|\.?\d+)(?:e[+-]?\d+)?|\.inf|\.nan)[ \t]*(?=$|,|]|})/im,
		lookbehind: true
	},
	'tag': /![^\s]+/,
	'important': /[&*][\w]+/,
	'punctuation': /---|[:[\]{}\-,|>?]|\.\.\./
};

Prism.languages.yml = Prism.languages.yaml;

function CodeSurferContainer$1(props) {
  var ref = React__default.useRef();

  var steps = React__default.useMemo(function () {
    return parseSteps(props.steps, props.lang);
  }, [props.steps, props.lang]);

  var _React$useState = React__default.useState({
    measured: false,
    lang: props.lang,
    steps: steps,
    dimensions: null
  }),
      _React$useState2 = slicedToArray(_React$useState, 2),
      info = _React$useState2[0],
      setInfo = _React$useState2[1];

  React__default.useLayoutEffect(function () {
    if (info.measured) return;
    setInfo(function (info) {
      return _extends({}, ref.current.measure(info), { measured: true });
    });
  }, [info.measured]);

  useWindowResize(function () {
    return setInfo(function (info) {
      return _extends({}, info, { measured: false });
    });
  }, [setInfo]);

  if (!info.measured) {
    return React__default.createElement(CodeSurferMeasurer, { info: info, ref: ref });
  }
  return React__default.createElement(CodeSurfer, { info: info });
}

function CodeSurfer(_ref) {
  var info = _ref.info;
  var steps = info.steps;

  var stepPlayhead = useStepSpring(steps.length);

  return React__default.createElement(CodeSurferContainer, { stepPlayhead: stepPlayhead, info: info });
}

var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

var parse = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

var stringify = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

var parse$1 = parse;
var stringify$1 = stringify;

var jsonify = {
	parse: parse$1,
	stringify: stringify$1
};

var arrayMap = function (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        if (hasOwn.call(xs, i)) res.push(f(x, i, xs));
    }
    return res;
};

var hasOwn = Object.prototype.hasOwnProperty;

/**
 * Array#filter.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array}
 */

var arrayFilter = function (arr, fn) {
  if (arr.filter) return arr.filter(fn);
  var ret = [];
  for (var i = 0; i < arr.length; i++) {
    if (!hasOwn$1.call(arr, i)) continue;
    if (fn(arr[i], i, arr)) ret.push(arr[i]);
  }
  return ret;
};

var hasOwn$1 = Object.prototype.hasOwnProperty;

var hasOwn$2 = Object.prototype.hasOwnProperty;

var arrayReduce = function (xs, f, acc) {
    var hasAcc = arguments.length >= 3;
    if (hasAcc && xs.reduce) return xs.reduce(f, acc);
    if (xs.reduce) return xs.reduce(f);
    
    for (var i = 0; i < xs.length; i++) {
        if (!hasOwn$2.call(xs, i)) continue;
        if (!hasAcc) {
            acc = xs[i];
            hasAcc = true;
            continue;
        }
        acc = f(acc, xs[i], i);
    }
    return acc;
};

var json = typeof JSON !== undefined ? JSON : jsonify;

var CONTROL = '(?:' + [
    '\\|\\|', '\\&\\&', ';;', '\\|\\&', '[&;()|<>]'
].join('|') + ')';
var META = '|&;()<> \\t';
var BAREWORD = '(\\\\[\'"' + META + ']|[^\\s\'"' + META + '])+';
var SINGLE_QUOTE = '"((\\\\"|[^"])*?)"';
var DOUBLE_QUOTE = '\'((\\\\\'|[^\'])*?)\'';

var TOKEN = '';
for (var i = 0; i < 4; i++) {
    TOKEN += (Math.pow(16,8)*Math.random()).toString(16);
}

var parse_1 = function (s, env, opts) {
    var mapped = parse$2(s, env, opts);
    if (typeof env !== 'function') return mapped;
    return arrayReduce(mapped, function (acc, s) {
        if (typeof s === 'object') return acc.concat(s);
        var xs = s.split(RegExp('(' + TOKEN + '.*?' + TOKEN + ')', 'g'));
        if (xs.length === 1) return acc.concat(xs[0]);
        return acc.concat(arrayMap(arrayFilter(xs, Boolean), function (x) {
            if (RegExp('^' + TOKEN).test(x)) {
                return json.parse(x.split(TOKEN)[1]);
            }
            else return x;
        }));
    }, []);
};

function parse$2 (s, env, opts) {
    var chunker = new RegExp([
        '(' + CONTROL + ')', // control chars
        '(' + BAREWORD + '|' + SINGLE_QUOTE + '|' + DOUBLE_QUOTE + ')*'
    ].join('|'), 'g');
    var match = arrayFilter(s.match(chunker), Boolean);
    var commented = false;

    if (!match) return [];
    if (!env) env = {};
    if (!opts) opts = {};
    return arrayMap(match, function (s, j) {
        if (commented) {
            return;
        }
        if (RegExp('^' + CONTROL + '$').test(s)) {
            return { op: s };
        }

        // Hand-written scanner/parser for Bash quoting rules:
        //
        //  1. inside single quotes, all characters are printed literally.
        //  2. inside double quotes, all characters are printed literally
        //     except variables prefixed by '$' and backslashes followed by
        //     either a double quote or another backslash.
        //  3. outside of any quotes, backslashes are treated as escape
        //     characters and not printed (unless they are themselves escaped)
        //  4. quote context can switch mid-token if there is no whitespace
        //     between the two quote contexts (e.g. all'one'"token" parses as
        //     "allonetoken")
        var SQ = "'";
        var DQ = '"';
        var DS = '$';
        var BS = opts.escape || '\\';
        var quote = false;
        var esc = false;
        var out = '';
        var isGlob = false;

        for (var i = 0, len = s.length; i < len; i++) {
            var c = s.charAt(i);
            isGlob = isGlob || (!quote && (c === '*' || c === '?'));
            if (esc) {
                out += c;
                esc = false;
            }
            else if (quote) {
                if (c === quote) {
                    quote = false;
                }
                else if (quote == SQ) {
                    out += c;
                }
                else { // Double quote
                    if (c === BS) {
                        i += 1;
                        c = s.charAt(i);
                        if (c === DQ || c === BS || c === DS) {
                            out += c;
                        } else {
                            out += BS + c;
                        }
                    }
                    else if (c === DS) {
                        out += parseEnvVar();
                    }
                    else {
                        out += c;
                    }
                }
            }
            else if (c === DQ || c === SQ) {
                quote = c;
            }
            else if (RegExp('^' + CONTROL + '$').test(c)) {
                return { op: s };
            }
            else if (RegExp('^#$').test(c)) {
                commented = true;
                if (out.length){
                    return [out, { comment: s.slice(i+1) + match.slice(j+1).join(' ') }];
                }
                return [{ comment: s.slice(i+1) + match.slice(j+1).join(' ') }];
            }
            else if (c === BS) {
                esc = true;
            }
            else if (c === DS) {
                out += parseEnvVar();
            }
            else out += c;
        }

        if (isGlob) return {op: 'glob', pattern: out};

        return out;

        function parseEnvVar() {
            i += 1;
            var varend, varname;
            //debugger
            if (s.charAt(i) === '{') {
                i += 1;
                if (s.charAt(i) === '}') {
                    throw new Error("Bad substitution: " + s.substr(i - 2, 3));
                }
                varend = s.indexOf('}', i);
                if (varend < 0) {
                    throw new Error("Bad substitution: " + s.substr(i));
                }
                varname = s.substr(i, varend - i);
                i = varend;
            }
            else if (/[*@#?$!_\-]/.test(s.charAt(i))) {
                varname = s.charAt(i);
                i += 1;
            }
            else {
                varend = s.substr(i).match(/[^\w\d_]/);
                if (!varend) {
                    varname = s.substr(i);
                    i = s.length;
                } else {
                    varname = s.substr(i, varend.index);
                    i += varend.index - 1;
                }
            }
            return getVar(null, '', varname);
        }
    })
    // finalize parsed aruments
    .reduce(function(prev, arg){
        if (arg === undefined){
            return prev;
        }
        return prev.concat(arg);
    },[]);

    function getVar (_, pre, key) {
        var r = typeof env === 'function' ? env(key) : env[key];
        if (r === undefined) r = '';

        if (typeof r === 'object') {
            return pre + TOKEN + json.stringify(r) + TOKEN;
        }
        else return pre + r;
    }
}

/**
 * The metastring is the thing that comes after the language in markdown codeblocks
 *
 * ```js this is the metastring
 * code goes here
 * ```
 */

function parseMetastring(metastring) {
  if (!metastring) {
    return {};
  }

  var argv = parse_1(metastring);

  var result = {};
  argv.forEach(function (arg) {
    if (!arg.includes("=")) {
      result.focus = arg;
    } else {
      var _arg$split = arg.split(/=(.*)/),
          _arg$split2 = slicedToArray(_arg$split, 2),
          key = _arg$split2[0],
          value = _arg$split2[1];

      result[key] = { value: value };
    }
  });
  return result;
}

function CodeSurferLayout(_ref) {
  var children = _ref.children,
      props = objectWithoutProperties(_ref, ["children"]);

  var deck = mdxDeck.useDeck();
  var steps = React__default.useMemo(getStepsFromChildren(children), [deck.index]);
  var lang = steps.length && steps[0].lang;

  return React__default.createElement(
    "div",
    {
      style: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }
    },
    React__default.createElement(CodeSurferContainer$1, { steps: steps, lang: lang })
  );
}

var getStepsFromChildren = function getStepsFromChildren(children) {
  return function () {
    var cs = React__default.Children.toArray(children);
    return cs.map(function (c) {
      if (!c.props.children || !c.props.children.props) {
        return null;
      }
      var props = c.props.children.props;

      return _extends({
        code: props.children,
        lang: props.className[0].substring("language-".length)
      }, parseMetastring(props.metastring));
    }).filter(function (x) {
      return x;
    });
  };
};

var ErrorBoundary = function (_React$Component) {
  inherits(ErrorBoundary, _React$Component);

  function ErrorBoundary(props) {
    classCallCheck(this, ErrorBoundary);

    var _this = possibleConstructorReturn(this, (ErrorBoundary.__proto__ || Object.getPrototypeOf(ErrorBoundary)).call(this, props));

    _this.state = {};
    return _this;
  }

  createClass(ErrorBoundary, [{
    key: "componentDidCatch",
    value: function componentDidCatch(error, info) {
      // console.log(error, info);
    }
  }, {
    key: "render",
    value: function render() {
      if (!this.state.error) {
        return this.props.children;
      } else if (this.state.error.element) {
        return this.state.error.element;
      } else {
        throw this.state.error;
      }
    }
  }], [{
    key: "getDerivedStateFromError",
    value: function getDerivedStateFromError(error) {
      return { error: error };
    }
  }]);
  return ErrorBoundary;
}(React__default.Component);

var codeSurferLayout = (function (props) {
  return React__default.createElement(
    ErrorBoundary,
    null,
    React__default.createElement(CodeSurferLayout, props)
  );
});

exports.CodeSurferLayout = codeSurferLayout;
//# sourceMappingURL=index.js.map
