import { SSystem } from '../formats/system';
import { SQuery } from '../formats/query';
import { parseFile } from '../formats/common';

async function main() {
  if (process.argv.length !== 4 || !['system','query','derivation-tree'].includes(process.argv[2])) {
    console.error('Wrong number of arguments.\nUsage: ${process.argv[1]} {system|query|derivation-tree} filename')
  }
}
main();
