src2web:
	@gulp src2web

test: test_api test_jslexer test_jsparser test_jscontext

test_api:
	@mocha tests/api.js -R spec

test_jslexer:
	@mocha tests/jslexer.js -R spec

test_jsparser:
	@mocha tests/jsparser.js -R spec

test_jscontext:
	@mocha tests/jscontext.js -R spec

coveralls:
	@mocha tests/api.js tests/jslexer.js tests/jsparser.js tests/jscontext.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js