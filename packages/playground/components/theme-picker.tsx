import { useEffect, useState, type Dispatch, type StateUpdater } from 'preact/hooks';
import type { JSX } from 'preact/jsx-runtime';

const themes = [
  { id: 'custom-light', label: 'Light' },
  { id: 'custom-dark', label: 'Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'night', label: 'Night' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'winter', label: 'Winter' },
] as const;

function useSelectedTheme(): [string, Dispatch<StateUpdater<string>>] {
  const [selectedTheme, setSelectedTheme] = useState(() => {
    const preferredDefault = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'custom-dark'
      : 'custom-light';
    const chosen = localStorage.getItem('selected-theme');
    return chosen ?? preferredDefault;
  });

  useEffect(() => {
    localStorage.setItem('selected-theme', selectedTheme);
  }, [selectedTheme]);

  return [selectedTheme, setSelectedTheme];
}

export function ThemePicker(): JSX.Element {
  const [selectedTheme, setSelectedTheme] = useSelectedTheme();

  return (
    <div class="dropdown dropdown-end">
      <div tabindex={0} role="button" class="btn btn-ghost btn-sm">
        Theme
      </div>
      <ul
        tabindex={0}
        class="dropdown-content menu bg-base-200 rounded-box z-10 w-44 p-2 shadow-sm w-fit">
        {themes.map(theme => (
          <li key={theme.id}>
            <input
              type="radio"
              name="theme-picker"
              class="theme-controller btn btn-ghost btn-sm after:justify-self-left px-4"
              aria-label={theme.label}
              value={theme.id}
              checked={theme.id === selectedTheme}
              onChange={ev => {
                if (ev.currentTarget.checked) setSelectedTheme(theme.id);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
