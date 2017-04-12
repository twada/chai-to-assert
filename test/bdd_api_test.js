'use strict';

var assert = require('assert');
var jscodeshift = require('jscodeshift');
var tranform = require('../lib/bdd-api-to-node-assert');
var noop = function () {};

function testTransform (opts) {
  it(opts.before + ' => ' + opts.after, function () {
    var output = tranform(
      {
        path: 'test.js',
        source: opts.before
      },
      {
        jscodeshift: jscodeshift,
        stats: noop
      },
      Object.assign({}, opts.options)
    );
    assert.equal(output, opts.after);
  });
}

describe('should style', function () {
  testTransform({
    before: 'foo.should.be.ok',
    after: 'assert(foo)'
  });
  testTransform({
    before: 'str.should.equal("hello")',
    after: 'assert(str === "hello")'
  });
  testTransform({
    before: 'foo.bar(baz).should.not.be.null',
    after: 'assert(foo.bar(baz) !== null)'
  });
});

describe('.ok', function () {
  testTransform({
    before: 'expect(foo).to.be.ok',
    after: 'assert(foo)'
  });
  testTransform({
    before: 'expect(foo).to.not.be.ok',
    after: 'assert(!foo)'
  });
  testTransform({
    before: 'expect(foo).not.to.be.ok',
    after: 'assert(!foo)'
  });
  testTransform({
    before: 'expect(foo).have.to.be.ok',
    after: 'assert(foo)'
  });
});

describe('.true', function () {
  testTransform({
    before: 'expect(foo).to.be.true',
    after: 'assert(foo === true)'
  });
  testTransform({
    before: 'expect(foo).to.not.be.true',
    after: 'assert(foo !== true)'
  });
  testTransform({
    before: 'expect(true).to.be.true',
    after: 'assert(true === true)'
  });
  testTransform({
    before: 'expect(1).to.not.be.true',
    after: 'assert(1 !== true)'
  });
});

describe('.false', function () {
  testTransform({
    before: 'expect(foo).to.be.false',
    after: 'assert(foo === false)'
  });
  testTransform({
    before: 'expect(foo).to.not.be.false',
    after: 'assert(foo !== false)'
  });
  testTransform({
    before: 'expect(false).to.be.false',
    after: 'assert(false === false)'
  });
  testTransform({
    before: 'expect(0).to.not.be.false',
    after: 'assert(0 !== false)'
  });
});

describe('.null', function () {
  testTransform({
    before: 'expect(null).to.be.null',
    after: 'assert(null === null)'
  });
  testTransform({
    before: 'expect(undefined).to.not.be.null',
    after: 'assert(undefined !== null)'
  });
});

describe('.undefined', function () {
  testTransform({
    before: 'expect(undefined).to.be.undefined',
    after: 'assert(undefined === undefined)'
  });
  testTransform({
    before: 'expect(null).to.not.be.undefined',
    after: 'assert(null !== undefined)'
  });
});

describe('.exist', function () {
  testTransform({
    before: 'expect(foo).to.exist',
    after: 'assert(foo !== null && foo !== undefined)'
  });
  testTransform({
    before: 'expect(bar).to.not.exist',
    after: 'assert(bar === null || bar === undefined)'
  });
});

describe('.empty', function () {
  testTransform({
    before: 'expect(foo).to.be.empty',
    after: 'assert(foo.length === 0)'
  });
  testTransform({
    before: 'expect(foo).to.not.be.empty',
    after: 'assert(foo.length !== 0)'
  });
});

describe('.NaN', function () {
  testTransform({
    before: 'expect(foo).to.be.NaN',
    after: 'assert(typeof foo === "number" && foo !== foo)'
  });
  testTransform({
    before: 'expect(bar).to.not.be.NaN',
    after: 'assert(typeof bar !== "number" || bar === bar)'
  });
});

describe('.finite', function () {
  testTransform({
    before: 'expect(4).to.be.finite',
    after: 'assert(typeof 4 === "number" && isFinite(4))'
  });
  testTransform({
    before: 'expect(Infinity).to.not.be.finite',
    after: 'assert(typeof Infinity !== "number" || !isFinite(Infinity))'
  });
});

