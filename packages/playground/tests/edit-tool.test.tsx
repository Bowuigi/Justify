import { render } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';

import { EditTool } from '../components/edit-tool.tsx';

describe('EditTool', () => {
  it('shows the base system in the editor after mount', () => {
    const { container } = render(<EditTool />);

    const code = container.querySelector('code')!;
    expect(code.textContent).toContain('Starter System, natural numbers');
  });
});
