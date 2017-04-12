'use strict';

var assert = require('assert');
var MATCHER_PROPERTIES = [
  'ok',
  'true',
  'false',
  'null',
  'undefined',
  'exist',
  'empty',
  'NaN',
  'finite',
  'extensible',
  'sealed',
  'frozen'
];
var MATCHER_METHODS = [
  'a', 'an',
  'include', 'contain', 'includes', 'contains',
  'equal', 'equals', 'eq', 'be',
  'eql', 'eqls',
  'property',
  'ownProperty', 'haveOwnProperty',
  'ownPropertyDescriptor', 'haveOwnPropertyDescriptor',
  'length', 'lengthOf',
  'above', 'gt', 'greaterThan',
  'least', 'gte',
  'below', 'lt', 'lessThan',
  'most', 'lte',
  'within',
  'closeTo', 'approximately',
  'instanceof', 'instanceOf',
  'match', 'matches',
  'oneOf',
  'string',
  'respondTo', 'respondsTo',
  'satisfy', 'satisfies',
  'throw', 'throws', 'Throw'
];
var FLAGS = [
  'deep',
  'itself',
  'length', 'lengthOf',
  'own',
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

function isBddStyleNode (node) {
  if (node.type === 'CallExpression') {
    if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
      return true;
    } else {
      return isBddStyleNode(node.callee);
    }
  } else if (node.type === 'MemberExpression') {
    if (node.property.type === 'Identifier' && node.property.name === 'should') {
      return true;
    } else {
      return isBddStyleNode(node.object);
    }
  }
  return false;
}

function collectFlagsAndSubjects (node, collector) {
  if (node.type === 'CallExpression') {
    if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
      collector['subjects'] = node.arguments;
      return collector;
    } else {
      return collectFlagsAndSubjects(node.callee, collector);
    }
  } else if (node.type === 'MemberExpression') {
    if (node.property.type === 'Identifier' && node.property.name === 'should') {
      collector['subjects'] = [node.object];
      return collector;
    } else if (node.property.type === 'Identifier' && FLAGS.indexOf(node.property.name) !== -1) {
      collector[node.property.name] = true;
    }
    return collectFlagsAndSubjects(node.object, collector);
  } else {
    return assert(false, 'cannot be here');
  }
}

