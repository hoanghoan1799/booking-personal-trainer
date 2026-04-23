import { BadRequestException } from '@nestjs/common';

import { TemplateType } from '../../enums/template-type.enum';
import {
  normalizeTemplateType,
  parseNullableNonNegativeInt,
} from '../templates-csv-import.helper';

describe('templates-csv-import.helper', () => {
  describe('parseNullableNonNegativeInt', () => {
    it('should return null for empty raw value', () => {
      const actual = parseNullableNonNegativeInt({ raw: '   ', rowNumber: 1 });
      expect(actual).toBeNull();
    });

    it('should parse non-negative integer', () => {
      const actual = parseNullableNonNegativeInt({ raw: ' 10 ', rowNumber: 1 });
      expect(actual).toBe(10);
    });

    it('should throw BadRequestException for negative number', () => {
      expect(() =>
        parseNullableNonNegativeInt({ raw: '-1', rowNumber: 2 }),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-numeric', () => {
      expect(() =>
        parseNullableNonNegativeInt({ raw: 'abc', rowNumber: 2 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('normalizeTemplateType', () => {
    it('should default to TRAINER when empty', () => {
      const actual = normalizeTemplateType({
        templateTypeRaw: '',
        rowNumber: 1,
      });
      expect(actual).toBe(TemplateType.TRAINER);
    });

    it('should return provided valid type', () => {
      const actual = normalizeTemplateType({
        templateTypeRaw: 'SYSTEM',
        rowNumber: 1,
      });
      expect(actual).toBe(TemplateType.SYSTEM);
    });

    it('should throw for invalid type', () => {
      expect(() =>
        normalizeTemplateType({ templateTypeRaw: 'INVALID', rowNumber: 3 }),
      ).toThrow(BadRequestException);
    });
  });
});
