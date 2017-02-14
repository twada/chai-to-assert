## [0.5.0](https://github.com/twada/chai-to-assert/releases/tag/v0.5.0) (2017-02-15)

#### Features

* support BDD `should` style as well ([9f68bd6a](https://github.com/twada/chai-to-assert/commit/9f68bd6ae4aa94118236497722efbaf6f7abbc8d))


#### Breaking Changes

* transform file name has changed

before:
$ jscodeshift -t node_modules/chai-to-assert/lib/expect-to-assert.js target-dir

after:
$ jscodeshift -t node_modules/chai-to-assert/lib/bdd-api-to-node-assert.js target-dir

 ([6e339515](https://github.com/twada/chai-to-assert/commit/6e339515877c45f9e216e8a8288ed97c1e1ccd75))


## [0.4.0](https://github.com/twada/chai-to-assert/releases/tag/v0.4.0) (2017-02-14)

#### Features

* `.closeTo(expected, delta)` (alias `.approximately`)
* `.extensible`
* `.sealed`
* `.frozen`


## [0.3.0](https://github.com/twada/chai-to-assert/releases/tag/v0.3.0) (2017-02-08)

#### Features

* `.property(name, [value])`
* `.ownProperty(name, [value])` (alias `.haveOwnProperty`)
* `.ownPropertyDescriptor(name, [descriptor])` (alias `.haveOwnPropertyDescriptor`)


## [0.2.0](https://github.com/twada/chai-to-assert/releases/tag/v0.2.0) (2017-02-06)

#### Features

* `.finite`
* `.NaN`
* `.exist`
* `.lengthOf(value)` (alias `.length`)
* `.above(value)` (alias `.gt`, `.greaterThan`)
* `.least(value)` (alias `.gte`)
* `.below(value)` (alias `.lt`, `.lessThan`)
* `.most(value)` (alias `.lte`)
* `.within(start, finish)`
* `.respondTo(method)` (alias `.respondsTo`)
* `.satisfy(predicate)` (alias `.satisfies`)
* `.throw([errorLike], [errMsgMatcher])` (alias `.throws`, `.Throw`)
* `.oneOf(list)`


## [0.1.0](https://github.com/twada/chai-to-assert/releases/tag/v0.1.0) (2017-01-23)

#### Features

  * `.ok`
  * `.true`
  * `.false`
  * `.null`
  * `.undefined`
  * `.a(type)` (alias `an`) (only for primitives and null)
  * `.equal(value)` (alias `.equals`, `.eq`)
  * `.eql(value)` (alias `.eqls`)
  * `.instanceof(constructor)` (alias `.instanceOf`)
  * `.match(regexp)` (alias `.matches`)
  * `.string(string)`
