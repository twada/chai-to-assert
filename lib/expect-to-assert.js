'use strict';

var assert = require('assert');

module.exports = function expectToAssert (file, api, options) {
    var j = api.jscodeshift;
    var ast = j(file.source);

    function beginsWithExpect (node) {
        return (node.type === 'Identifier' && node.name === 'expect' ||
                (node.type === 'CallExpression' && beginsWithExpect(node.callee)) ||
                (node.type === 'MemberExpression' && beginsWithExpect(node.object)));
    }

    function subjects (node) {
        if (node.type === 'CallExpression') {
            if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
                return node.arguments;
            } else {
                return subjects(node.callee);
            }
        } else if (node.type === 'MemberExpression') {
            return subjects(node.object);
        } else {
            assert(false, 'cannot be here');
            return null;
        }
    }

    function isNegation (node) {
        if (node.type === 'CallExpression') {
            if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
                return false;
            } else {
                return isNegation(node.callee);
            }
        } else if (node.type === 'MemberExpression') {
            if (node.property.type === 'Identifier' && node.property.name === 'not') {
                return true;
            } else {
                return isNegation(node.object);
            }
        } else {
            assert(false, 'cannot be here');
            return null;
        }
    }

    // expect(foo).to.be.ok => assert(foo)
    // expect(foo).to.not.be.ok => assert(!foo)
    ast.find(j.MemberExpression, {
        type: 'MemberExpression',
        property: {
            type: 'Identifier',
            name: 'ok'
        },
        object: beginsWithExpect
    }).replaceWith(function (path) {
        var args = subjects(path.value);
        if (isNegation(path.value)) {
            return j.callExpression(j.identifier('assert'), [
                j.unaryExpression('!', args[0])
            ]);
        } else {
            return j.callExpression(j.identifier('assert'), args);
        }
    });

    // expect(foo).to.be.true => assert(foo === true)
    // expect(foo).to.not.be.true => assert(foo !== true)
    // expect(foo).to.be.false => assert(foo === false)
    // expect(foo).to.not.be.false => assert(foo !== false)
    ast.find(j.MemberExpression, {
        type: 'MemberExpression',
        property: function (node) {
            return node.type === 'Identifier' &&
                ['true', 'false'].indexOf(node.name) !== -1;
        },
        object: beginsWithExpect
    }).replaceWith(function (path) {
        var args = subjects(path.value);
        var rhs;
        switch (path.value.property.name) {
        case 'true':
            rhs = j.booleanLiteral(true);
            break;
        case 'false':
            rhs = j.booleanLiteral(false);
            break;
        default:
            assert(false, 'cannot be here');
        }
        return j.callExpression(j.identifier('assert'), [
            j.binaryExpression(
                isNegation(path.value) ? '!==' : '===',
                args[0],
                rhs
            )
        ]);
    });

    return ast.toSource({
        useTabs: false,
        quote: 'single'
    });
};
