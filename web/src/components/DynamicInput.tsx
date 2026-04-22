import { useState, useRef, useEffect } from 'preact/hooks';

interface DynamicInputProps {
  value?: string;
  onInput: (value: string) => void;
  placeholder?: string;
}

export function DynamicInput({ 
  value = '', 
  onInput,
  placeholder = 'x',
}: DynamicInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update width based on content
  useEffect(() => {
    if (spanRef.current && inputRef.current) {
      const width = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${width}px`;
    }
  }, [inputValue]);

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;
    setInputValue(newValue);
    onInput(newValue);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Hidden span for measuring text width */}
      <span
        ref={spanRef}
        style={{
          visibility: 'hidden',
          position: 'absolute',
          whiteSpace: 'pre',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontWeight: 'inherit',
          pointerEvents: 'none',
          margin: 0,
          padding: 0,
          top: 0,
          left: 0
        }}
      >
        {inputValue || placeholder}
      </span>
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onInput={handleInput}
        placeholder={placeholder}
        style={{width: 0, boxSizing: 'content-box', fontSize: 'inherit', fontFamily: 'inherit'}}
      />
    </div>
  );
}
