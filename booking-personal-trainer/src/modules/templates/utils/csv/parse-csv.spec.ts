import { parseCsv } from './parse-csv';

describe('parseCsv', () => {
  it('should return empty array for empty text', () => {
    const actual = parseCsv('');
    expect(actual).toEqual([]);
  });

  it('should parse headers and rows', () => {
    const actual = parseCsv('name,templateType\nLeg day,TRAINER\n');
    expect(actual).toHaveLength(1);
    expect(actual[0].rowNumber).toBe(2);
    expect(actual[0].valuesByHeader).toEqual({
      name: 'Leg day',
      templateType: 'TRAINER',
    });
  });

  it('should support quoted values with commas', () => {
    const actual = parseCsv('name,notes\nLeg day,"hello, world"\n');
    expect(actual[0].valuesByHeader.notes).toBe('hello, world');
  });
});
