import { TemplateType } from '../enums/template-type.enum';

export const TemplatesConstants = {
  List: {
    DefaultPage: 1,
    DefaultLimit: 20,
  },
  ImportCsv: {
    DefaultTemplateType: TemplateType.TRAINER,
    ErrorMessages: {
      Forbidden: 'Forbidden',
      CsvIsEmpty: 'CSV is empty',
      InvalidStartDate: 'Invalid start date',
      InvalidTimeFormat: 'Invalid time format',
      TemplateNotFound: 'Template not found',
      TemplateItemNotFound: 'Template item not found',
      TemplateTypeInvalid: 'templateType must be SYSTEM|TRAINER|PUBLIC',
      NumericFieldsNonNegative: 'numeric fields must be >= 0',
    },
  },
} as const;
