'use strict';

var assert = require('assert');
var jscodeshift = require('jscodeshift');
var tranform = require('../lib/expect-to-assert');
var noop = function () {};

function testTransform (opts) {
    it(opts.before + ' => ' + opts.after, function () {
        var output = tranform({path: 'test.js', source: opts.before}, {jscodeshift: jscodeshift, stats: noop});
        assert.equal(output, opts.after);
    });
}

describe('.ok', function () {
    testTransform({
        before: 'expect(foo).to.be.ok',
        after:  'assert(foo)'
    });
    testTransform({
        before: 'expect(foo).to.not.be.ok',
        after:  'assert(!foo)'
    });
    testTransform({
        before: 'expect(foo).not.to.be.ok',
        after:  'assert(!foo)'
    });
    testTransform({
        before: 'expect(foo).have.to.be.ok',
        after:  'assert(foo)'
    });
});

describe('.true', function () {
    testTransform({
        before: 'expect(foo).to.be.true',
        after:  'assert(foo === true)'
    });
    testTransform({
        before: 'expect(foo).to.not.be.true',
        after:  'assert(foo !== true)'
    });
    testTransform({
        before: 'expect(true).to.be.true',
        after:  'assert(true === true)'
    });
    testTransform({
        before: 'expect(1).to.not.be.true',
        after:  'assert(1 !== true)'
    });
});

describe('.false', function () {
    testTransform({
        before: 'expect(foo).to.be.false',
        after:  'assert(foo === false)'
    });
    testTransform({
        before: 'expect(foo).to.not.be.false',
        after:  'assert(foo !== false)'
    });
    testTransform({
        before: 'expect(false).to.be.false',
        after:  'assert(false === false)'
    });
    testTransform({
        before: 'expect(0).to.not.be.false',
        after:  'assert(0 !== false)'
    });
});

describe('.null', function () {
    testTransform({
        before: 'expect(null).to.be.null',
        after:  'assert(null === null)'
    });
    testTransform({
        before: 'expect(undefined).to.not.be.null',
        after:  'assert(undefined !== null)'
    });
});

describe('.undefined', function () {
    testTransform({
        before: 'expect(undefined).to.be.undefined',
        after:  'assert(undefined === undefined)'
    });
    testTransform({
        before: 'expect(null).to.not.be.undefined',
        after:  'assert(null !== undefined)'
    });
});

describe('.equal()', function () {
    testTransform({
        before: 'expect("hello").to.equal("hello")',
        after:  'assert("hello" === "hello")'
    });
    testTransform({
        before: 'expect(42).to.equal(42)',
        after:  'assert(42 === 42)'
    });
    testTransform({
        before: 'expect(1).to.not.equal(true)',
        after:  'assert(1 !== true)'
    });
    testTransform({
        before: 'expect({ foo: "bar" }).to.not.equal({ foo: "bar" })',
        after:  'assert({ foo: "bar" } !== { foo: "bar" })'
    });
    testTransform({
        before: 'expect(foo).to.equals(bar)',
        after:  'assert(foo === bar)'
    });
    testTransform({
        before: 'expect(foo).to.not.equals(bar)',
        after:  'assert(foo !== bar)'
    });
    testTransform({
        before: 'expect(foo).to.eq(bar)',
        after:  'assert(foo === bar)'
    });
    testTransform({
        before: 'expect(foo).to.not.eq(bar)',
        after:  'assert(foo !== bar)'
    });
    describe('.deep', function () {
        testTransform({
            before: 'expect({ foo: "bar" }).to.deep.equal({ foo: "bar" })',
            after:  'assert.deepStrictEqual({ foo: "bar" }, { foo: "bar" })'
        });
        testTransform({
            before: 'expect(foo).to.not.deep.equal(baz)',
            after:  'assert.notDeepStrictEqual(foo, baz)'
        });
    });
});

describe('.eql()', function () {
    testTransform({
        before: 'expect({ foo: "bar" }).to.eql({ foo: "bar" })',
        after:  'assert.deepStrictEqual({ foo: "bar" }, { foo: "bar" })'
    });
    testTransform({
        before: 'expect({ foo: "bar" }).to.not.eql({ foo: "baz" })',
        after:  'assert.notDeepStrictEqual({ foo: "bar" }, { foo: "baz" })'
    });
    testTransform({
        before: 'expect(foo).to.eqls(bar)',
        after:  'assert.deepStrictEqual(foo, bar)'
    });
    testTransform({
        before: 'expect(foo).to.not.eqls(bar)',
        after:  'assert.notDeepStrictEqual(foo, bar)'
    });
});

