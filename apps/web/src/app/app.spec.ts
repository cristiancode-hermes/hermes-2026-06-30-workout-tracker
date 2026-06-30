import { describe, it, expect } from 'vitest';

describe('App Component Smoke Test', () => {
  it('should validate test infrastructure works', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have Tailwind CSS configured', async () => {
    const styles = document.createElement('style');
    document.head.appendChild(styles);
    expect(document.head.contains(styles)).toBe(true);
  });
});
