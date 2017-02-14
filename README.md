chai-to-assert
================================

A [jscodeshift](https://github.com/facebook/jscodeshift) codemod that transforms from [chai](http://chaijs.com/) to [Node assert](https://nodejs.org/api/assert.html).

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Development Status][status-image]][status-url]
[![Code Style][style-image]][style-url]
[![License][license-image]][license-url]


USAGE
---------------------------------------

```sh
$ npm install -g jscodeshift
$ npm install chai-to-assert
$ jscodeshift -t node_modules/chai-to-assert/lib/bdd-api-to-node-assert.js target-dir
```


FEATURES
---------------------------------------

### properties

* `.ok`
* `.true`
* `.false`
* `.null`
* `.undefined`
* `.exist`
* `.NaN`
* `.finite`
* `.extensible`
* `.sealed`
* `.frozen`

### chainable methods

* `.a(type)` (alias `an`) (only for primitives and null)
* `.lengthOf(value)` (alias `.length`)

### methods

* `.equal(value)` (alias `.equals`, `.eq`)
* `.eql(value)` (alias `.eqls`)
* `.match(regexp)` (alias `.matches`)
* `.above(value)` (alias `.gt`, `.greaterThan`)
* `.least(value)` (alias `.gte`)
* `.below(value)` (alias `.lt`, `.lessThan`)
* `.most(value)` (alias `.lte`)
* `.within(start, finish)`
* `.closeTo(expected, delta)` (alias `.approximately`)
* `.property(name, [value])`
* `.ownProperty(name, [value])` (alias `.haveOwnProperty`)
* `.ownPropertyDescriptor(name, [descriptor])` (alias `.haveOwnPropertyDescriptor`)
* `.instanceof(constructor)` (alias `.instanceOf`)
* `.throw([errorLike], [errMsgMatcher])` (alias `.throws`, `.Throw`)
* `.respondTo(method)` (alias `.respondsTo`)
* `.satisfy(predicate)` (alias `.satisfies`)
* `.string(string)`
* `.oneOf(list)`


AUTHOR
---------------------------------------
* [Takuto Wada](https://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/twada/chai-to-assert/blob/master/LICENSE) license.


[npm-url]: https://npmjs.org/package/chai-to-assert
[npm-image]: https://badge.fury.io/js/chai-to-assert.svg

[travis-url]: https://travis-ci.org/twada/chai-to-assert
[travis-image]: https://secure.travis-ci.org/twada/chai-to-assert.svg?branch=master

[license-url]: https://github.com/twada/chai-to-assert/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg

[status-url]: https://github.com/twada/chai-to-assert/blob/master/CHANGELOG.md
[status-image]: https://img.shields.io/badge/status-beta-yellow.svg

[style-url]: https://github.com/Flet/semistandard
[style-image]: https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg
