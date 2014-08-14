web:
	@gulp

test: web test-api test-js test-jscontext test-es6parser test-css test-html

test-js: test-jslexer test-jsparser
test-es6: test-jslexer test-es6parser
test-css: test-csslexer test-cssparser
test-html: test-htmllexer test-htmlparser

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

coveralls:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js tests/es6parser.js tests/csslexer.js tests/cssparser.js tests/htmllexer.js tests/htmlparser.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js tests/es6parser.js tests/csslexer.js tests/cssparser.js tests/htmllexer.js tests/htmlparser.js --require blanket -R html-cov > tests/covrage.html