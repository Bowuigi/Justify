import { Signal } from "@preact/signals";
import { useRef, useState } from "preact/hooks";

type IdentifierMapProps = {
  title: string,
  signal: Signal<Record<string, string>>,
}

export function IdentifierMap(props: IdentifierMapProps) {
  const newIdElem = useRef<HTMLInputElement>();
  const newTeXElem = useRef<HTMLInputElement>();

  return (
    <div>
      <p>{props.title}</p>
      <div>
        {Object.entries(props.signal.value).map(([id, tex], ix) => {
          return (
            <div key={ix}>
              <input type='text' value={id} />
              <input type='text' value={tex} />
              <button onClick={() => {
                // TODO: Correctly filter this
                props.signal.value = { ...props.signal.value, [newIdElem.current.value]: newTeXElem.current.value };
              }}>-</button>
            </div>
          );
        })}
        <div>
          <input type='text' ref={newIdElem} />
          <input type='text' ref={newTeXElem} />
          <button onClick={() => {
            props.signal.value = { ...props.signal.value, [newIdElem.current.value]: newTeXElem.current.value };
          }}>+</button>
        </div>
      </div>
    </div>
  );
}
