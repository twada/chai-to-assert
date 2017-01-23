'use strict';

var assert = require('assert');
var FLAGS = [
    'deep',
    'itself',
    'length', 'lengthOf',
    'not'
];
var PRIMITIVE_TYPES = [
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
        return assert(false, 'cannot be here');
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

module.exports = function expectToAssert (file, api, options) {
    var j = api.jscodeshift;
    var ast = j(file.source);

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
        var flags = collectFlags(path.value, {});
        var hasFlag = function (flag) {
            return !!flags[flag];
        };
        var negation = hasFlag('not');
        var subject = subjects(path.value)[0];
        var rhs;
        switch (path.value.property.name) {
        case 'ok':
            if (negation) {
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
                negation ? '!==' : '===',
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
                        'above', 'gt', 'greaterThan',
                        'least', 'gte',
                        'below', 'lt', 'lessThan',
                        'most', 'lte',
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
        var flags = collectFlags(path.value, {});
        var hasFlag = function (flag) {
            return !!flags[flag];
        };
        var negation = hasFlag('not');
        var subject = subjects(path.value)[0];
        var matcherArg = path.value.arguments[0];
        switch (path.value.callee.property.name) {
        case 'a':
        case 'an':
            if (PRIMITIVE_TYPES.indexOf(matcherArg.value) !== -1) {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        negation ? '!==' : '===',
                        j.unaryExpression('typeof', subject),
                        matcherArg
                    )
                ]);
            } else if (matcherArg.value === 'null') {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        negation ? '!==' : '===',
                        subject,
                        j.literal(null)
                    )
                ]);
            } else {
                throw new Error('not supported yet');
            }
        case 'instanceof':
        case 'instanceOf':
            if (negation) {
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
            if (hasFlag('deep')) {
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('assert'),
                        negation ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
                    ),
                    [
                        subject,
                        matcherArg
                    ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        negation ? '!==' : '===',
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
                    negation ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
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
                    negation ? j.booleanLiteral(false) : j.booleanLiteral(true)
                )
            ]);
        case 'string':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    negation ? '===' : '!==',
                    j.callExpression(j.memberExpression(subject, j.identifier('indexOf')), [ matcherArg ]),
                    j.unaryExpression('-', j.literal(1))
                )
            ]);
        case 'respondTo':
        case 'respondsTo':
            if (subject.type === 'Identifier' && isFirstLetterCapital(subject.name) && !(hasFlag('itself'))) {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        '===',
                        j.unaryExpression('typeof', j.memberExpression(
                            j.memberExpression(subject, j.identifier('prototype')),
                            matcherArg, true)),
                        negation ? j.literal('undefined') : j.literal('function')
                    )
                ]);
            } else {
                return j.callExpression(j.identifier('assert'), [
                    j.binaryExpression(
                        '===',
                        j.unaryExpression('typeof', j.memberExpression(subject, matcherArg, true)),
                        negation ? j.literal('undefined') : j.literal('function')
                    )
                ]);
            }
        case 'length':
        case 'lengthOf':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    negation ? '!==' : '===',
                    j.memberExpression(subject, j.identifier('length')),
                    matcherArg
                )
            ]);
        case 'above':
        case 'gt':
        case 'greaterThan':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    negation ? '<=' : '>',
                    (hasFlag('lengthOf') || hasFlag('length')) ?
                        j.memberExpression(subject, j.identifier('length')) :
                        subject,
                    matcherArg
                )
            ]);
        case 'least':
        case 'gte':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    negation ? '<' : '>=',
                    (hasFlag('lengthOf') || hasFlag('length')) ?
                        j.memberExpression(subject, j.identifier('length')) :
                        subject,
                    matcherArg
                )
            ]);
        case 'below':
        case 'lt':
        case 'lessThan':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    negation ? '>=' : '<',
                    (hasFlag('lengthOf') || hasFlag('length')) ?
                        j.memberExpression(subject, j.identifier('length')) :
                        subject,
                    matcherArg
                )
            ]);
        case 'most':
        case 'lte':
            return j.callExpression(j.identifier('assert'), [
                j.binaryExpression(
                    negation ? '>' : '<=',
                    (hasFlag('lengthOf') || hasFlag('length')) ?
                        j.memberExpression(subject, j.identifier('length')) :
                        subject,
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
