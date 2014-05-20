# A lexer&parser by Javascript

[![NPM version](https://badge.fury.io/js/homunculus.png)](https://npmjs.org/package/homunculus)
[![Build Status](https://travis-ci.org/army8735/homunculus.svg?branch=master)](https://travis-ci.org/army8735/homunculus)
[![Coverage Status](https://coveralls.io/repos/army8735/homunculus/badge.png)](https://coveralls.io/r/army8735/homunculus)
[![Dependency Status](https://david-dm.org/army8735/homunculus.png)](https://david-dm.org/army8735/homunculus)

## INSTALL
```
npm install homunculus
```

## API
* getClass(type:String, lan:String):class
 * tyep: lexer parser node context token
 * lan: js javascript es ecmascript as actionscript css
* getLexer(lan:String):object
 * lan: js javascript es ecmascript as actionscript css java c++ cpp cplusplus
* getParser(lan:String):object
 * lan: js javascript es ecmascript css
* getContext(lan:String):object
 * lan: js javascript es ecmascript

## AST
当调用语法分析器解析后，会返回生成ast，这是一个树状数据结构，每个节点都是对应语法解析器下地Node.js的实例。<br/>
demo目录下是一个用js的parser分析输入js代码并画出ast形状的页面。