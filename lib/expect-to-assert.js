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
  var assertion = function (node) {
    return j.callExpression(j.identifier('assert'), [node]);
  };

  ast.find(j.MemberExpression, {
    type: 'MemberExpression',
    property: function (node) {
      return node.type === 'Identifier' &&
        [
          'ok',
          'true',
          'false',
          'null',
          'finite',
          'NaN',
          'exist',
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
    var prependBangIfNegation = function (expr) {
      return negation ? j.unaryExpression('!', expr) : expr;
    };
    var rhs;
    switch (path.value.property.name) {
      case 'ok':
        return assertion(prependBangIfNegation(subject));
      case 'finite':
        return assertion(
          j.logicalExpression(
            negation ? '||' : '&&',
            j.binaryExpression(
              negation ? '!==' : '===',
              j.unaryExpression('typeof', subject),
              j.literal('number')
            ),
            prependBangIfNegation(j.callExpression(j.identifier('isFinite'), [subject]))
          )
        );
      case 'NaN':
        return assertion(
          j.logicalExpression(
            negation ? '||' : '&&',
            j.binaryExpression(
              negation ? '!==' : '===',
              j.unaryExpression('typeof', subject),
              j.literal('number')
            ),
            j.binaryExpression(
              negation ? '===' : '!==',
              subject,
              subject
            )
          )
        );
      case 'exist':
        return assertion(
          j.logicalExpression(
            negation ? '||' : '&&',
            j.binaryExpression(
              negation ? '===' : '!==',
              subject,
              j.literal(null)
            ),
            j.binaryExpression(
              negation ? '===' : '!==',
              subject,
              j.identifier('undefined')
            )
          )
        );
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
    return assertion(
      j.binaryExpression(
        negation ? '!==' : '===',
        subject,
        rhs
      )
    );
  });

  ast.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      property: function (node) {
        return node.type === 'Identifier' &&
          [
            'a', 'an',
            'property',
            'above', 'gt', 'greaterThan',
            'least', 'gte',
            'below', 'lt', 'lessThan',
            'most', 'lte',
            'within',
            'equal', 'equals', 'eq',
            'eql', 'eqls',
            'instanceof', 'instanceOf',
            'length', 'lengthOf',
            'match', 'matches',
            'respondTo', 'respondsTo',
            'satisfy', 'satisfies',
            'throw', 'throws', 'Throw',
            'oneOf',
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
    var prependBangIfNegation = function (expr) {
      return negation ? j.unaryExpression('!', expr) : expr;
    };
    var strictEquality = function (left, right) {
      return assertion(
        j.binaryExpression(
          negation ? '!==' : '===',
          left,
          right
        )
      );
    };
    var inequality = function (operator) {
      return assertion(
        j.binaryExpression(
          operator,
          (hasFlag('lengthOf') || hasFlag('length'))
            ? j.memberExpression(subject, j.identifier('length'))
            : subject,
          matcherArg
        )
      );
    };
    var deepEquality = function () {
      return j.callExpression(
        j.memberExpression(
          j.identifier('assert'),
          negation ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
        ),
        [
          subject,
          matcherArg
        ]);
    };
    var inclusion = function (spec) {
      return assertion(
        j.binaryExpression(
          negation ? '===' : '!==',
          j.callExpression(j.memberExpression(spec.haystack, j.identifier('indexOf')), [spec.needle]),
          j.unaryExpression('-', j.literal(1))
        )
      );
    };
    switch (path.value.callee.property.name) {
      case 'a':
      case 'an':
        if (PRIMITIVE_TYPES.indexOf(matcherArg.value) !== -1) {
          return strictEquality(j.unaryExpression('typeof', subject), matcherArg);
        } else if (matcherArg.value === 'null') {
          return strictEquality(subject, j.literal(null));
        } else {
          break;
        }
      case 'property':
        return assertion(
          prependBangIfNegation(j.binaryExpression(
            'in',
            matcherArg,
            subject
          ))
        );
      case 'instanceof':
      case 'instanceOf':
        return assertion(
          prependBangIfNegation(j.binaryExpression(
            'instanceof',
            subject,
            matcherArg
          ))
        );
      case 'equal':
      case 'equals':
      case 'eq':
        if (hasFlag('deep')) {
          return deepEquality();
        } else {
          return strictEquality(subject, matcherArg);
        }
      case 'eql':
      case 'eqls':
        return deepEquality();
      case 'match':
      case 'matches':
        return assertion(
          j.binaryExpression(
            '===',
            j.callExpression(j.memberExpression(matcherArg, j.identifier('test')), [subject]),
            negation ? j.booleanLiteral(false) : j.booleanLiteral(true)
          )
        );
      case 'string':
        return inclusion({
          haystack: subject,
          needle: matcherArg
        });
      case 'oneOf':
        return inclusion({
          haystack: matcherArg,
          needle: subject
        });
      case 'respondTo':
      case 'respondsTo':
        var receiver;
        if (subject.type === 'Identifier' && isFirstLetterCapital(subject.name) && !(hasFlag('itself'))) {
          receiver = j.memberExpression(subject, j.identifier('prototype'));
        } else {
          receiver = subject;
        }
        return strictEquality(
          j.unaryExpression('typeof', j.memberExpression(receiver, matcherArg, true)),
          j.literal('function')
        );
      case 'satisfy':
      case 'satisfies':
        return assertion(
          prependBangIfNegation(
            j.callExpression(matcherArg, [subject])
          )
        );
      case 'length':
      case 'lengthOf':
        return strictEquality(j.memberExpression(subject, j.identifier('length')), matcherArg);
      case 'above':
      case 'gt':
      case 'greaterThan':
        return inequality(negation ? '<=' : '>');
      case 'least':
      case 'gte':
        return inequality(negation ? '<' : '>=');
      case 'below':
      case 'lt':
      case 'lessThan':
        return inequality(negation ? '>=' : '<');
      case 'most':
      case 'lte':
        return inequality(negation ? '>' : '<=');
      case 'within':
        var subjectOrItsLength = (hasFlag('lengthOf') || hasFlag('length'))
          ? j.memberExpression(subject, j.identifier('length'))
          : subject;
        if (negation) {
          return assertion(
            j.logicalExpression(
              '||',
              j.binaryExpression(
                '<',
                subjectOrItsLength,
                path.value.arguments[0]
              ),
              j.binaryExpression(
                '<',
                path.value.arguments[1],
                subjectOrItsLength
              )
            )
          );
        } else {
          return assertion(
            j.logicalExpression(
              '&&',
              j.binaryExpression(
                '<=',
                path.value.arguments[0],
                subjectOrItsLength
              ),
              j.binaryExpression(
                '<=',
                subjectOrItsLength,
                path.value.arguments[1]
              )
            )
          );
        }
      case 'throw':
      case 'throws':
      case 'Throw':
        var errorMatcher;
        if (path.value.arguments.length < 2) {
          errorMatcher = path.value.arguments;
        } else {
          errorMatcher = j.functionExpression(null, [j.identifier('err')], j.blockStatement([
            j.returnStatement(j.logicalExpression(
              '&&',
              j.binaryExpression('instanceof', j.identifier('err'), path.value.arguments[0]),
              j.callExpression(j.memberExpression(path.value.arguments[1], j.identifier('test')),
                [
                  j.memberExpression(j.identifier('err'), j.identifier('message'))
                ])
            ))
          ]));
        }
        return j.callExpression(
          j.memberExpression(
            j.identifier('assert'),
            negation ? j.identifier('doesNotThrow') : j.identifier('throws')
          ), [subject].concat(errorMatcher));
      default:
        return assert(false, 'cannot be here');
    }
  });

  return ast.toSource();
};
