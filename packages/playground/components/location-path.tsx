import type { JSX } from 'preact/jsx-runtime';

interface LocationPathProps {
  path: Array<string | number>;
}

export function LocationPath({ path }: LocationPathProps): JSX.Element {
  return (
    <div class="breadcrumbs">
      <ul>
        {path.map((segment, index) => (
          <li key={index}>{String(segment)}</li>
        ))}
      </ul>
    </div>
  );
}
