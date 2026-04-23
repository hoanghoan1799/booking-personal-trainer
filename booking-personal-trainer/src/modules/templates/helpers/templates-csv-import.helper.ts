import { BadRequestException } from '@nestjs/common';

import { TemplateType } from '../enums/template-type.enum';
import { TemplatesConstants } from '../constants/templates.constants';

export const parseNullableNonNegativeInt = (input: {
  readonly raw: string;
  readonly rowNumber: number;
}): number | null => {
  const value = input.raw.trim();
  if (value === '') return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException(
      `Row ${input.rowNumber}: ${TemplatesConstants.ImportCsv.ErrorMessages.NumericFieldsNonNegative}`,
    );
  }
  return parsed;
};

export const normalizeTemplateType = (input: {
  readonly templateTypeRaw: string;
  readonly rowNumber: number;
}): TemplateType => {
  const raw = input.templateTypeRaw.trim();
  const templateType =
    raw === ''
      ? TemplatesConstants.ImportCsv.DefaultTemplateType
      : (raw as TemplateType);
  if (!Object.values(TemplateType).includes(templateType)) {
    throw new BadRequestException(
      `Row ${input.rowNumber}: ${TemplatesConstants.ImportCsv.ErrorMessages.TemplateTypeInvalid}`,
    );
  }
  return templateType;
};
