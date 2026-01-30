import * as util from 'node:util';
import { default as process } from 'node:process';
import { parseQuery, parseSystem } from '../formats/driver.ts';
import * as MK from './mk.ts';
import * as MKC from './mkCodegen.ts';

function prettyTerm(term: MK.Term): string {
  switch (term.kind) {
    case 'var':
      return util.styleText('magenta', `${term.id}@${term.counter}`);
    case 'literal':
      return util.styleText('yellow', `!${term.id}`);
    case 'constructor':
      return (
        util.styleText('blue', term.tag) +
        '(' + term.args.map(prettyTerm).join(util.styleText('bold', ', ')) + ')'
      );
  }
}

function prettyLog(log: MK.RuleLog): string {
  const single = (indent: number, l: MK.RuleLog): string => (
    util.styleText('gray', '│ ').repeat(indent) +
    '[' + util.styleText('green', l.rule) + '] ' +
    util.styleText('cyan', l.relation) +
    '(' + l.args.map(prettyTerm).join(util.styleText('bold', ', ')) + ')'
  );

  const loop = (indent: number, l: MK.RuleLog): string =>
    `${single(indent, l)}\n${l.premises.map((p) => loop(indent + 1, p)).join("")}`;

  return loop(0, log);
}

async function main() {
  if (process.argv.length !== 4) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} system-file query-file`);
    process.exitCode = 1;
    return;
  }

  const [_node, _source, systemFile, queryFile] = process.argv;

  const system = await parseSystem(systemFile);
  const query = await parseQuery(queryFile);

  if (system === null || query === null) {
    process.exitCode = 1;
    return;
  }
  const systemRelations = MKC.toRelationStore(system);

  try {
    const results = MK.run(
      query.max_results,
      MK.fresh(Object.keys(query.variables), pool =>
        systemRelations[query.relation](
          query.args.map(a => MK.convertTermWithPool(a, pool, Object.keys(query.literals)))
        )
      )
    );

    console.log(
      results.map(rslt => {
          if (rslt.log.length !== 1) {
            throw new Error(`Impossible: Log length ${rslt.log.length}`);
          }
          return prettyLog(MK.walkLog(rslt.log[0], MK.toIdempotent(rslt.subst)));
        }
      ).join('\n')
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Fatal error on execution (${err.name}):\n` + err.message);
    } else {
      console.error(err);
    }
    process.exitCode = 1;
    return;
  }
}
main();
