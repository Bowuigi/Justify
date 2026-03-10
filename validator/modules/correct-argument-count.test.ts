import type { System, Fixity, Term } from '../../formats/driver.ts';
import { testSystem } from '../testing-common.ts';

const sharedSyntax: System['syntax'] = {
  test: {
    description: 'Syntax category for testing',
    suggestions: ['t'],
    grammar: [
      {
        id: 'one',
        description: 'Test harness, takes exactly one argument',
        arguments: [{ from: 'identifier', id: 'x', tex: 'x' }],
        tex_parts: [],
        fixity: 'none' as Fixity,
      }
    ],
  }
};

function testConstructorCAC(kind: 'E' | 'M' | 'ok', args: Array<Term>) {
  testSystem(`CAC-${kind} in constructor`, {
    description: '',
    syntax: sharedSyntax,
    relations: {
      test: {
        description: '',
        fixity: 'none' as Fixity,
        arguments: [{ from: 'test', id: 't', tex: 't' }],
        tex_parts: [],
        rules: [{
          rule: { id: 'test_rule', tex: 'TestRule' },
          literals: { x: 'x' },
          variables: {},
          patterns: { t: { is: 'con', from: 'test', tag: 'one', args } },
          premises: [],
        }]
      }
    },
  },
    (kind === 'ok') ? [] : [{
      id: `CAC-${kind}`,
      sourceOfTruthLocation: ['system', 'syntax', 'test', 'one', 'arguments'],
      location: ['system', 'relations', 'test', 'rules', 'test_rule', 'patterns', 't'],
    }],
  );
};

testConstructorCAC('ok', [{ is: 'ref', to: 'x' }]);
testConstructorCAC('M', []);
testConstructorCAC('E', [{ is: 'ref', to: 'x' }, { is: 'ref', to: 'x' }]);

function testPremiseCAC(kind: 'E' | 'M' | 'ok', args: Array<Term>) {
  testSystem(`CAC-${kind} in premise`, {
    description: '',
    syntax: sharedSyntax,
    relations: {
      test: {
        description: '',
        fixity: 'none' as Fixity,
        arguments: [{ from: 'test', id: 't', tex: 't' }],
        tex_parts: [],
        rules: [{
          rule: { id: 'test_rule', tex: 'TestRule' },
          literals: {},
          variables: { t: 't' },
          patterns: { t: { is: 'ref', to: 't' } },
          premises: [{ relation: 'test', args }],
        }]
      }
    },
  },
    (kind === 'ok') ? [] : [{
      id: `CAC-${kind}`,
      sourceOfTruthLocation: ['system', 'relations', 'test', 'arguments'],
      location: ['system', 'relations', 'test', 'rules', 'test_rule', 'premises', 0],
    }],
  );
};

testPremiseCAC('ok', [{ is: 'ref', to: 't' }]);
testPremiseCAC('M', []);
testPremiseCAC('E', [{ is: 'ref', to: 't' }, { is: 'ref', to: 't' }]);
