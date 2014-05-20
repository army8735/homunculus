src2web:
	@gulp

test: src2web test-api test-jslexer test-jsparser test-jscontext

test-api:
	@mocha tests/api.js -R spec

test-jslexer:
	@mocha tests/jslexer.js -R spec

test-jsparser:
	@mocha tests/jsparser.js -R spec

test-jscontext:
	@mocha tests/jscontext.js -R spec

coveralls:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js --require blanket -R html-cov > tests/covrage.html