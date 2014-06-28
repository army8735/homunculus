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
    self.addMatch(new CompleteEqual(Token.UNITS, '%', null, true));
  
    self.addMatch(new CompleteEqual(Token.HACK, '\\9\\0'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\0/'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\0'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\9'));
    self.addMatch(new CompleteEqual(Token.HACK, '\\,'));
    self.addMatch(new CompleteEqual(Token.HACK, '!ie'));
    self.addMatch(new CompleteEqual(Token.HACK, '-vx-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-hp-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-khtml-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, 'mso-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-prince-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-rim-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-ro-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-tc-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-wap-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-apple-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-atsc-'), null, true);
    self.addMatch(new CompleteEqual(Token.HACK, '-ah-'), null, true);
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
      s = s.replace(/^@(-moz-|-o-|-ms-|-webkit-|-vx-|-hp-|-khtml-|mso-|-prince-|-rim-|-ro-|-tc-|-wap-|-apple-|-atsc-|-ah-)/, '@');
      if(!{
        '@page': true,
        '@import': true,
        '@charset': true,
        '@media': true,
        '@font-face': true,
        '@keyframes': true,
        '@namespace': true,
        '@document': true,
        '@counter-style': true,
        '@viewport': true,
        '@supports': true,
        '@region': true,
        '@navigation': true,
        '@footnote': true,
        '@layout': true,
        '@top': true,
        '@top-left': true,
        '@top-center': true,
        '@top-right': true
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
    KEYWORDS: '-replace -set-link-source -use-link-source accelerator additive-symbols align-content align-items align-self alignment-adjust alignment-baseline anchor-point animation animation-delay animation-duration animation-fill-mode animation-iteration-count animation-name animation-play-state animation-timing-function app-region appearance ascent aspect-ratio autohiding-scrollbar azimuth backface-visibility background background-attachment background-clip background-color background-image background-origin background-origin-x background-origin-y background-position background-position-x background-position-y background-repeat background-size baseline baseline-shift behavior binding blend-mode block-progression bookmark-label bookmark-level bookmark-state bookmark-target border border-after border-after-color border-after-style border-after-width border-before border-before-color border-before-style border-before-width border-bottom border-bottom-color border-bottom-colors border-bottom-left-radius border-bottom-right-radius border-bottom-style border-bottom-width border-clip-bottom border-clip-left border-clip-right border-clip-top border-collapse border-color border-fit border-horizontal-spacing border-image border-image-outset border-image-repeat border-image-slice border-image-source border-image-width border-left border-left-color border-left-colors border-left-style border-left-width border-radius border-radius-bottomleft border-radius-bottomright border-radius-topleft border-radius-topright border-right border-right-color border-right-colors border-right-style border-right-width border-spacing border-start border-start-color border-start-style border-start-width border-style border-top border-top-color border-top-colors border-top-left-radius border-top-right-radius border-top-style border-top-width border-vertical-spacing border-width bottom box box-align box-decoration-break box-direction box-flex box-flex-group box-lines box-ordinal-group box-orient box-pack box-reflect box-shadow box-sizing box-snap break-after break-before break-inside cap-height caption-side centerline chains clear clip clip-path clip-rule color color-correction color-index color-profile column-axis column-break-after column-break-before column-break-inside column-count column-fill column-gap column-progression column-rule column-rule-color column-rule-style column-rule-width column-span column-width columns content content-zoom-chaining content-zoom-limit content-zoom-limit-max content-zoom-limit-min content-zoom-snap content-zoom-snap-points content-zoom-snap-type content-zooming counter-increment counter-reset cue cue-after cue-before cursor dashboard-region definition-src descent device-aspect-ratio device-height device-width direction display display-box display-extras display-inside display-outside dominant-baseline drop-initial-after-adjust drop-initial-after-align drop-initial-before-adjust drop-initial-before-align drop-initial-size drop-initial-value elevation empty-cells fallback fill fill-opacity fill-rule filter fit fit-position flavor flex flex-basis flex-direction flex-flow flex-grow flex-pack flex-shrink flex-wrap float float-edge float-offset flood-color flood-opacity flow-from flow-into focus-ring-color font font-color font-emphasize font-emphasize-position font-emphasize-style font-family font-feature-settings font-kerning font-language-override font-size font-size-adjust font-size-delta font-smooth font-smoothing font-stretch font-style font-synthesis font-variant font-variant-alternates font-variant-caps font-variant-east-asian font-variant-ligatures font-variant-numeric font-variant-position font-weight footnote force-broken-image-icon glyph-orientation-horizontal glyph-orientation-vertical grid grid-area grid-auto-columns grid-auto-flow grid-auto-rows grid-column grid-column-align grid-column-position grid-column-span grid-columns grid-definition-columns grid-definition-rows grid-position grid-row grid-row-align grid-row-position grid-row-span grid-rows grid-span grid-template hanging-punctuation height high-contrast high-contrast-adjust highlight horiz-align hyphenate-character hyphenate-limit-after hyphenate-limit-before hyphenate-limit-chars hyphenate-limit-last hyphenate-limit-lines hyphenate-limit-zone hyphenate-resource hyphens icon image-orientation image-rendering image-resolution images-in-menus ime-mode include-source inherit initial inline-box-align inline-flex inline-table input-format input-required interpolation-mode interpret-as justify-content justify-items justify-self kerning languages layer-background-color layer-background-image layout-flow layout-grid layout-grid-char layout-grid-char-spacing layout-grid-line layout-grid-mode layout-grid-type left letter-spacing lighting-color line-align line-box-contain line-break line-clamp line-grid line-height line-slack line-snap line-stacking line-stacking-ruby line-stacking-shift line-stacking-strategy linear-gradient link link-source list-image-1 list-image-2 list-image-3 list-style list-style-image list-style-position list-style-type locale logical-height logical-width mac-graphite-theme maemo-classic margin margin-after margin-after-collapse margin-before margin-before-collapse margin-bottom margin-bottom-collapse margin-collapse margin-end margin-left margin-right margin-start margin-top margin-top-collapse marker marker-end marker-mid marker-offset marker-start marks marquee marquee-dir marquee-direction marquee-increment marquee-loop marquee-play-count marquee-repetition marquee-speed marquee-style mask mask-attachment mask-box-image mask-box-image-outset mask-box-image-repeat mask-box-image-slice mask-box-image-source mask-box-image-width mask-clip mask-composite mask-image mask-origin mask-position mask-position-x mask-position-y mask-repeat mask-repeat-x mask-repeat-y mask-size mask-type match-nearest-mail-blockquote-color mathline max-aspect-ratio max-color max-color-index max-device-aspect-ratio max-device-height max-device-pixel-ratio max-device-width max-height max-logical-height max-logical-width max-monochrome max-resolution max-width max-zoom min-aspect-ratio min-color min-color-index min-device-aspect-ratio min-device-height min-device-pixel-ratio min-device-width min-height min-logical-height min-logical-width min-monochrome min-resolution min-width min-zoom mini-fold monochrome move-to nav-banner-image nav-bottom nav-down nav-down-shift nav-index nav-left nav-left-shift nav-right nav-right-shift nav-up nav-up-shift navbutton-* nbsp-mode negative none normal object-fit object-position oeb-column-number oeb-page-foot oeb-page-head opacity order orient orientation orphans osx-font-smoothing outline outline-color outline-offset outline-radius outline-radius-bottomleft outline-radius-bottomright outline-radius-topleft outline-radius-topright outline-style outline-width overflow overflow-scrolling overflow-style overflow-x overflow-y pad padding padding-bottom padding-left padding-right padding-top page page-break-after page-break-before page-break-inside page-policy panose-1 pause pause-after pause-before perspective perspective-origin perspective-origin-x perspective-origin-y phonemes pitch pitch-range play-during pointer-events position prefix presentation-level print-color-adjust progress-appearance property-name punctuation-trim punctuation-wrap quotes radial-gradient range region-break-after region-break-before region-break-inside region-overflow rendering-intent replace resize resolution rest rest-after rest-before richness right rotation-point row-span rtl-ordering ruby-align ruby-overhang ruby-position ruby-span scan script-level script-min-size script-size-multiplier scroll-chaining scroll-limit scroll-limit-x-max scroll-limit-x-min scroll-limit-y-max scroll-limit-y-min scroll-rails scroll-snap-points-x scroll-snap-points-y scroll-snap-type scroll-snap-x scroll-snap-y scroll-translation scrollbar-3d-light-color scrollbar-3dlight-color scrollbar-arrow-color scrollbar-base-color scrollbar-dark-shadow-color scrollbar-darkshadow-color scrollbar-end-backward scrollbar-end-forward scrollbar-face-color scrollbar-highlight-color scrollbar-shadow-color scrollbar-start-backward scrollbar-start-forward scrollbar-thumb-proportional scrollbar-track-color separator-image set-link-source shape-image-threshold shape-inside shape-margin shape-outside shape-padding shape-rendering size slope speak speak-as speak-header speak-numeral speak-punctuation speech-rate src stack-sizing stemh stemv stop-color stop-opacity stress string-set stroke stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width suffix svg-shadow symbols system tab-size tab-stops table-baseline table-border-color-dark table-border-color-light table-layout tap-highlight-color target target-name target-new target-position text-align text-align-last text-anchor text-autospace text-blink text-combine text-combine-horizontal text-decoration text-decoration-color text-decoration-line text-decoration-skip text-decoration-style text-decorations-in-effect text-effect text-emphasis text-emphasis-color text-emphasis-position text-emphasis-skip text-emphasis-style text-fill-color text-fit text-height text-indent text-justify text-justify-trim text-kashida text-kashida-space text-line-through text-orientation text-outline text-overflow text-rendering text-security text-shadow text-size-adjust text-space-collapse text-spacing text-stroke text-stroke-color text-stroke-width text-transform text-trim text-underline text-underline-color text-underline-position text-underline-style text-wrap top top-bar-button touch-action touch-callout touch-enabled transform transform-origin transform-origin-x transform-origin-y transform-origin-z transform-style transition transition-delay transition-duration transition-property transition-repeat-count transition-timing-function unicode-bidi unicode-range units-per-em use-link-source user-drag user-focus user-input user-modify user-select user-zoom vector-effect version vertical-align viewport visibility voice-balance voice-duration voice-family voice-pitch voice-pitch-range voice-range voice-rate voice-stress voice-volume volume white-space widows width widths window-shadow windows-classic windows-compositor windows-default-theme word-break word-spacing word-wrap wrap wrap-flow wrap-margin wrap-padding wrap-through writing-mode x-height z-index zoom'.split(' '),
    VALUES: 'above absolute additive all alpha alphabetic always and antialiased aqua armenian attr aural auto avoid background baseline behind below bicubic bidi-override black blink block blue bold bolder border-box both bottom braille break-all break-word calc canvas capitalize caption center center-left center-right circle cjk-decimal cjk-ideographic close-quote code collapse color compact condensed contain content-box continuous counter counters cover crop cross cross-fade crosshair cubic-bezier cursive cycle cyclic dashed decimal decimal-leading-zero default device-cmyk digits disabled disc disclosure-closed disclosure-open dotted double e-resize ease ease-in ease-in-out ease-out element embed embossed enabled expanded extra-condensed extra-expanded false fantasy far-left far-right fast faster fixed flipouttobottom flipouttoleft flipouttoright flipouttotop format fuchsia georgian gray grayscale green groove handheld hebrew help hidden hide high higher hiragana hiragana-iroha hsl hsla icon image image-rect image-region infinite inherit inline inline-table inset inside inter-ideograph invert italic japanese-formal japanese-informal justify katakana katakana-iroha korean-hangul-formal korean-hanja-formal korean-hanja-informal landscape large larger leader left-side leftwards level lighter lime line-through linear linear-gradient list-item local loud low lower lower-alpha lower-greek lower-latin lower-roman lowercase ltr marker maroon medium message-box middle minmax mix move n-resize narrower navy ne-resize no-close-quote no-open-quote no-repeat none normal not nowrap numeric nw-resize oblique olive once only opacity open-quote outset outside overline padding-box pending perspective pointer portrait pre print projection purple rebeccapurple rect red relative repeat repeat-x repeat-y repeating-linear-gradient repeating-radial-gradient rgb rgba ridge right right-side rightwards rotate rotate3d rotateX rotateY rotateZ round rounddown roundup rtl run-in running s-resize scale scale3D scaleX scaleY scaleZ screen scroll se-resize semi-condensed semi-expanded separate show silent silver simp-chinese-formal simp-chinese-informal skew skew3D skewX skewY skewZ slow slower small small-caps small-caption smaller soft solid space speech spell-out square static status-bar steps string sub super sw-resize symbolic symbols table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row table-row-group target-counter target-counters target-pull target-text teal text text-bottom text-top thick thin toggle top trad-chinese-formal trad-chinese-informal translate translate3d translateX translateY translateZ transparent true tty tv ultra-condensed ultra-expanded underline upper-alpha upper-latin upper-roman uppercase url var visible w-resize wait white wider width x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow'.split(' '),
    COLORS: 'activeborder aliceblue antiquewhite appworkspace aqua aqua aquamarine azure beige bisque black black blanchedalmond blue blue blueviolet brown burlywood buttonface buttonshadow cadetblue captiontext chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia fuchsia gainsboro ghostwhite gold goldenrod gray gray green green greenyellow grey highlight honeydew hotpink inactiveborder inactivecaptiontext indianred indigo infotext ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime lime limegreen linen magenta maroon maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred menutext midnightblue mintcream mistyrose moccasin navajowhite navy navy oldlace olive olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple purple red red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal teal thistle threeddarkshadow threedhighlight threedshadow tomato turquoise violet wheat white white whitesmoke windowframe yellow yellow yellowgreen'.split(' ')
  });
  module.exports = CssRule;
});