describe('.extensible', function () {
  testTransform({
    before: 'expect(obj).to.be.extensible',
    after: 'assert(obj === Object(obj) && Object.isExtensible(obj))'
  });
  testTransform({
    before: 'expect(obj).to.not.be.extensible',
    after: 'assert(obj !== Object(obj) || !Object.isExtensible(obj))'
  });
});

describe('.sealed', function () {
  testTransform({
    before: 'expect(obj).to.be.sealed',
    after: 'assert((obj === Object(obj) ? Object.isSealed(obj) : true))'
  });
  testTransform({
    before: 'expect(obj).to.not.be.sealed',
    after: 'assert((obj === Object(obj) ? !Object.isSealed(obj) : false))'
  });
});

describe('.frozen', function () {
  testTransform({
    before: 'expect(obj).to.be.frozen',
    after: 'assert((obj === Object(obj) ? Object.isFrozen(obj) : true))'
  });
  testTransform({
    before: 'expect(obj).to.not.be.frozen',
    after: 'assert((obj === Object(obj) ? !Object.isFrozen(obj) : false))'
  });
});

describe('.equal()', function () {
  testTransform({
    before: 'expect("hello").to.equal("hello")',
    after: 'assert("hello" === "hello")'
  });
  testTransform({
    before: 'expect(42).to.equal(42)',
    after: 'assert(42 === 42)'
  });
  testTransform({
    before: 'expect(1).to.not.equal(true)',
    after: 'assert(1 !== true)'
  });
  testTransform({
    before: 'expect({ foo: "bar" }).to.not.equal({ foo: "bar" })',
    after: 'assert({ foo: "bar" } !== { foo: "bar" })'
  });
  testTransform({
    before: 'expect(foo).to.equals(bar)',
    after: 'assert(foo === bar)'
  });
  testTransform({
    before: 'expect(foo).to.not.equals(bar)',
    after: 'assert(foo !== bar)'
  });
  testTransform({
    before: 'expect(foo).to.eq(bar)',
    after: 'assert(foo === bar)'
  });
  testTransform({
    before: 'expect(foo).to.not.eq(bar)',
    after: 'assert(foo !== bar)'
  });
  describe('.deep', function () {
    testTransform({
      before: 'expect({ foo: "bar" }).to.deep.equal({ foo: "bar" })',
      after: 'assert.deepStrictEqual({ foo: "bar" }, { foo: "bar" })'
    });
    testTransform({
      before: 'expect(foo).to.not.deep.equal(baz)',
      after: 'assert.notDeepStrictEqual(foo, baz)'
    });
  });
});

describe('.eql()', function () {
  testTransform({
    before: 'expect({ foo: "bar" }).to.eql({ foo: "bar" })',
    after: 'assert.deepStrictEqual({ foo: "bar" }, { foo: "bar" })'
  });
  testTransform({
    before: 'expect({ foo: "bar" }).to.not.eql({ foo: "baz" })',
    after: 'assert.notDeepStrictEqual({ foo: "bar" }, { foo: "baz" })'
  });
  testTransform({
    before: 'expect(foo).to.eqls(bar)',
    after: 'assert.deepStrictEqual(foo, bar)'
  });
  testTransform({
    before: 'expect(foo).to.not.eqls(bar)',
    after: 'assert.notDeepStrictEqual(foo, bar)'
  });
});

describe('.a(), .an()', function () {
  testTransform({
    before: 'expect("test").to.be.a("string")',
    after: 'assert(typeof "test" === "string")'
  });
  testTransform({
    before: 'expect(foo).to.not.be.a("string")',
    after: 'assert(typeof foo !== "string")'
  });
  testTransform({
    before: 'expect({ foo: "bar" }).to.be.an("object")',
    after: 'assert(typeof { foo: "bar" } === "object")'
  });
  testTransform({
    before: 'expect(undefined).to.be.an("undefined")',
    after: 'assert(typeof undefined === "undefined")'
  });
  testTransform({
    before: 'expect(Symbol()).to.be.a("symbol")',
    after: 'assert(typeof Symbol() === "symbol")'
  });
  testTransform({
    before: 'expect(foo).to.be.a("null")',
    after: 'assert(foo === null)'
  });
  testTransform({
    before: 'expect(foo).to.not.be.a("null")',
    after: 'assert(foo !== null)'
  });
});

