chai-to-assert
================================

A [jscodeshift](https://github.com/facebook/jscodeshift) codemod that transforms from [chai](http://chaijs.com/) to [Node assert](https://nodejs.org/api/assert.html).

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Development Status][status-image]][status-url]
[![Code Style][style-image]][style-url]


USAGE
---------------------------------------

```sh
$ npm install -g jscodeshift
$ npm install chai-to-assert
$ jscodeshift -t node_modules/chai-to-assert/lib/expect-to-assert.js target-dir
```


FEATURES
---------------------------------------

### properties

* `.ok`
* `.true`
* `.false`
* `.null`
* `.undefined`
* `.finite`
* `.NaN`
* `.exist`

### chainable methods

* `.a()`, `.an()` (only for primitives and null)
* `.lengthOf()`, `.length()`

### methods

* `.instanceof()`, `.instanceOf()`
* `.match()`, `.matches()`
* `.string()`
* `.equal()`, `.equals()`, `.eq()`
* `.eql()`, `.eqls()`
* `.above()`, `.gt()`, `.greaterThan()`
* `.least()`, `.gte()`
* `.below()`, `.lt()`, `.lessThan()`
* `.most()`, `.lte()`
* `.within()`
* `.respondTo()`, `.respondsTo()`
* `.satisfy()`, `.satisfies()`
* `.throw()`, `.throws()`, `.Throw()`
* `.oneOf()`


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
