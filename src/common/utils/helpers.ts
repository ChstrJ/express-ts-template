import logger from "./logger"

function dd(...args: any) {
  console.log(args)
  logger.debug(args)
  process.exit(1);
}
