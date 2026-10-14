import type { Signal } from '@preact/signals';
import { CodeJar } from 'codejar';
import { withLineNumbers } from 'codejar-linenumbers';
import { useEffect, useRef } from 'preact/hooks';
// Ensure Prism is loaded before the side effect imports
import * as Prism from 'prismjs';
import type { JSX, PropsWithoutRef } from 'react-dom/src/index.js';
////
// Languages included here will be enabled for the editor component
// @ts-expect-error 2882
import 'prismjs/components/prism-markup';
// @ts-expect-error 2882
import 'prismjs/components/prism-markdown';
////

// TODO: Make a theme that uses DaisyUI colors
import 'prismjs/themes/prism.css';

interface EditorProps {
  buffer: Signal<string>;
}

export function Editor(props: PropsWithoutRef<EditorProps>): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current === null) return;

    const jar = CodeJar(ref.current, withLineNumbers(Prism.highlightElement), { tab: '\t' });
    jar.updateCode(props.buffer.value);

    const handleInput = (): void => {
      props.buffer.value = jar.toString();
    };

    ref.current.addEventListener('input', handleInput);
    return () => {
      ref.current?.removeEventListener('input', handleInput);
    };
  }, []);

  return <div ref={ref} class="language-markdown"></div>;
}
