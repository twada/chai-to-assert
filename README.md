chai-to-assert
================================

A [jscodeshift](https://github.com/facebook/jscodeshift) codemod that transforms from [chai](http://chaijs.com/) to [Node assert](https://nodejs.org/api/assert.html).

[![Build Status][travis-image]][travis-url]
[![License][license-image]][license-url]
[![Development Status][status-image]][status-url]


USAGE
---------------------------------------

```sh
$ npm install -g jscodeshift
$ npm install chai-to-assert
$ jscodeshift -t node_modules/chai-to-assert/lib/expect-to-assert.js target-dir
```


AUTHOR
---------------------------------------
* [Takuto Wada](https://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/twada/chai-to-assert/blob/master/LICENSE) license.

[travis-url]: https://travis-ci.org/twada/chai-to-assert
[travis-image]: https://secure.travis-ci.org/twada/chai-to-assert.svg?branch=master

[license-url]: https://github.com/twada/chai-to-assert/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg

[status-url]: https://github.com/twada/chai-to-assert/blob/master/CHANGELOG.md
[status-image]: https://img.shields.io/badge/status-experimental-orange.svg
