define(function(require, exports, module) {
  var Rule = require('./Rule');
  var LineSearch = require('../match/LineSearch');
  var LineParse = require('../match/LineParse');
  var CompleteEqual = require('../match/CompleteEqual');
  var CharacterSet = require('../match/CharacterSet');
  var RegMatch = require('../match/RegMatch');
  var Token = require('../Token');
  var character = require('../../util/character');
  var CssRule = Rule.extend(function() {
    var self = this;
    Rule.call(self, CssRule.KEYWORDS);
  
    self.vl = {};
    CssRule.VALUES.forEach(function(o) {
      self.vl[o] = true;
    });
  
    self.cl = {};
    CssRule.COLORS.forEach(function(o) {
      self.cl[o] = true;
    });
  
    self.addMatch(new CompleteEqual(Token.BLANK, character.BLANK));
    self.addMatch(new CompleteEqual(Token.TAB, character.TAB));
    self.addMatch(new CompleteEqual(Token.LINE, character.ENTER + character.LINE));
    self.addMatch(new CompleteEqual(Token.LINE, character.ENTER));
    self.addMatch(new CompleteEqual(Token.LINE, character.LINE));
  
    self.addMatch(new LineSearch(Token.COMMENT, '//', [character.ENTER + character.LINE, character.ENTER, character.LINE]));
    self.addMatch(new LineSearch(Token.COMMENT, '/*', '*/', true));
    self.addMatch(new LineParse(Token.STRING, '"', '"', false));
    self.addMatch(new LineParse(Token.STRING, "'", "'", false));
  
    self.addMatch(new RegMatch(Token.NUMBER, /^-?\d+\.?\d*/i));
    self.addMatch(new RegMatch(Token.NUMBER, /^\.\d+/i));
    ['%', 'em', 'px', 'rem', 'ex', 'ch', 'vw', 'vh', 'vm', 'cm', 'mm', 'in', 'pt', 'pc', 's', 'ms', 'Hz', 'kHz', 'fr', 'gr', 'dpi', 'dppx', 'deg', 'grad', 'rad', 'turn'].forEach(function(o) {
      self.addMatch(new CompleteEqual(Token.UNITS, o, null, true));
    });
  
    self.addMatch(new CompleteEqual(Token.HACK, '\\9\\0'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\0/'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\0'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\9'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\,'));
    self.addMatch(new CompleteEqual(Token.HACK, '!ie'));
    self.addMatch(new CompleteEqual(Token.HACK, '-moz-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-webkit-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-ms-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-o-'), null, true);
  
    self.addMatch(new RegMatch(Token.NUMBER, /^#[\da-f]{3,6}/i));
    self.addMatch(new RegMatch(Token.SELECTOR, /^\.[a-z_][\w_\-]*/i));
    self.addMatch(new RegMatch(Token.SELECTOR, /^#\w[\w\-]*/i));
    self.addMatch(new RegMatch(Token.VARS, /^var-[\w\-]+/i));
    self.addMatch(new CompleteEqual(Token.KEYWORD, 'min--moz-device-pixel-ratio'));
    self.addMatch(new CompleteEqual(Token.KEYWORD, 'max--moz-device-pixel-ratio'));
    self.addMatch(new RegMatch(Token.ID, /^[a-z]\w*(?:[.\-]\w+)*/i));
    self.addMatch(new RegMatch(Token.STRING, /^(\\[a-z\d]{4})+/i));
    self.addMatch(new CompleteEqual(Token.IMPORTANT, '!important', null, true));
    self.addMatch(new RegMatch(Token.PSEUDO, /^::?(?:-(?:moz|webkit|ms|o)-)?[a-z]+(?:-[a-z]+)*(?:\(:?[\[\]+*\w\-]+\))?/i));
    ['$=', '|=', '*=', '~=', '^='].forEach(function(o) {
      self.addMatch(new CompleteEqual(Token.SIGN, o));
    });
    self.addMatch(new CharacterSet(Token.SIGN, '&{},:();-{}>+/[]=~*_'));
  
    var head = new RegMatch(Token.HEAD, /^@[\w-]+/);
    head.callback = function(token) {
      var s = token.content().toLowerCase();
      s = s.replace(/^@(-moz-|-o-|-ms-|-webkit-)/, '@');
      if(!{
        '@page': true,
        '@import': true,
        '@charset': true,
        '@media': true,
        '@font-face': true,
        '@keyframes': true,
        '@namespace': true,
        '@document': true
      }.hasOwnProperty(s)) {
        token.type(Token.VARS);
      }
    };
    self.addMatch(head);
  
    self.addMatch(new RegMatch(Token.VARS, /^@\{[\w-]+\}/));
    self.addMatch(new RegMatch(Token.VARS, /^\$[\w-]+/));
    self.addMatch(new RegMatch(Token.VARS, /^\$\{[\w-]+\}/));
  }).methods({
    values: function() {
      return this.vl;
    },
    colors: function() {
      return this.cl;
    }
  }).statics({
    KEYWORDS: 'animation animation-name animation-duration animation-fill-mode animation-iteration-count  animation-timing-function appearance ascent aspect-ratio autohiding-scrollbar azimuth backface-visibility background background-attachment background-clip background-color background-image background-origin background-position background-repeat background-size baseline bbox border border-bottom border-bottom-color border-bottom-left-radius border-bottom-right-radius border-bottom-style border-bottom-width border-collapse border-color border-image border-left border-left-color border-left-style border-left-width border-radius border-right border-right-color border-right-style border-right-width border-spacing border-style border-top border-top-color border-top-left-radius border-top-right-radius border-top-style border-top-width border-width bottom box-shadow box-sizing cap-height caption-side centerline clear clip color color-index content counter-increment counter-reset cue cue-after cue-before cursor definition-src descent device-aspect-ratio device-height device-width direction display elevation empty-cells filter float focus-ring-color font font-family font-size font-size-adjust font-smoothing font-stretch font-style font-variant font-weight grid height interpolation-mode left letter-spacing line-height list-style list-style-image list-style-position list-style-type margin margin-bottom margin-left margin-right margin-top marker-offset marks mathline max-aspect-ratio max-device-pixel-ratio max-device-width max-height max-resolution max-width min-aspect-ratio min-device-pixel-ratio min-device-width min-height min-resolution min-width monochrome nav-down nav-left nav-right nav-up opacity orientation orphans osx-font-smoothing outline outline-color outline-offset outline-style outline-width overflow overflow-scrolling overflow-style overflow-x overflow-y padding padding-bottom padding-left padding-right padding-top page page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during pointer-events position quotes resize resolution richness right scan size slope speak speak-header speak-numeral speak-punctuation speech-rate src stemh stemv stress table-layout touch-action tap-highlight-color text-align text-decoration text-indent text-justify text-overflow text-rendering text-shadow text-size-adjust text-transform top top transform transform-origin transition transition-duration transition-property unicode-bidi unicode-range units-per-em user-select vertical-align visibility voice-family volume white-space widows width widths word-break word-spacing word-wrap x-height z-index zoom'.split(' '),
    VALUES: 'above absolute all alpha always and antialiased aqua armenian attr aural auto avoid background baseline behind below bicubic bidi-override black blink block blue bold bolder border-box both bottom braille break-all break-word cal capitalize caption center center-left center-right circle close-quote code collapse color compact condensed contain content-box continuous counter counters cover crop cross crosshair cursive dashed decimal decimal-leading-zero default digits disabled disc dotted double e-resize ease ease-in ease-in-out ease-out embed embossed enabled expanded extra-condensed extra-expanded false fantasy far-left far-right fast faster fixed flipouttobottom flipouttoleft flipouttoright flipouttotop format fuchsia gray grayscale green groove handheld hebrew help hidden hide high higher hsl hsla icon inherit infinite inline inline-table inset inside inter-ideograph invert italic justify landscape large larger left-side leftwards level lighter lime line-through linear linear-gradient list-item local loud low lower lower-alpha lower-greek lower-latin lower-roman lowercase ltr marker maroon medium message-box middle mix move n-resize narrower navy ne-resize no-close-quote no-open-quote no-repeat none normal not nowrap nw-resize oblique olive once only opacity open-quote outset outside overline padding-box pointer portrait pre print projection purple red relative repeat repeat-x repeat-y rgb rgba ridge right right-side rightwards rotate rotateX rotateY rtl run-in s-resize scale screen scroll se-resize semi-condensed semi-expanded separate show silent silver slow slower small small-caps small-caption smaller soft solid speech spell-out square static status-bar sub super sw-resize table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row table-row-group teal text text-bottom text-top thick thin top translate transparent true tty tv ultra-condensed ultra-expanded underline upper-alpha upper-latin upper-roman uppercase url var visible w-resize wait white wider width x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow'.split(' '),
    COLORS: 'activeborder aliceblue antiquewhite appworkspace aqua aqua aquamarine azure beige bisque black black blanchedalmond blue blue blueviolet brown burlywood buttonface buttonshadow cadetblue captiontext chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia fuchsia gainsboro ghostwhite gold goldenrod gray gray green green greenyellow grey highlight honeydew hotpink inactiveborder inactivecaptiontext indianred indigo infotext ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime lime limegreen linen magenta maroon maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred menutext midnightblue mintcream mistyrose moccasin navajowhite navy navy oldlace olive olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple purple red red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal teal thistle threeddarkshadow threedhighlight threedshadow tomato turquoise violet wheat white white whitesmoke windowframe yellow yellow yellowgreen'.split(' ')
  });
  module.exports = CssRule;
});