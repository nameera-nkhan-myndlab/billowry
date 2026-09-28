import fs from 'fs';
import path from 'path';

describe('dark theme tokens', () => {
  const css = fs.readFileSync(path.join(__dirname, '../styles/globals.css'), 'utf8');
  const tw = require('../../tailwind.config.js');

  it('defines brand, accent and monospace font', () => {
    expect(css).toContain('--color-primary: #00D5D8');
    expect(css).toContain('--color-accent: #7C3AED');
    expect(css).toContain('JetBrains Mono');
    expect(css).toContain('color-scheme: dark');
  });

  it('tailwind uses new tokens and 12px radius', () => {
    expect(tw.theme.extend.colors.primary.DEFAULT).toBe('#00D5D8');
    expect(tw.theme.extend.colors.accent.DEFAULT).toBe('#7C3AED');
    expect(tw.theme.extend.borderRadius.card).toBe('12px');
  });
});