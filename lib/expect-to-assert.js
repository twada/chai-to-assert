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
        var subject = subjects(path.value)[0];
        if (isNegation(path.value)) {
            return j.callExpression(j.identifier('assert'), [
                j.unaryExpression('!', subject)
            ]);
        } else {
            return j.callExpression(j.identifier('assert'), [ subject ]);
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
        var subject = subjects(path.value)[0];
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
                subject,
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
        var subject = subjects(path.value)[0];
        var matcherArg = path.value.arguments[0];
        switch (path.value.callee.property.name) {
        case 'a':
        case 'an':
            if (primitiveTypes.indexOf(matcherArg.value) !== -1) {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        isNegation(path.value) ? '!==' : '===',
                        j.unaryExpression('typeof', subject),
                        matcherArg
                    )
                ]);
            } else if (matcherArg.value === 'null') {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        isNegation(path.value) ? '!==' : '===',
                        subject,
                        j.literal(null)
                    )
                ]);
            } else {
                throw new Error('not supported yet');
            }
        case 'instanceof':
        case 'instanceOf':
            if (isNegation(path.value)) {
                return j.callExpression(j.identifier('assert'), [
                    j.unaryExpression('!', j.binaryExpression(
                        'instanceof',
                        subject,
                        matcherArg
                    ))
                ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        'instanceof',
                        subject,
                        matcherArg
                    )
                ]);
            }
        case 'equal':
        case 'equals':
        case 'eq':
            if (isDeep(path.value)) {
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('assert'),
                        isNegation(path.value) ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
                    ),
                    [
                        subject,
                        matcherArg
                    ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        isNegation(path.value) ? '!==' : '===',
                        subject,
                        matcherArg
                    )
                ]);
            }
        case 'eql':
        case 'eqls':
            return j.callExpression(
                j.memberExpression(
                    j.identifier('assert'),
                    isNegation(path.value) ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
                ),
                [
                    subject,
                    matcherArg
                ]);
        case 'match':
        case 'matches':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    '===',
                    j.callExpression(j.memberExpression(matcherArg, j.identifier('test')), [ subject ]),
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