describe('.include(value)', function () {
  testTransform({
    before: 'expect(ary).to.include(item)',
    after: 'assert(ary.indexOf(item) !== -1)'
  });
  testTransform({
    before: 'expect(str).to.not.contain(substr)',
    after: 'assert(str.indexOf(substr) === -1)'
  });
});

describe('.instanceof()', function () {
  testTransform({
    before: 'expect([ 1, 2, 3 ]).to.be.instanceof(Array)',
    after: 'assert([ 1, 2, 3 ] instanceof Array)'
  });
  testTransform({
    before: 'expect(foo).to.not.be.instanceof(Array)',
    after: 'assert(!(foo instanceof Array))'
  });
  testTransform({
    before: 'expect(foo).to.be.instanceOf(Array)',
    after: 'assert(foo instanceof Array)'
  });
  testTransform({
    before: 'expect(bar).to.not.be.instanceOf(Array)',
    after: 'assert(!(bar instanceof Array))'
  });
});

describe('.match(regexp)', function () {
  testTransform({
    before: 'expect(str).to.match(re)',
    after: 'assert(re.test(str) === true)'
  });
  testTransform({
    before: 'expect("foobar").to.match(/^foo/)',
    after: 'assert(/^foo/.test("foobar") === true)'
  });
  testTransform({
    before: 'expect(str).to.not.match(re)',
    after: 'assert(re.test(str) === false)'
  });
});

describe('.string(string)', function () {
  testTransform({
    before: 'expect(str).to.string(substr)',
    after: 'assert(str.indexOf(substr) !== -1)'
  });
  testTransform({
    before: 'expect(str).to.not.string(substr)',
    after: 'assert(str.indexOf(substr) === -1)'
  });
});

describe('.respondTo(method)', function () {
  testTransform({
    before: 'expect(obj).respondsTo("bar")',
    after: 'assert(typeof obj["bar"] === "function")'
  });
  testTransform({
    before: 'expect(obj).to.not.respondTo("baz")',
    after: 'assert(typeof obj["baz"] !== "function")'
  });
  describe('Klass', function () {
    testTransform({
      before: 'expect(Klass).respondsTo("bar")',
      after: 'assert(typeof Klass.prototype["bar"] === "function")'
    });
    testTransform({
      before: 'expect(Klass).not.respondTo("baz")',
      after: 'assert(typeof Klass.prototype["baz"] !== "function")'
    });
  });
  describe('Klass .itself', function () {
    testTransform({
      before: 'expect(Klass).itself.respondsTo("bar")',
      after: 'assert(typeof Klass["bar"] === "function")'
    });
    testTransform({
      before: 'expect(Klass).itself.not.respondTo("baz")',
      after: 'assert(typeof Klass["baz"] !== "function")'
    });
  });
});

describe('.lengthOf(value)', function () {
  testTransform({
    before: 'expect([1, 2, 3]).to.have.lengthOf(3)',
    after: 'assert([1, 2, 3].length === 3)'
  });
  testTransform({
    before: 'expect(str).to.not.have.length(zero)',
    after: 'assert(str.length !== zero)'
  });
});

describe('.above(value)', function () {
  testTransform({
    before: 'expect(ten).to.be.above(5)',
    after: 'assert(ten > 5)'
  });
  testTransform({
    before: 'expect(one).to.not.be.greaterThan(seven)',
    after: 'assert(one <= seven)'
  });
  describe('.lengthOf chain', function () {
    testTransform({
      before: 'expect("foo").to.have.lengthOf.above(2)',
      after: 'assert("foo".length > 2)'
    });
    testTransform({
      before: 'expect([1, 2, 3]).to.not.have.lengthOf.gt(five)',
      after: 'assert([1, 2, 3].length <= five)'
    });
  });
});

