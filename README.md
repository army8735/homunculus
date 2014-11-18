# A lexer&parser by Javascript

`homunculus`取自`钢之炼金术师`中的`人造人`，英语亦作`小矮人`，意指底层基石再造。

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
### Homunculus
* getClass(type:String, lan:String):class
  * type:
    * lexer 
    * parser
    * node
    * context
    * token
    * rule
    * walk
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
    * html
    * htm
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
    * html
    * htm
* getParser(lan:String):parser/Parser
  * lan:
    * js
    * javascript
    * es
    * es5
    * ecmascript
    * es6
    * css
    * html
    * htm
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
* tokens(plainObject:Boolean = false):Array<lexer/Token> 返回已解析好的此番单元token列表，如果plainObject为true则传回普通对象
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
* ast(plainObject:Boolean = false):Node 返回已解析好的语法树，如果plainObject为true则传回普通对象
* ignore():Object 返回解析中被忽略掉的空白注释等内容

### lexer/Token
#### 方法
* constructor(type:int, content:String, val:String, sIndex:int) 构造函数传入token的类型、内容、字面内容和在代码中的开始字符索引
* type(t:int):int 读取/设置类型
* content(c:Stirng):String 读取/设置内容
* val(v:String):String 读取/设置字面内容，字面内容不同于内容之处在于是否包含引号
* tag(t:int):String 读取/设置类型，返回的是类型额字符串形式
* tid(t:int):int 读取/设置token索引，默认所有token自增形式添加索引
* sIndex(i:int):int 读取/设置token在code中的字符索引
* isVirtual():Boolean 返回此token是否是虚拟不存在的

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
* isToken():Boolean 返回此节点是否是Token节点
* parent():Node 返回父节点
* prev():Node 返回兄弟前一个节点
* next():Node 返回兄弟后一个节点

### lexer/rule/Rule
#### 方法
* constructor(keyWords:Array<String>, supportPerlReg:Boolean = false) 关键字列表和是否支持perl风格的正则表达式
* addKeyWord(kw:String):Object 添加未知关键字并返回关键字hash，仅限此次对象分析

### util/walk
#### 方法
* simple(node:Node, nodeVisitors:Object, tokenVisitors:Object) 遍历语法树工具。nodeVisitors以树节点名做键，回调做值，回调参数为树节点；tokenVisitors以token类型做键，回调做值，回调参数为token
* simpleIgnore(node:Node, ignore:Object, nodeVisitors:Object, tokenVisitors:Object) 同上，增加第2个参数为忽略掉的空白符等。tokenVisitors的回调增加第2个参数为此token后面的忽略的token数组
* recursion(node:Node, callback:Function) 递归工具，深度遍历语法树，回调每个节点。回调参数第1个为节点或者token，第2个参数标明是否是token
* plainObject(node:Node):Array 序列化语法树结果为普通类型
* plainObject(tokens:Array<Token>):Array 序列化tokens结果为普通类型

#### 特别的，对于css还可以设置添加属性和颜色别名
* addValue(v:String):Object 添加未知属性并返回属性hash，仅限此次对象分析
* addColor(c:String):Object 添加未知颜色并返回颜色hash，仅限此次对象分析

#### 亦可使用静态方法统一添加关键字等，一劳永逸
* addKeyWord(kw:String):Array<String>
* addValue(v:String):Array<String>
* addColor(c:String):Array<String>

## AST
当调用语法分析器解析后，会返回生成ast，这是一个树状数据结构，每个节点都是对应语法解析器目录下的Node.js的实例。<br/>
demo目录下是一个用js的parser分析输入js代码并画出ast形状的页面。<br/>
你也可以在线尝试它：http://army8735.me/homunculus

## License
[MIT License]