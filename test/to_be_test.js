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

testTransform({
    before: 'expect(foo).to.be.true',
    after:  'assert(foo === true)'
});

testTransform({
    before: 'expect(foo).to.not.be.true',
    after:  'assert(foo !== true)'
});

testTransform({
    before: 'expect(foo).to.be.false',
    after:  'assert(foo === false)'
});

testTransform({
    before: 'expect(foo).to.not.be.false',
    after:  'assert(foo !== false)'
});


// from Chai API Reference

testTransform({
    before: 'expect(true).to.be.true',
    after:  'assert(true === true)'
});

testTransform({
    before: 'expect(1).to.not.be.true',
    after:  'assert(1 !== true)'
});

testTransform({
    before: 'expect(false).to.be.false',
    after:  'assert(false === false)'
});

testTransform({
    before: 'expect(0).to.not.be.false',
    after:  'assert(0 !== false)'
});

testTransform({
    before: 'expect(null).to.be.null',
    after:  'assert(null === null)'
});

testTransform({
    before: 'expect(undefined).to.not.be.null',
    after:  'assert(undefined !== null)'
});

testTransform({
    before: 'expect(undefined).to.be.undefined',
    after:  'assert(undefined === undefined)'
});

testTransform({
    before: 'expect(null).to.not.be.undefined',
    after:  'assert(null !== undefined)'
});

testTransform({
    before: 'expect("hello").to.equal("hello")',
    after:  'assert("hello" === "hello")'
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
    before: 'expect({ foo: "bar" }).to.deep.equal({ foo: "bar" })',
    after:  'assert.deepStrictEqual({ foo: "bar" }, { foo: "bar" })'
});

testTransform({
    before: 'expect(foo).to.not.deep.equal(baz)',
    after:  'assert.notDeepStrictEqual(foo, baz)'
});

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

testTransform({
    before: 'expect([ 1, 2, 3 ]).to.be.instanceof(Array)',
    after:  'assert([ 1, 2, 3 ] instanceof Array)'
});

testTransform({
    before: 'expect(foo).to.not.be.instanceof(Array)',
    after:  'assert(!(foo instanceof Array))'
});