module.exports = function bddApiToNodeAssert (file, api, options) {
  var j = api.jscodeshift;
  var ast = j(file.source);
  var assertion = function (node) {
    return j.callExpression(j.identifier('assert'), [node]);
  };

  ast.find(j.MemberExpression, {
    type: 'MemberExpression',
    property: function (node) {
      return node.type === 'Identifier' &&
        MATCHER_PROPERTIES.indexOf(node.name) !== -1;
    },
    object: isBddStyleNode
  }).replaceWith(function (path) {
    var matcherName = path.value.property.name;
    var flagsAndSubjects = collectFlagsAndSubjects(path.value, {});
    var hasFlag = function (flag) {
      return !!flagsAndSubjects[flag];
    };
    var negation = hasFlag('not');
    var subject = flagsAndSubjects['subjects'][0];
    var prependBangIfNegation = function (expr) {
      return negation ? j.unaryExpression('!', expr) : expr;
    };
    var strictEquality = function (left, right) {
      return assertion(j.binaryExpression(
        negation ? '!==' : '===',
        left,
        right
      ));
    };
    switch (matcherName) {
      case 'ok':
        return assertion(prependBangIfNegation(subject));
      case 'true':
        return strictEquality(subject, j.booleanLiteral(true));
      case 'false':
        return strictEquality(subject, j.booleanLiteral(false));
      case 'null':
        return strictEquality(subject, j.literal(null));
      case 'undefined':
        return strictEquality(subject, j.identifier('undefined'));
      case 'exist':
        return assertion(j.logicalExpression(
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
        ));
      case 'empty':
        return strictEquality(
          j.memberExpression(subject, j.identifier('length')),
          j.literal(0)
        );
      case 'NaN':
        return assertion(j.logicalExpression(
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
        ));
      case 'finite':
        return assertion(j.logicalExpression(
          negation ? '||' : '&&',
          j.binaryExpression(
            negation ? '!==' : '===',
            j.unaryExpression('typeof', subject),
            j.literal('number')
          ),
          prependBangIfNegation(j.callExpression(j.identifier('isFinite'), [subject]))
        ));
      case 'extensible':
        return assertion(j.logicalExpression(
          negation ? '||' : '&&',
          j.binaryExpression(
            negation ? '!==' : '===',
            subject,
            j.callExpression(j.identifier('Object'), [subject])
          ),
          prependBangIfNegation(j.callExpression(
            j.memberExpression(
              j.identifier('Object'),
              j.identifier('isExtensible')
            ),
            [subject]
          ))
        ));
      case 'sealed':
      case 'frozen':
        return assertion(j.conditionalExpression(
          j.binaryExpression(
            '===',
            subject,
            j.callExpression(j.identifier('Object'), [subject])
          ),
          prependBangIfNegation(j.callExpression(
            j.memberExpression(
              j.identifier('Object'),
              j.identifier(matcherName === 'sealed' ? 'isSealed' : 'isFrozen')
            ),
            [subject]
          )),
          negation ? j.booleanLiteral(false) : j.booleanLiteral(true)
        ));
      default:
        return assert(false, 'cannot be here');
    }
  });

  ast.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      property: function (node) {
        return node.type === 'Identifier' &&
          MATCHER_METHODS.indexOf(node.name) !== -1;
      },
      object: isBddStyleNode
    }
  }).replaceWith(function (path) {
    var flagsAndSubjects = collectFlagsAndSubjects(path.value, {});
    var hasFlag = function (flag) {
      return !!flagsAndSubjects[flag];
    };
    var negation = hasFlag('not');
    var subject = flagsAndSubjects['subjects'][0];
    var matcherArg = path.value.arguments[0];
    var prependBangIfNegation = function (expr) {
      return negation ? j.unaryExpression('!', expr) : expr;
    };
    var strictEquality = function (left, right) {
      return assertion(j.binaryExpression(
        negation ? '!==' : '===',
        left,
        right
      ));
    };
    var inequality = function (operator) {
      return assertion(j.binaryExpression(
        operator,
        (hasFlag('lengthOf') || hasFlag('length'))
          ? j.memberExpression(subject, j.identifier('length'))
          : subject,
        matcherArg
      ));
    };
    var deepEquality = function (actual, expected) {
      return j.callExpression(
        j.memberExpression(
          j.identifier('assert'),
          negation ? j.identifier('notDeepStrictEqual') : j.identifier('deepStrictEqual')
        ),
        [
          actual,
          expected
        ]);
    };
    var inclusion = function (spec) {
      return assertion(j.binaryExpression(
        negation ? '===' : '!==',
        j.callExpression(j.memberExpression(spec.haystack, j.identifier('indexOf')), [spec.needle]),
        j.unaryExpression('-', j.literal(1))
      ));
    };
    var hasOwnProp, propSpec;
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
      case 'include':
      case 'contain':
      case 'includes':
      case 'contains':
        return inclusion({
          haystack: subject,
          needle: matcherArg
        });
      case 'property':
        hasOwnProp = prependBangIfNegation(
          j.callExpression(j.memberExpression(subject, j.identifier('hasOwnProperty')), [matcherArg])
        );
        if (path.value.arguments.length === 2) {
          propSpec = {
            actual: j.memberExpression(subject, matcherArg, true),
            expected: path.value.arguments[1]
          };
          if (hasFlag('deep') && hasFlag('own')) {
            return j.sequenceExpression([
              assertion(hasOwnProp),
              deepEquality(propSpec.actual, propSpec.expected)
            ]);
          } else if (hasFlag('own')) {
            return assertion(j.logicalExpression(
              negation ? '||' : '&&',
              hasOwnProp,
              j.binaryExpression(negation ? '!==' : '===', propSpec.actual, propSpec.expected)
            ));
          } else if (hasFlag('deep')) {
            return deepEquality(propSpec.actual, propSpec.expected);
          } else {
            return strictEquality(propSpec.actual, propSpec.expected);
          }
        } else {
          if (hasFlag('own')) {
            return assertion(hasOwnProp);
          } else {
            return assertion(prependBangIfNegation(j.binaryExpression(
              'in',
              matcherArg,
              subject
            )));
          }
        }
      case 'ownProperty':
      case 'haveOwnProperty':
        hasOwnProp = prependBangIfNegation(
          j.callExpression(j.memberExpression(subject, j.identifier('hasOwnProperty')), [matcherArg])
        );
        if (path.value.arguments.length === 2) {
          propSpec = {
            actual: j.memberExpression(subject, matcherArg, true),
            expected: path.value.arguments[1]
          };
          if (hasFlag('deep')) {
            return j.sequenceExpression([
              assertion(hasOwnProp),
              deepEquality(propSpec.actual, propSpec.expected)
            ]);
          } else {
            return assertion(j.logicalExpression(
              negation ? '||' : '&&',
              hasOwnProp,
              j.binaryExpression(negation ? '!==' : '===', propSpec.actual, propSpec.expected)
            ));
          }
        }
        return assertion(hasOwnProp);
      case 'ownPropertyDescriptor':
      case 'haveOwnPropertyDescriptor':
        var getOwnPropDesc = j.callExpression(
          j.memberExpression(
            j.identifier('Object'),
            j.identifier('getOwnPropertyDescriptor')
          ),
          [
            j.callExpression(j.identifier('Object'), [subject]),
            matcherArg
          ]
        );
        if (path.value.arguments.length === 2) {
          return deepEquality(getOwnPropDesc, path.value.arguments[1]);
        } else {
          return assertion(prependBangIfNegation(getOwnPropDesc));
        }
      case 'instanceof':
      case 'instanceOf':
        return assertion(prependBangIfNegation(j.binaryExpression(
          'instanceof',
          subject,
          matcherArg
        )));
      case 'equal':
      case 'equals':
      case 'eq':
      case 'be':
        if (hasFlag('deep')) {
          return deepEquality(subject, matcherArg);
        } else {
          return strictEquality(subject, matcherArg);
        }
      case 'eql':
      case 'eqls':
        return deepEquality(subject, matcherArg);
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
        return strictEquality(
          j.memberExpression(subject, j.identifier('length')),
          matcherArg
        );
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
          return assertion(j.logicalExpression(
            '||',
            j.binaryExpression('<', subjectOrItsLength, path.value.arguments[0]),
            j.binaryExpression('<', path.value.arguments[1], subjectOrItsLength)
          ));
        } else {
          return assertion(j.logicalExpression(
            '&&',
            j.binaryExpression('<=', path.value.arguments[0], subjectOrItsLength),
            j.binaryExpression('<=', subjectOrItsLength, path.value.arguments[1])
          ));
        }
      case 'closeTo':
      case 'approximately':
        return assertion(j.binaryExpression(
          negation ? '>' : '<=',
          j.callExpression(j.memberExpression(j.identifier('Math'), j.identifier('abs')), [
            j.binaryExpression('-', subject, matcherArg)
          ]),
          path.value.arguments[1]
        ));
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
