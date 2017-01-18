'use strict';

module.exports = function expectToAssert (file, api, options) {
    var j = api.jscodeshift;
    var ast = j(file.source);

    // expect(foo).to.be.ok => assert(foo)
    ast.find(j.MemberExpression, {
        type: 'MemberExpression',
        object: {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'expect'
                    }
                },
                property: {
                    type: 'Identifier',
                    name: 'to'
                }
            },
            property: {
                type: 'Identifier',
                name: 'be'
            }
        },
        property: {
            type: 'Identifier',
            name: 'ok'
        }
    }).replaceWith(function (path) {
        return j.callExpression(j.identifier('assert'), path.value.object.object.object.arguments);
    });

    // expect(foo).to.be.true => assert(foo === true)
    ast.find(j.MemberExpression, {
        type: 'MemberExpression',
        object: {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'expect'
                    }
                },
                property: {
                    type: 'Identifier',
                    name: 'to'
                }
            },
            property: {
                type: 'Identifier',
                name: 'be'
            }
        },
        property: {
            type: 'Identifier',
            name: 'true'
        }
    }).replaceWith(function (path) {
        return j.callExpression(j.identifier('assert'), [
            j.binaryExpression(
                '===',
                path.value.object.object.object.arguments[0],
                j.booleanLiteral(true)
            )
        ]);
    });

    return ast.toSource({
        useTabs: false,
        quote: 'single'
    });
};
