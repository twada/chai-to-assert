'use strict';

var assert = require('assert');
var jscodeshift = require('jscodeshift');
var tranform = require('../lib/expect-to-assert');
var noop = function () {};

function testTransform (opts) {
    it(opts.before, function () {
        var output = tranform({path: 'test.js', source: opts.before}, {jscodeshift: jscodeshift, stats: noop});
        assert.equal(output, opts.after);
    });
}

testTransform({
    before: 'expect(foo).to.be.ok',
    after:  'assert(foo)'
});

testTransform({
    before: 'expect(foo).to.be.true',
    after:  'assert(foo === true)'
});

testTransform({
    before: 'expect(foo).to.not.be.ok',
    after:  'assert(!foo)'
});

