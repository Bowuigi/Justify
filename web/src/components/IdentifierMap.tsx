// TODO: Identifier validation via an input validator wrapper (that works for both DynamicInput and input)
import { EditableList } from './EditableList';
import { Identifier, TexMath } from '../../../formats/codegen/ts/types';
import { Signal } from '@preact/signals';
import { DynamicInput } from './DynamicInput';

type IdentifierMapProps = {
  title: string,
  identifiers: Record<Identifier, TexMath>,
  onInput: (newIdents: Record<Identifier, TexMath>) => void,
  onDuplicateIdentifiers: () => void,
};

/// `onInput` is only called when the input does not include duplicate identifiers
export function IdentifierMap(props: IdentifierMapProps) {
  return (
    <div>
      <p>{props.title}</p>
      <EditableList<[Identifier, TexMath]>
        items={Object.entries(props.identifiers)}
        onInput={(items) => {
          if (items.length === new Map(items).size) {
            props.onInput(Object.fromEntries(items));
          } else {
            props.onDuplicateIdentifiers();
          }
        }}
        createEmptyItem={() => ['x', 'x']}
        renderItem={(entry, ix, update) => (
          <div>
            <span>{ix}</span>
            <DynamicInput
              value={entry[0]}
              onInput={s => update([s, entry[1]])}
              placeholder='t'
            />
            <DynamicInput
              value={entry[1]}
              onInput={s => update([entry[0], s])}
              placeholder='\\tau'
            />
          </div>
        )}
      />
    </div>
  );
}
