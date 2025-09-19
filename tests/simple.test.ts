import { describe, it, expect } from '@jest/globals';

describe('Tests de base', () => {
  it('devrait passer un test simple', () => {
    expect(1 + 1).toBe(2);
  });

  it('devrait vérifier que Jest fonctionne', () => {
    expect(true).toBe(true);
  });
});
