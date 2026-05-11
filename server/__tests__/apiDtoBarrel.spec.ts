import { describe, expect, it } from 'vitest';

import * as dtoBarrel from '../appApi/types.js';

describe('app api dto barrel', () => {
  it('keeps the compatibility barrel runtime-safe', () => {
    expect(Object.keys(dtoBarrel)).toEqual([]);
  });
});