describe('.least(value)', function () {
  testTransform({
    before: 'expect(ten).to.be.at.least(10)',
    after: 'assert(ten >= 10)'
  });
  testTransform({
    before: 'expect(eight).to.not.be.gte(nine)',
    after: 'assert(eight < nine)'
  });
  describe('.lengthOf chain', function () {
    testTransform({
      before: 'expect("foo").to.have.lengthOf.at.least(2)',
      after: 'assert("foo".length >= 2)'
    });
    testTransform({
      before: 'expect([1, 2, 3]).to.not.have.lengthOf.at.least(3)',
      after: 'assert([1, 2, 3].length < 3)'
    });
  });
});

describe('.below(value)', function () {
  testTransform({
    before: 'expect(five).to.be.below(10)',
    after: 'assert(five < 10)'
  });
  testTransform({
    before: 'expect(four).to.not.be.lessThan(one)',
    after: 'assert(four >= one)'
  });
  describe('.lengthOf chain', function () {
    testTransform({
      before: 'expect("foo").to.have.lengthOf.below(4)',
      after: 'assert("foo".length < 4)'
    });
    testTransform({
      before: 'expect([1, 2, 3]).to.not.have.lengthOf.lt(two)',
      after: 'assert([1, 2, 3].length >= two)'
    });
  });
});

describe('.most(value)', function () {
  testTransform({
    before: 'expect(five).to.be.at.most(5)',
    after: 'assert(five <= 5)'
  });
  testTransform({
    before: 'expect(five).to.not.be.lte(two)',
    after: 'assert(five > two)'
  });
  describe('.lengthOf chain', function () {
    testTransform({
      before: 'expect("foo").to.have.lengthOf.at.most(4)',
      after: 'assert("foo".length <= 4)'
    });
    testTransform({
      before: 'expect([1, 2, 3]).to.not.have.lengthOf.lte(two)',
      after: 'assert([1, 2, 3].length > two)'
    });
  });
});

describe('.within(start,finish)', function () {
  testTransform({
    before: 'expect(seven).to.be.within(five,ten)',
    after: 'assert(five <= seven && seven <= ten)'
  });
  testTransform({
    before: 'expect(two).to.not.be.within(five,ten)',
    after: 'assert(two < five || ten < two)'
  });
  describe('.lengthOf chain', function () {
    testTransform({
      before: 'expect("foo").to.have.lengthOf.within(2,4)',
      after: 'assert(2 <= "foo".length && "foo".length <= 4)'
    });
    testTransform({
      before: 'expect([1]).to.not.have.lengthOf.within(2,4)',
      after: 'assert([1].length < 2 || 4 < [1].length)'
    });
  });
});

describe('.satisfy(method)', function () {
  testTransform({
    before: 'expect(n).to.satisfy(isPositive)',
    after: 'assert(isPositive(n))'
  });
  testTransform({
    before: 'expect(n).to.satisfy(function(num) { return num > 0; })',
    after: 'assert(function(num) { return num > 0; }(n))'
  });
  testTransform({
    before: 'expect(n).to.not.satisfy(isPositive)',
    after: 'assert(!isPositive(n))'
  });
});

describe('.oneOf(list)', function () {
  testTransform({
    before: 'expect(item).to.be.oneOf(ary)',
    after: 'assert(ary.indexOf(item) !== -1)'
  });
  testTransform({
    before: 'expect("a").to.be.oneOf(["a", "b", "c"])',
    after: 'assert(["a", "b", "c"].indexOf("a") !== -1)'
  });
  testTransform({
    before: 'expect(item).to.not.be.oneOf(ary)',
    after: 'assert(ary.indexOf(item) === -1)'
  });
});

