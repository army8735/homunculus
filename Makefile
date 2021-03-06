web:
	@gulp

test: web test-api test-js test-jscontext test-es6parser test-css test-html test-jsx test-csx

test-js: test-jslexer test-jsparser
test-es6: test-jslexer test-es6parser
test-css: test-csslexer test-cssparser
test-html: test-htmllexer test-htmlparser
test-jsx: test-jsxlexer test-jsxlexer2 test-jsxparser test-jsxparser2
test-csx: test-csxlexer test-csxlexer2 test-csxparser test-csxparser2
test-axml: test-axmllexer test-axmlparser

test-api:
	@mocha tests/api.js -R spec

test-jslexer:
	@mocha tests/jslexer.js -R spec

test-jsparser:
	@mocha tests/jsparser.js -R spec

test-jscontext:
	@mocha tests/jscontext.js -R spec

test-es6parser:
	@mocha tests/es6parser.js -R spec

test-csslexer:
	@mocha tests/csslexer.js -R spec

test-cssparser:
	@mocha tests/cssparser.js -R spec

test-htmllexer:
	@mocha tests/htmllexer.js -R spec

test-htmlparser:
	@mocha tests/htmlparser.js -R spec

test-jsxlexer:
	@mocha tests/jsxlexer.js -R spec

test-jsxlexer2:
	@mocha tests/jsxlexer2.js -R spec

test-jsxparser:
	@mocha tests/jsxparser.js -R spec

test-jsxparser2:
	@mocha tests/jsxparser2.js -R spec

test-csxlexer:
	@mocha tests/csxlexer.js -R spec

test-csxlexer2:
	@mocha tests/csxlexer2.js -R spec

test-csxparser:
	@mocha tests/csxparser.js -R spec

test-csxparser2:
	@mocha tests/csxparser2.js -R spec

test-axmllexer:
	@mocha tests/axmllexer.js -R spec

test-axmlparser:
	@mocha tests/axmlparser.js -R spec

test-walk:
	@mocha tests/walk.js -R spec

coveralls:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js tests/es6parser.js tests/csslexer.js tests/cssparser.js tests/htmllexer.js tests/htmlparser.js tests/jsxlexer.js tests/jsxlexer2.js tests/jsxparser.js tests/jsxparser2 tests/walk.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js tests/es6parser.js tests/csslexer.js tests/cssparser.js tests/htmllexer.js tests/htmlparser.js tests/jsxlexer.js tests/jsxlexer2.js tests/jsxparser.js tests/jsxparser2 tests/walk.js --require blanket -R html-cov > tests/covrage.html
