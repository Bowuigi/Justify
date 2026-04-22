import { useMemo, useState } from 'preact/hooks';
import type * as T from '../../../../formats/codegen/ts/types.d.ts';
import { systemSyntaxData } from '../signals.js';
import { DynamicInput } from './DynamicInput';

interface TermRefProps {
  variables: Array<T.Identifier>;
  literals: Array<T.Identifier>;
}

interface TermConProps {
  synCat: T.Identifier;
}

interface TermProps extends TermConProps, TermRefProps { };

export function Term(props: TermProps) {
  const [mode, setMode] = useState('ref');
  const [output, setOutput] = useState({ is: 'ref', to: undefined });

  return (
    <div class='flat-row'>
      <select onInput={ev => setMode(ev.currentTarget.value)}>
        <option>ref</option>
        <option>con</option>
      </select>
      {mode === 'ref'
        ? (
          <TermRef
            literals={props.literals}
            variables={props.variables}
          />
        ) : (
          <TermCon
            synCat={props.synCat}
            literals={props.literals}
            variables={props.variables}
          />
        )}
    </div>
  );
}

function TermRef(props: TermRefProps) {
  return (
    <select>
      <optgroup label='Literals'>
        {props.literals.map((l, ix) => (
          <option key={ix}>{l}</option>
        ))}
      </optgroup>
      <optgroup label='Variables'>
        {props.variables.map((l, ix) => (
          <option key={ix}>{l}</option>
        ))}
      </optgroup>
    </select>
  );
}

function TermCon(props: TermProps) {
  const [con, setCon] = useState<T.Identifier>(Object.keys(systemSyntaxData.peek()[props.synCat])[0]);
  const availableConstructors = useMemo<Record<T.Identifier, Array<T.Identifier>>>(
    () => systemSyntaxData.value[props.synCat],
    [props.synCat],
  );

  return (
    <>
      <select onInput={ev => setCon(ev.currentTarget.value)}>
        {Object.keys(availableConstructors).map((c, ix) => (
          <option key={ix}>{c}</option>
        ))}
      </select>
      {systemSyntaxData.value[props.synCat][con]?.map((arg, ix) => (
        <div class='term-argument' key={ix}>
          {arg === 'literal'
            ? <DynamicInput onInput={console.log} placeholder='x' />
            : <Term synCat={arg} variables={props.variables} literals={props.literals} />}
        </div>
      ))}
    </>
  );
}
