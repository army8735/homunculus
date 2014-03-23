src2web:
	@gulp src2web

test: test_api test_jslexer test_jsparser test_jscontext

test_api:
	@mocha tests/api.js

test_jslexer:
	@mocha tests/jslexer.js

test_jsparser:
	@mocha tests/jsparser.js

test_jscontext:
	@mocha tests/jscontext.js