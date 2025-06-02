import { describe, it, expect, vi } from 'vitest';
import { generateUserId, verifyApartmentInput } from '$lib/server/auth/user';

describe('generateUserId', () => {
  it('should generate IDs of consistent length', () => {
    const id1 = generateUserId();
    const id2 = generateUserId();

    expect(id1).toHaveLength(24);
    expect(id2).toHaveLength(24);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      ids.add(generateUserId());
    }

    expect(ids.size).toBe(iterations);
  });

  it('should generate IDs containing only lowercase base32 characters', () => {
    const id = generateUserId();
    const base32Regex = /^[a-z2-7]+$/;
    expect(id).toMatch(base32Regex);
  });

  it('should generate IDs that are strings', () => {
    const id = generateUserId();
    expect(typeof id).toBe('string');
  });

  it('should handle crypto.getRandomValues being called', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');

    generateUserId();

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(expect.any(Uint8Array));

    spy.mockRestore();
  });
});

describe('verifyApartmentInput', () => {
  describe('valid cases - comprehensive boundary testing', () => {
    it('should accept all valid apartment combinations', () => {
      const buildings = ['A', 'B', 'C', 'D'];
      const floors = ['0', '1', '2', '3'];
      const units = ['1', '2'];

      let validCount = 0;
      buildings.forEach(building => {
        floors.forEach(floor => {
          units.forEach(unit => {
            const apartment = `${building}1${floor}0${unit}`;
            expect(verifyApartmentInput(apartment)).toBe(true);
            validCount++;
          });
        });
      });

      // should have 4 buildings × 4 floors × 2 units = 32 valid combinations
      expect(validCount).toBe(32);
    });

    it('should handle apartments with leading/trailing whitespace', () => {
      expect(verifyApartmentInput(' A1001 ')).toBe(true);
      expect(verifyApartmentInput('\tB1202\t')).toBe(true);
      expect(verifyApartmentInput('\nC1301\n')).toBe(true);
    });
  });

  describe('invalid cases', () => {
    it('should reject invalid building letters', () => {
      const invalidLetters = ['E', 'F', 'Z', 'a', 'b', '1', '2', '#', '@'];
      invalidLetters.forEach(letter => {
        expect(verifyApartmentInput(`${letter}1001`)).toBe(false);
      });
    });

    it('should reject invalid second digit (must be 1)', () => {
      const invalidSecond = ['0', '2', '3', '9'];
      invalidSecond.forEach(digit => {
        expect(verifyApartmentInput(`A${digit}001`)).toBe(false);
      });
    });

    it('should reject invalid third digit (must be 0-3)', () => {
      const invalidThird = ['4', '5', '9'];
      invalidThird.forEach(digit => {
        expect(verifyApartmentInput(`A1${digit}01`)).toBe(false);
      });
    });

    it('should reject invalid fourth digit (must be 0)', () => {
      const invalidFourth = ['1', '2', '9'];
      invalidFourth.forEach(digit => {
        expect(verifyApartmentInput(`A10${digit}1`)).toBe(false);
      });
    });

    it('should reject invalid fifth digit (must be 1 or 2)', () => {
      const invalidFifth = ['0', '3', '9'];
      invalidFifth.forEach(digit => {
        expect(verifyApartmentInput(`A100${digit}`)).toBe(false);
      });
    });

    it('should reject wrong length inputs', () => {
      expect(verifyApartmentInput('')).toBe(false);
      expect(verifyApartmentInput('A100')).toBe(false);
      expect(verifyApartmentInput('A10011')).toBe(false);
    });

    it('should reject strings with spaces or special characters', () => {
      expect(verifyApartmentInput('A 1001')).toBe(false);
      expect(verifyApartmentInput('A1001!')).toBe(false);
      expect(verifyApartmentInput('A-1001')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(verifyApartmentInput(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(verifyApartmentInput(undefined as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(verifyApartmentInput(1001 as any)).toBe(false);
    });
  });
});