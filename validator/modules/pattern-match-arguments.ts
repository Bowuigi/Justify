import { SystemRelationRule, System } from '../../formats/driver.ts';
import { displayIterable, ErrorStack, ModuleError, ModuleErrorInfo, Path } from '../module-common.ts';

// Used to create a mapping (moduleId -> formatError)
export const managedError = 'PMA' as const;

interface MissingPatterns extends ModuleError<typeof managedError, 'M'> {
  expectedPatterns: Set<string>,
  missingPatterns: Set<string>,
}

interface ExtraPatterns extends ModuleError<typeof managedError, 'E'> {
  expectedPatterns: Set<string>,
  extraPatterns: Set<string>,
}

// Used to type stuff later
export type PushedError = MissingPatterns | ExtraPatterns;

// One of the various possible handlers
export function onRule(errors: ErrorStack<PushedError>, path: Path, relationIdent: string, patterns: SystemRelationRule['patterns'], system: System) {
  const expectedPatterns = new Set(system.relations[relationIdent].arguments.map(a => a.id));
  const providedPatterns = new Set(Object.keys(patterns));
  const missingPatterns: Set<string> = expectedPatterns.difference(providedPatterns);
  const extraPatterns: Set<string> = providedPatterns.difference(expectedPatterns);

  if (missingPatterns.size !== 0) {
    errors.push({
      moduleId: 'PMA',
      id: 'PMA-M',
      sourceOfTruthLocation: ['system', 'relations', relationIdent, 'arguments'],
      location: path,
      expectedPatterns,
      missingPatterns
    });
  }

  if (extraPatterns.size !== 0) {
    errors.push({
      moduleId: 'PMA',
      id: 'PMA-E',
      sourceOfTruthLocation: ['system', 'relations', relationIdent, 'arguments'],
      location: path,
      expectedPatterns,
      extraPatterns
    });
  }
}

export function formatError(err: PushedError): ModuleErrorInfo {
  switch (err.id) {
    case 'PMA-M':
      return {
        message: `Missing ${displayIterable('argument', 'arguments', err.missingPatterns)}`,
        hints: [`The relation expects the following ${displayIterable('pattern', 'patterns', err.expectedPatterns)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
      };
    case 'PMA-E':
      return {
        message: `Extra ${displayIterable('argument', 'arguments', err.extraPatterns)}`,
        hints: [`The relation expects the following ${displayIterable('pattern', 'patterns', err.expectedPatterns)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
      };
  }
}
