import * as fs from 'node:fs/promises';
import * as util from 'node:util';
import * as process from 'node:process';
import { SSystem } from '../formats/system';
import { SQuery } from '../formats/query';
import { decodeFromJSON } from '../formats/common';
import * as MK from './mk';
import * as MKC from './mkCodegen';
import * as z from 'zod';

function prettyTerm(term: MK.Term): string {
  switch (term.kind) {
    case 'var':
      return `${term.id}@${term.counter}`;
    case 'literal':
      return `!${term.id}`;
    case 'constructor':
      return `${term.tag}(${term.args.map(prettyTerm)})`;
  }
}

type PrettyLog = { where: string, args: Array<string>, premises: Array<PrettyLog> };
function prettyLog(log: MK.RuleLog): PrettyLog {
  return {
    where: `[${log.relation}/${log.rule}]`,
    args: log.args.map(prettyTerm),
    premises: log.premises.map(prettyLog),
  };
}

async function parseFile<T extends z.core.$ZodType>(schema: T, schemaName: string, filename: string): Promise<z.infer<typeof schema>> {
  const result = decodeFromJSON(schema, await fs.readFile(filename, { encoding: 'utf-8' }));

  if (typeof result === 'string') {
    console.error(`Error while parsing ${schemaName}:\n${result}`);
    process.exit(1);
  }

  return result;
}

async function main() {
  if (process.argv.length !== 4) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} system-file query-file`);
    process.exit(1);
  }

  const [_node, _source, systemFile, queryFile] = process.argv;

  const system = await parseFile(SSystem, "System", systemFile);
  const query = await parseFile(SQuery, "Query", queryFile);
  const systemRelations = MKC.toRelationStore(system);

  try {
    const results = MK.run(
      query.max_results,
      MK.fresh(
        Object.keys(query.variables),
        pool => systemRelations[query.relation](
          query.args.map(a => MK.convertTermWithPool(a, pool, Object.keys(query.literals)))
        )
      )
    );

    const toRender = {
      amount: results.length,
      results: results.map(
        rslt => {
          if (rslt.log.length !== 1) {
            throw new Error(`Impossible: Log length ${rslt.log.length}`);
          }
          const subst = MK.toIdempotent(rslt.subst);
          return {
            subst: Object.fromEntries(
              subst.data.map(({ key, value }) => [`${key.id}@${key.counter}`, prettyTerm(value)])
            ),
            derivation: prettyLog(MK.walkLog(rslt.log[0], subst)),
          };
        }
      )
    };

    console.log(util.inspect(toRender, { compact: false, colors: true, depth: null }));
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Fatal error on execution (${err.name}):\n` + err.message);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}
main();