describe('.a(), .an()', function () {
    testTransform({
        before: 'expect("test").to.be.a("string")',
        after:  'assert(typeof "test" === "string")'
    });
    testTransform({
        before: 'expect(foo).to.not.be.a("string")',
        after:  'assert(typeof foo !== "string")'
    });
    testTransform({
        before: 'expect({ foo: "bar" }).to.be.an("object")',
        after:  'assert(typeof { foo: "bar" } === "object")'
    });
    testTransform({
        before: 'expect(undefined).to.be.an("undefined")',
        after:  'assert(typeof undefined === "undefined")'
    });
    testTransform({
        before: 'expect(Symbol()).to.be.a("symbol")',
        after:  'assert(typeof Symbol() === "symbol")'
    });
    testTransform({
        before: 'expect(foo).to.be.a("null")',
        after:  'assert(foo === null)'
    });
    testTransform({
        before: 'expect(foo).to.not.be.a("null")',
        after:  'assert(foo !== null)'
    });
});

describe('.instanceof()', function () {
    testTransform({
        before: 'expect([ 1, 2, 3 ]).to.be.instanceof(Array)',
        after:  'assert([ 1, 2, 3 ] instanceof Array)'
    });
    testTransform({
        before: 'expect(foo).to.not.be.instanceof(Array)',
        after:  'assert(!(foo instanceof Array))'
    });
    testTransform({
        before: 'expect(foo).to.be.instanceOf(Array)',
        after:  'assert(foo instanceof Array)'
    });
    testTransform({
        before: 'expect(bar).to.not.be.instanceOf(Array)',
        after:  'assert(!(bar instanceof Array))'
    });
});

describe('.match(regexp)', function () {
    testTransform({
        before: 'expect(str).to.match(re)',
        after:  'assert(re.test(str) === true)'
    });
    testTransform({
        before: 'expect("foobar").to.match(/^foo/)',
        after:  'assert(/^foo/.test("foobar") === true)'
    });
    testTransform({
        before: 'expect(str).to.not.match(re)',
        after:  'assert(re.test(str) === false)'
    });
});

describe('.string(string)', function () {
    testTransform({
        before: 'expect(str).to.string(substr)',
        after:  'assert(str.indexOf(substr) !== -1)'
    });
    testTransform({
        before: 'expect(str).to.not.string(substr)',
        after:  'assert(str.indexOf(substr) === -1)'
    });
});

describe('.respondTo(method)', function () {
    testTransform({
        before: 'expect(obj).respondsTo("bar")',
        after:  'assert(typeof obj["bar"] === "function")'
    });
    testTransform({
        before: 'expect(obj).to.not.respondTo("baz")',
        after:  'assert(typeof obj["baz"] === "undefined")'
    });
    describe('Klass', function () {
        testTransform({
            before: 'expect(Klass).respondsTo("bar")',
            after:  'assert(typeof Klass.prototype["bar"] === "function")'
        });
        testTransform({
            before: 'expect(Klass).not.respondTo("baz")',
            after:  'assert(typeof Klass.prototype["baz"] === "undefined")'
        });
    });
    describe('Klass .itself', function () {
        testTransform({
            before: 'expect(Klass).itself.respondsTo("bar")',
            after:  'assert(typeof Klass["bar"] === "function")'
        });
        testTransform({
            before: 'expect(Klass).itself.not.respondTo("baz")',
            after:  'assert(typeof Klass["baz"] === "undefined")'
        });
    });
});

describe('.lengthOf(value)', function () {
    testTransform({
        before: 'expect([1, 2, 3]).to.have.lengthOf(3)',
        after:  'assert([1, 2, 3].length === 3)'
    });
    testTransform({
        before: 'expect(str).to.not.have.length(zero)',
        after:  'assert(str.length !== zero)'
    });
});

describe('.above(value)', function () {
    testTransform({
        before: 'expect(ten).to.be.above(5)',
        after:  'assert(ten > 5)'
    });
    testTransform({
        before: 'expect(one).to.not.be.greaterThan(seven)',
        after:  'assert(one <= seven)'
    });
    describe('.lengthOf chain', function () {
        testTransform({
            before: 'expect("foo").to.have.lengthOf.above(2)',
            after:  'assert("foo".length > 2)'
        });
        testTransform({
            before: 'expect([1, 2, 3]).to.not.have.lengthOf.gt(five)',
            after:  'assert([1, 2, 3].length <= five)'
        });
    });
});
