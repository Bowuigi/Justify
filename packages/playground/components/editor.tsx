import type { Signal } from '@preact/signals';
import { CodeJar } from 'codejar';
import { withLineNumbers } from 'codejar-linenumbers';
import { useEffect, useRef } from 'preact/hooks';
//// Ensure Prism and all the language definitions needed are loaded before usage
import * as Prism from 'prismjs';
import type { JSX, PropsWithoutRef } from 'react-dom/src/index.js';

import '../lib/prism-languages.ts';
////

import '../prism.css';
import 'codejar-linenumbers/es/codejar-linenumbers.css';

interface EditorProps {
  buffer: Signal<string>;
}

export function Editor(props: PropsWithoutRef<EditorProps>): JSX.Element {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current === null) return;

    const jar = CodeJar(ref.current, withLineNumbers(Prism.highlightElement), { tab: '  ' });
    jar.updateCode(props.buffer.value);

    const handleInput = (): void => {
      props.buffer.value = jar.toString();
    };

    ref.current.addEventListener('input', handleInput);
    return () => {
      ref.current?.removeEventListener('input', handleInput);
    };
  }, []);

  return (
    <pre class="h-full w-full">
      <code ref={ref} class="language-markdown block h-full w-full"></code>
    </pre>
  );
}
