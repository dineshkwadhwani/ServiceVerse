import * as functions from 'firebase-functions';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(name: string, context?: LogContext) {
    this.context = {
      module: name,
      ...context,
    };
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: any, context?: LogContext) {
    const logContext = {
      ...this.context,
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    functions.logger.error(message, logContext);
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const logContext = { ...this.context, ...context };

    switch (level) {
      case 'debug':
        functions.logger.debug(message, logContext);
        break;
      case 'info':
        functions.logger.info(message, logContext);
        break;
      case 'warn':
        functions.logger.warn(message, logContext);
        break;
      case 'error':
        functions.logger.error(message, logContext);
        break;
    }
  }

  withContext(context: LogContext): Logger {
    return new Logger(this.context.module, {
      ...this.context,
      ...context,
    });
  }
}

export default Logger;
