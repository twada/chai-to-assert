'use strict';

var assert = require('assert');
var jscodeshift = require('jscodeshift');
var tranform = require('../lib/expect-to-assert');
var noop = function () {};

it('expect(foo).to.be.ok', function () {
    var input = 'expect(foo).to.be.ok';
    var output = tranform({path: 'test.js', source: input}, {jscodeshift: jscodeshift, stats: noop});
    assert.equal(output, 'assert(foo)');
});

it('expect(foo).to.be.true', function () {
    var input = 'expect(foo).to.be.true';
    var output = tranform({path: 'test.js', source: input}, {jscodeshift: jscodeshift, stats: noop});
    assert.equal(output, 'assert(foo === true)');
});