describe('.throw([errorLike], [errMsgMatcher])', function () {
  testTransform({
    before: 'expect(func).to.throw()',
    after: 'assert.throws(func)'
  });
  testTransform({
    before: 'expect(func).to.not.throw()',
    after: 'assert.doesNotThrow(func)'
  });
  testTransform({
    before: 'expect(func).to.throw(SomeError)',
    after: 'assert.throws(func, SomeError)'
  });
  testTransform({
    before: 'expect(func).to.not.throw(SomeError)',
    after: 'assert.doesNotThrow(func, SomeError)'
  });
  testTransform({
    before: 'expect(func).to.throw(/error message/)',
    after: 'assert.throws(func, /error message/)'
  });
  testTransform({
    before: 'expect(func).to.not.throw(/error message/)',
    after: 'assert.doesNotThrow(func, /error message/)'
  });
  testTransform({
    before: 'expect(func).to.throw(SomeError, /error message/)',
    after: 'assert.throws(func, function(err) {\n  return err instanceof SomeError && /error message/.test(err.message);\n})'
  });
  testTransform({
    before: 'expect(func).to.not.throw(SomeError, /error message/)',
    after: 'assert.doesNotThrow(func, function(err) {\n  return err instanceof SomeError && /error message/.test(err.message);\n})'
  });
  testTransform({
    before: 'expect(func).to.throwError(SomeError)',
    after: 'assert.throws(func, SomeError)'
  });
  testTransform({
    before: 'expect(func).to.not.throwError(SomeError)',
    after: 'assert.doesNotThrow(func, SomeError)'
  });
  testTransform({
    before: 'expect(func).to.throwException(SomeError)',
    after: 'assert.throws(func, SomeError)'
  });
  testTransform({
    before: 'expect(func).to.not.throwException(SomeError)',
    after: 'assert.doesNotThrow(func, SomeError)'
  });
});

describe('.property(name, [value])', function () {
  testTransform({
    before: 'expect(obj).to.have.property("foo")',
    after: 'assert("foo" in obj)'
  });
  testTransform({
    before: 'expect(obj).to.not.have.property("foo")',
    after: 'assert(!("foo" in obj))'
  });
  testTransform({
    before: 'expect(obj).to.have.property("foo", "bar")',
    after: 'assert(obj["foo"] === "bar")'
  });
  testTransform({
    before: 'expect(obj).to.not.have.property("foo", "bar")',
    after: 'assert(obj["foo"] !== "bar")'
  });
  describe('.deep', function () {
    testTransform({
      before: 'expect(obj).to.have.deep.property("foo", { bar: "baz" })',
      after: 'assert.deepStrictEqual(obj["foo"], { bar: "baz" })'
    });
    testTransform({
      before: 'expect(obj).to.not.have.deep.property("foo", { bar: "quux" })',
      after: 'assert.notDeepStrictEqual(obj["foo"], { bar: "quux" })'
    });
  });
  describe('.own', function () {
    testTransform({
      before: 'expect(obj).to.have.own.property("foo")',
      after: 'assert(obj.hasOwnProperty("foo"))'
    });
    testTransform({
      before: 'expect(obj).to.not.have.own.property("toString")',
      after: 'assert(!obj.hasOwnProperty("toString"))'
    });
    testTransform({
      before: 'expect(obj).to.have.own.property("foo", "bar")',
      after: 'assert(obj.hasOwnProperty("foo") && obj["foo"] === "bar")'
    });
    testTransform({
      before: 'expect(obj).to.not.have.own.property("foo", "bar")',
      after: 'assert(!obj.hasOwnProperty("foo") || obj["foo"] !== "bar")'
    });
  });
  describe('.deep.own', function () {
    testTransform({
      before: 'expect(obj).to.have.deep.own.property("foo", { bar: "baz" })',
      after: 'assert(obj.hasOwnProperty("foo")), assert.deepStrictEqual(obj["foo"], { bar: "baz" })'
    });
    testTransform({
      before: 'expect(obj).to.have.not.deep.own.property("foo", { bar: "baz" })',
      after: 'assert(!obj.hasOwnProperty("foo")), assert.notDeepStrictEqual(obj["foo"], { bar: "baz" })'
    });
  });
  describe('.ownProperty(name, [value])', function () {
    testTransform({
      before: 'expect(obj).to.have.ownProperty("foo")',
      after: 'assert(obj.hasOwnProperty("foo"))'
    });
    testTransform({
      before: 'expect(obj).to.not.have.ownProperty("toString")',
      after: 'assert(!obj.hasOwnProperty("toString"))'
    });
    testTransform({
      before: 'expect(obj).to.have.ownProperty("foo", "bar")',
      after: 'assert(obj.hasOwnProperty("foo") && obj["foo"] === "bar")'
    });
    testTransform({
      before: 'expect(obj).to.not.have.ownProperty("foo", "bar")',
      after: 'assert(!obj.hasOwnProperty("foo") || obj["foo"] !== "bar")'
    });
    testTransform({
      before: 'expect(obj).to.have.deep.ownProperty("foo", { bar: "baz" })',
      after: 'assert(obj.hasOwnProperty("foo")), assert.deepStrictEqual(obj["foo"], { bar: "baz" })'
    });
    testTransform({
      before: 'expect(obj).to.have.not.deep.ownProperty("foo", { bar: "baz" })',
      after: 'assert(!obj.hasOwnProperty("foo")), assert.notDeepStrictEqual(obj["foo"], { bar: "baz" })'
    });
  });
  describe('.haveOwnProperty(name, [value])', function () {
    testTransform({
      before: 'expect(obj).to.haveOwnProperty("foo")',
      after: 'assert(obj.hasOwnProperty("foo"))'
    });
    testTransform({
      before: 'expect(obj).to.not.haveOwnProperty("toString")',
      after: 'assert(!obj.hasOwnProperty("toString"))'
    });
    testTransform({
      before: 'expect(obj).to.haveOwnProperty("foo", "bar")',
      after: 'assert(obj.hasOwnProperty("foo") && obj["foo"] === "bar")'
    });
    testTransform({
      before: 'expect(obj).to.not.haveOwnProperty("foo", "bar")',
      after: 'assert(!obj.hasOwnProperty("foo") || obj["foo"] !== "bar")'
    });
  });
});

