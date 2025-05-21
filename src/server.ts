import app from './app';
import logger from './common/utils/logger';
import config from './config/config';

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});
