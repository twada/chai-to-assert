'use strict';

var assert = require('assert');

module.exports = function expectToAssert (file, api, options) {
    var j = api.jscodeshift;
    var ast = j(file.source);
    var FLAGS = [
        'deep',
        'itself',
        'not'
    ];
    var primitiveTypes = [
        'undefined',
        'string',
        'number',
        'boolean',
        'function',
        'object',
        'symbol'
    ];

    function isFirstLetterCapital (str) {
        return str.charAt(0) === str.charAt(0).toUpperCase();
    }

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

    function collectFlags (node, collector) {
        if (node.type === 'CallExpression') {
            if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
                return collector;
            } else {
                return collectFlags(node.callee, collector);
            }
        } else if (node.type === 'MemberExpression') {
            if (node.property.type === 'Identifier' && FLAGS.indexOf(node.property.name) !== -1) {
                collector[node.property.name] = true;
            }
            return collectFlags(node.object, collector);
        } else {
            return assert(false, 'cannot be here');
        }
    }

    function hasFlag (flag, node) {
        return !!collectFlags(node, {})[flag];
    }

    function isNegation (node) {
        return hasFlag('not', node);
    }

    function isDeep (node) {
        return hasFlag('deep', node);
    }

    ast.find(j.MemberExpression, {
        type: 'MemberExpression',
        property: function (node) {
            return node.type === 'Identifier' &&
                [
                    'ok',
                    'true',
                    'false',
                    'null',
                    'undefined'
                ].indexOf(node.name) !== -1;
        },
        object: beginsWithExpect
    }).replaceWith(function (path) {
        var subject = subjects(path.value)[0];
        var rhs;
        switch (path.value.property.name) {
        case 'ok':
            if (isNegation(path.value)) {
                return j.callExpression(j.identifier('assert'), [
                    j.unaryExpression('!', subject)
                ]);
            } else {
                return j.callExpression(j.identifier('assert'), [ subject ]);
            }
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

    ast.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            property: function (node) {
                return node.type === 'Identifier' &&
                    [
                        'a', 'an',
                        'equal', 'equals', 'eq',
                        'eql', 'eqls',
                        'instanceof', 'instanceOf',
                        'length', 'lengthOf',
                        'match', 'matches',
                        'respondTo', 'respondsTo',
                        'string'
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
        case 'string':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    isNegation(path.value) ? '===' : '!==',
                    j.callExpression(j.memberExpression(subject, j.identifier('indexOf')), [ matcherArg ]),
                    j.unaryExpression('-', j.literal(1))
                )
            ]);
        case 'respondTo':
        case 'respondsTo':
            if (subject.type === 'Identifier' && isFirstLetterCapital(subject.name) && !(hasFlag('itself', path.value))) {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        '===',
                        j.unaryExpression('typeof', j.memberExpression(
                            j.memberExpression(subject, j.identifier('prototype')),
                            matcherArg, true)),
                        isNegation(path.value) ? j.literal('undefined') : j.literal('function')
                    )
                ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        '===',
                        j.unaryExpression('typeof', j.memberExpression(subject, matcherArg, true)),
                        isNegation(path.value) ? j.literal('undefined') : j.literal('function')
                    )
                ]);
            }
        case 'length':
        case 'lengthOf':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    isNegation(path.value) ? '!==' : '===',
                    j.memberExpression(subject, j.identifier('length')),
                    matcherArg
                )
            ]);
        default:
            assert(false, 'cannot be here');
            return null;
        }
    });

    return ast.toSource();
};