describe('.ownPropertyDescriptor(name, [descriptor])', function () {
  testTransform({
    before: 'expect("test").to.have.ownPropertyDescriptor("length")',
    after: 'assert(Object.getOwnPropertyDescriptor(Object("test"), "length"))'
  });
  testTransform({
    before: 'expect("test").to.not.have.ownPropertyDescriptor("foo")',
    after: 'assert(!Object.getOwnPropertyDescriptor(Object("test"), "foo"))'
  });
  testTransform({
    before: 'expect("test").to.have.ownPropertyDescriptor("length", { enumerable: false, configurable: false, writable: false, value: 4 })',
    after: 'assert.deepStrictEqual(\n  Object.getOwnPropertyDescriptor(Object("test"), "length"),\n  { enumerable: false, configurable: false, writable: false, value: 4 }\n)'
  });
  testTransform({
    before: 'expect("test").to.not.have.ownPropertyDescriptor("length", { enumerable: false, configurable: false, writable: false, value: 3 })',
    after: 'assert.notDeepStrictEqual(\n  Object.getOwnPropertyDescriptor(Object("test"), "length"),\n  { enumerable: false, configurable: false, writable: false, value: 3 }\n)'
  });
  testTransform({
    before: 'expect("test").to.haveOwnPropertyDescriptor("length")',
    after: 'assert(Object.getOwnPropertyDescriptor(Object("test"), "length"))'
  });
});

describe('.closeTo(expected, delta)', function () {
  testTransform({
    before: 'expect(1.5).to.be.closeTo(1, 0.5)',
    after: 'assert(Math.abs(1.5 - 1) <= 0.5)'
  });
  testTransform({
    before: 'expect(num).to.not.be.approximately(expected, delta)',
    after: 'assert(Math.abs(num - expected) > delta)'
  });
});
