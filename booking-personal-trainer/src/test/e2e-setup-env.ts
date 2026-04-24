import * as path from 'path';
import { config } from 'dotenv';

const projectRoot: string = path.resolve(__dirname, '../..');
const testEnvPath: string = path.join(projectRoot, '.test.env');

process.env['DOTENV_CONFIG_PATH'] = testEnvPath;
config({ path: testEnvPath, override: true });
