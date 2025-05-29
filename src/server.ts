import app from './app';
import logger from './common/utils/logger';
import config from './config/config';

app.listen(config.app.nodePort, () => {
  logger.info(`Server running on port ${config.app.nodePort}`);
});
