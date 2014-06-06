# A lexer&parser by Javascript

[![NPM version](https://badge.fury.io/js/homunculus.png)](https://npmjs.org/package/homunculus)
[![Build Status](https://travis-ci.org/army8735/homunculus.svg?branch=master)](https://travis-ci.org/army8735/homunculus)
[![Coverage Status](https://coveralls.io/repos/army8735/homunculus/badge.png)](https://coveralls.io/r/army8735/homunculus)
[![Dependency Status](https://david-dm.org/army8735/homunculus.png)](https://david-dm.org/army8735/homunculus)

## INSTALL
```
npm install homunculus
```

## 使用说明
* 解析语法并返回语法树和此法单元序列。
* CommonJS/AMD/CMD自适应。

## API
* getClass(type:String, lan:String):class
  * type:
    * lexer 
    * parser
    * node
    * context
    * token
  * lan: 
    * js
    * javascript
    * es 
    * es5
    * ecmascript
    * es6
    * as
    * actionscript
    * css
* getLexer(lan:String):lexer/Lexer
 * lan:
   * js
   * javascript
   * es
   * es5
   * ecmascript
   * es6
   * as
   * actionscript
   * css
   * java
   * c++
   * cpp
   * cplusplus
* getParser(lan:String):parser/Parser
  * lan:
    * js
    * javascript
    * es
    * es5
    * ecmascript
    * es6
    * css
* getContext(lan:String):parser/Context
  * lan:
    * js
    * javascript
    * es
    * es5
    * ecmascript

### lexer/Lexer
#### 方法
* constructor(Rule:lexer/rule/Rule) 传入语法规则Rule
* parse(code:String):Array<lexer/Token> 传入代码并返回解析后的此法单元token列表
* tokens():Array<lexer/Token> 返回已解析好的此番单元token列表
* cache(line:init):void 设置缓冲解析行，每次最多解析几行代码，防止code过大卡死
* finish():Boolean 设置cache有用，当前是否解析完毕
* line():int code有多少行
* col():int code最大列是多少

#### 静态属性
* STRICT: 0 严格模式语法错误后抛出异常
* LOOSE: 1 宽松模式错误后忽略
* mod(type:int):int 读取/设置模式

### parser/Parser
#### 方法
* constructor(lexer:Lexer) 传入词法分析器
* parse(code:String):Node 传入代码解析并返回语法树
* ast():Node 返回已解析好的语法树
* ignore():Node 返回解析中被忽略掉的空白注释等内容

### lexer/Token
#### 方法
* constructor(type:int, content:String, val:String, sIndex:int) 构造函数传入token的类型、内容、字面内容和在代码中的开始字符索引
* type(t:int):int 读取/设置类型
* content(c:Stirng):String 读取/设置内容
* val(v:String):String 读取/设置字面内容，字面内容不同于内容之处在于是否包含引号
* tag(t:int):String 读取/设置类型，返回的是类型额字符串形式
* tid(t:int):int 读取/设置token索引，默认所有token自增形式添加索引
* sIndex(i:int):int 读取/设置token在code中的字符索引

#### 静态属性
* type(t:int):String 返回类型的字符串形式

### parser/Node
#### 方法
* constructor(type:String, children:Node/Array<Node> = null) 传入类型和子节点
* name(t:String):String 读取/设置节点类型
* leaves():Array<Node> 返回子节点列表
* leaf(i:int):Node 返回第i个子节点
* size():int 返回有几个子节点
* first():Node 返回第一个子节点
* last():Node 返回最后一个子节点
* isEmpty():Boolean 返回是否没有子节点
* add(...node:Node):void 添加若干个子节点
* token():Token 实际同leaves()一样，不过当name()为Token时children存储的是终结符Token
* parent():Node 返回父节点
* prev():Node 返回兄弟前一个节点
* next():Node 返回兄弟后一个节点

## AST
当调用语法分析器解析后，会返回生成ast，这是一个树状数据结构，每个节点都是对应语法解析器目录下的Node.js的实例。<br/>
demo目录下是一个用js的parser分析输入js代码并画出ast形状的页面。

## License
[MIT License]