var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token');
var Parser = homunculus.getClass('parser', 'css');
var CssNode = homunculus.getClass('node', 'css');

var res;
var index;

function jion(node, ignore) {
  res = '';
  index = 0;
  while(ignore[index]) {
    res += ignore[index++].content();
  }
  recursion(node, ignore);
  return res;
}
function recursion(node, ignore) {
  var isToken = node.name() == CssNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      res += token.content();
      while(ignore[++index]) {
        res += ignore[index].content();
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf, i) {
      recursion(leaf, ignore);
    });
  }
}

function tree(node, arr) {
  arr = arr || [];
  var isToken = node.name() == CssNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      arr.push(token.content());
    }
  }
  else {
    arr.push(node.name());
    var childs = [];
    arr.push(childs);
    node.leaves().forEach(function(leaf, i) {
      tree(leaf, childs);
    });
  }
  return arr;
}

describe('cssparser', function() {
  describe('keyword test', function() {
    var KEYWORDS = 'appearance ascent aspect-ratio azimuth backface-visibility background-attachment background-clip background-color background-image background-origin background-position background-repeat background-size background baseline bbox border-collapse border-color border-image border-radius border-spacing border-style border-top border-right border-bottom border-left border-top-color border-right-color border-bottom-color border-left-color border-top-style border-right-style border-bottom-style border-left-style border-top-width border-right-width border-bottom-width border-left-width border-width border-top-left-radius border-bottom-left-radius border-top-right-radius border-bottom-right-radius border bottom box-shadow box-sizing cap-height caption-side centerline clear clip color color-index content counter-increment counter-reset cue-after cue-before cue cursor definition-src descent device-aspect-ratio device-height device-width direction display elevation empty-cells filter float font-size-adjust font-smoothing font-family font-size font-stretch font-style font-variant font-weight font grid height interpolation-mode left letter-spacing line-height list-style-image list-style-position list-style-type list-style margin-top margin-right margin-bottom margin-left margin marker-offset marks mathline max-aspect-ratio max-device-pixel-ratio max-device-width max-height max-resolution max-width min-aspect-ratio min-device-pixel-ratio min-device-width min-height min-resolution min-width monochrome nav-down nav-left nav-right nav-up opacity orphans outline-color outline-style outline-width orientation outline overflow-x overflow-y overflow padding-top padding-right padding-bottom padding-left padding page page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during position quotes resize resolution right richness scan size slope src speak-header speak-numeral speak-punctuation speak speech-rate stemh stemv stress table-layout text-align top text-decoration text-indent text-justify text-overflow text-shadow text-transform transform transform-origin transition transition-property unicode-bidi unicode-range units-per-em vertical-align visibility voice-family volume white-space widows width widths word-break word-spacing word-wrap x-height z-index zoom'.split(' ');
    var VALUES = 'above absolute all alpha always and antialiased aqua armenian attr aural auto avoid background baseline behind below bicubic bidi-override black blink block blue bold bolder border-box both bottom break-all break-word braille cal capitalize caption center center-left center-right circle close-quote code collapse color compact condensed contain content-box continuous counter counters cover crop cross crosshair cursive dashed decimal decimal-leading-zero default digits disc dotted double ease ease-in ease-out ease-in-out embed embossed e-resize expanded extra-condensed extra-expanded fantasy far-left far-right fast faster fixed flipouttoleft flipouttoright flipouttotop flipouttobottom format fuchsia gray grayscale green groove handheld hebrew help hidden hide high higher hsl hsla icon inline-table inline inset inside inter-ideograph invert italic justify landscape large larger left-side leftwards level lighter lime linear-gradient linear line-through list-item local loud lower-alpha lowercase lower-greek lower-latin lower-roman lower low ltr marker maroon medium message-box middle mix move narrower navy ne-resize not no-close-quote none no-open-quote no-repeat normal nowrap n-resize nw-resize oblique olive once only opacity open-quote outset outside overline padding-box pointer portrait pre print projection purple red relative repeat repeat-x repeat-y rgb rgba ridge right right-side rightwards rotate rotateX rotateY rtl run-in scale screen scroll semi-condensed semi-expanded separate se-resize show silent silver slower slow small small-caps small-caption smaller soft solid speech spell-out square s-resize static status-bar sub super sw-resize table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row table-row-group teal text-bottom text-top text thick thin top transparent translate tty tv ultra-condensed ultra-expanded underline upper-alpha uppercase upper-latin upper-roman url visible wait white wider width w-resize var x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow'.split(' ');
    var COLORS = 'black silver gray white maroon red purple fuchsia green lime olive yellow navy blue teal aqua activeborder appworkspace buttonface buttonshadow captiontext highlight inactiveborder inactivecaptiontext infotext menutext threeddarkshadow threedhighlight threedshadow windowframe aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' ');
    var parser = homunculus.getParser('css');
    it('kw', function() {
      KEYWORDS.forEach(function(k) {
        expect(parser.lexer.rule.keyWords().hasOwnProperty(k)).to.be.ok();
      });
    });
    it('value', function() {
      VALUES.forEach(function(k) {
        expect(parser.lexer.rule.values().hasOwnProperty(k)).to.be.ok();
      });
    });
    it('color', function() {
      COLORS.forEach(function(k) {
        expect(parser.lexer.rule.colors().hasOwnProperty(k)).to.be.ok();
      });
    });
  });
  describe('simple test', function() {
    it('@import string', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import "a";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["\"a\""],";"]]]);
    });
    it('@import ignore case', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@IMPORT "a";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@IMPORT",CssNode.URL,["\"a\""],";"]]]);
    });
    it('@import url(string)', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import url("a");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["url","(","\"a\"",")"],";"]]]);
    });
    it('@import url(string) no quote', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import url(a);');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["url","(","a",")"],";"]]]);
    });
    it('@import error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@import');
      }).to.throwError();
    });
    it('@import string no ; error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@import url(a)');
      }).to.throwError();
    });
    it('@import string with \' error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@import \'a\';');
      }).to.throwError();
    });
    it('@media query type', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media all');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"]]]]]]);
    });
    it('@media query expr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media (width:100)');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.EXPR,["(",CssNode.KEY,["width"],":",CssNode.VALUE,["100"],")"]]]]]]);
    });
    it('@media query{}', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media all{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@media query and', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media not all and(width:800px)');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,["not",CssNode.MEDIATYPE,["all"],"and",CssNode.EXPR,["(",CssNode.KEY,["width"],":",CssNode.VALUE,["800","px"],")"]]]]]]);
    });
    it('@media multi query', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media only screen and (-webkit-min-device-pixel-ratio: 2), screen and (min--moz-device-pixel-ratio: 2){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,["only",CssNode.MEDIATYPE,["screen"],"and",CssNode.EXPR,["(",CssNode.KEY,["-webkit-","min-device-pixel-ratio"],":",CssNode.VALUE,["2"],")"]],",",CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["screen"],"and",CssNode.EXPR,["(",CssNode.KEY,["min--moz-device-pixel-ratio"],":",CssNode.VALUE,["2"],")"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@media hack 1', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media screen\\9');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["screen","\\9"]]]]]]);
    });
    it('@media hack 2', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media \\0screen\\,screen\\9');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["\\0","screen","\\,","screen","\\9"]]]]]]);
    });
    it('@media error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media');
      }).to.throwError();
    });
    it('@media error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media(');
      }).to.throwError();
    });
    it('@media error 3', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media (notkeyword:1)');
      }).to.throwError();
    });
    it('@charset string', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@charset "arail";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.CHARSET,["@charset","\"arail\"",";"]]]);
    });
    it('@charset error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@charset');
      }).to.throwError();
    });
    it('@charset error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@charset "arial"');
      }).to.throwError();
    });
    it('@font-face normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(http://domain/fonts/MSYH.TTF)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,["url","(","http://domain/fonts/MSYH.TTF",")"]],"}"]]]]);
    });
    it('@font-face with format', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(xx),format("embedded-opentype")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,["url","(","xx",")",",","format","(","\"embedded-opentype\"",")"]],"}"]]]]);
    });
    it('@font-face mulit', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(a),url(b)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,["url","(","a",")",",","url","(","b",")"]],"}"]]]]);
    });
    it('@charset error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@font-face');
      }).to.throwError();
    });
    it('@charset error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@font-face{}');
      }).to.throwError();
    });
    it('@charset error 3', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@font-face{src:url(a)}');
      }).to.throwError();
    });
    it('@page normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@page thin:first{size:3in 8in}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.PAGE,["@page","thin",":first",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["size"],":",CssNode.VALUE,["3","in","8","in"]],"}"]]]]);
    });
    it('@page without id', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@page :first{size:3in 8in}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.PAGE,["@page",":first",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["size"],":",CssNode.VALUE,["3","in","8","in"]],"}"]]]]);
    });
    it('@page error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@page thin:first');
      }).to.throwError();
    });
    it('@page error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@page {}');
      }).to.throwError();
    });
    it('@keyframes normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@keyframes from to', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{from{transform:translate(0,0)}to{transform:translate(100,20)}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["from"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["transform"],":",CssNode.VALUE,["translate","(","0",",","0",")"]],"}"]],CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["to"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["transform"],":",CssNode.VALUE,["translate","(","100",",","20",")"]],"}"]],"}"]]]]);
    });
    it('@keyframes percent', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{10%{width:0}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["10","%"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["0"]],"}"]],"}"]]]]);
    });
    it('@keyframes error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@keyframes {}');
      }).to.throwError();
    });
    it('@keyframes error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@keyframes a');
      }).to.throwError();
    });
    it('@namespace normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@namespace a "url";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.NAMESPACE,["@namespace","a","\"url\"",";"]]]);
    });
    it('@namespace without id', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@namespace "url";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.NAMESPACE,["@namespace","\"url\"",";"]]]);
    });
    it('@namespace error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@namespace');
      }).to.throwError();
    });
    it('@namespace error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@keyframes {}');
      }).to.throwError();
    });
  });
});