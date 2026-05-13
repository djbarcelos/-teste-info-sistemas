import { Logger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends Logger {
  private readonly logLevel: string;

  constructor(context: string) {
    super(context);
    // Define o nível de log a partir da variável de ambiente
    this.logLevel = process.env.LOG_LEVEL || 'debug'; // Default para 'debug'
  }

  log(message: string) {
    if (this.shouldLog('log')) {
      super.log(message);
    }
  }

  error(message: string, trace?: string) {
    if (this.shouldLog('error')) {
      super.error(message, trace);
    }
  }

  warn(message: string) {
    if (this.shouldLog('warn')) {
      super.warn(message);
    }
  }

  debug(message: string) {
    if (this.shouldLog('debug')) {
      super.debug(message);
    }
  }

  verbose(message: string) {
    if (this.shouldLog('verbose')) {
      super.verbose(message);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['verbose', 'debug', 'log', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }
}
