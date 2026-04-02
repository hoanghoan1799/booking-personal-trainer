import { DocumentBuilder } from '@nestjs/swagger';

// Comments
import { SWAGGER_ACCESS_TOKEN } from '../common/constants/api-document.constants';
import {
  APP_META_DATA,
  SWAGGER_API_VERSION,
} from '../common/constants/app.constant';

export const SWAGGER_CONFIG = new DocumentBuilder()
  .setTitle(APP_META_DATA.TITLE)
  .setDescription(APP_META_DATA.DESCRIPTION)
  .setVersion(SWAGGER_API_VERSION.V1)
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    },
    SWAGGER_ACCESS_TOKEN,
  )
  .build();
