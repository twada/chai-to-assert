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

    function isDeep (node) {
        if (node.type === 'CallExpression') {
            if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
                return false;
            } else {
                return isDeep(node.callee);
            }
        } else if (node.type === 'MemberExpression') {
            if (node.property.type === 'Identifier' && node.property.name === 'deep') {
                return true;
            } else {
                return isDeep(node.object);
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
    // expect(foo).to.be.null => assert(foo === null)
    // expect(foo).to.not.be.null => assert(foo !== null)
    // expect(foo).to.be.undefined => assert(foo === undefined)
    // expect(foo).to.not.be.undefined => assert(foo !== undefined)
    ast.find(j.MemberExpression, {
        type: 'MemberExpression',
        property: function (node) {
            return node.type === 'Identifier' &&
                ['true', 'false', 'null', 'undefined'].indexOf(node.name) !== -1;
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
        case 'null':
            rhs = j.literal(null);
            break;
        case 'undefined':
            rhs = j.identifier('undefined');
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

    var primitiveTypes = [
        'undefined',
        'string',
        'number',
        'boolean',
        'function',
        'object',
        'symbol'
    ];

    // expect(foo).to.equal(bar) => assert(foo === bar)
    // expect(foo).to.deep.equal(bar) => assert.deepStrictEqual(foo, bar)
    // expect(foo).to.eql(bar) => assert.deepStrictEqual(foo, bar)
    ast.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            property: function (node) {
                return node.type === 'Identifier' &&
                    [
                        'a',
                        'an',
                        'instanceof',
                        'instanceOf',
                        'match',
                        'matches',
                        'equal',
                        'equals',
                        'eq',
                        'eql',
                        'eqls'
                    ].indexOf(node.name) !== -1;
            },
            object: beginsWithExpect
        }
    }).replaceWith(function (path) {
        var args = subjects(path.value);
        var rhs;
        switch (path.value.callee.property.name) {
        case 'a':
        case 'an':
            rhs = path.value.arguments[0];
            if (primitiveTypes.indexOf(rhs.value) !== -1) {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        isNegation(path.value) ? '!==' : '===',
                        j.unaryExpression('typeof', args[0]),
                        rhs
                    )
                ]);
            } else if (rhs.value === 'null') {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        isNegation(path.value) ? '!==' : '===',
                        args[0],
                        rhs = j.literal(null)
                    )
                ]);
            } else {
                throw new Error('not supported yet');
            }
        case 'instanceof':
        case 'instanceOf':
            rhs = path.value.arguments[0];
            if (isNegation(path.value)) {
                return j.callExpression(j.identifier('assert'), [
                    j.unaryExpression('!', j.binaryExpression(
                        'instanceof',
                        args[0],
                        rhs
                    ))
                ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        'instanceof',
                        args[0],
                        rhs
                    )
                ]);
            }
        case 'equal':
        case 'equals':
        case 'eq':
            rhs = path.value.arguments[0];
            if (isDeep(path.value)) {
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('assert'),
                        isNegation(path.value) ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
                    ),
                    [
                        args[0],
                        rhs
                    ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        isNegation(path.value) ? '!==' : '===',
                        args[0],
                        rhs
                    )
                ]);
            }
        case 'eql':
        case 'eqls':
            rhs = path.value.arguments[0];
            return j.callExpression(
                j.memberExpression(
                    j.identifier('assert'),
                    isNegation(path.value) ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
                ),
                [
                    args[0],
                    rhs
                ]);
        case 'match':
        case 'matches':
            rhs = path.value.arguments[0];
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    '===',
                    j.callExpression(j.memberExpression(rhs, j.identifier('test')), [ args[0] ]),
                    isNegation(path.value) ? j.booleanLiteral(false) : j.booleanLiteral(true)
                )
            ]);
        default:
            assert(false, 'cannot be here');
            return null;
        }
    });

    return ast.toSource();
};
