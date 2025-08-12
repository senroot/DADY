/**
 * Simple logger utility for development and debugging
 */
class Logger {
  private isDevelopment = __DEV__ ?? true;

  /**
   * Log general information
   */
  log(message: string, data?: any) {
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: any) {
    if (this.isDevelopment) {
      if (error !== undefined) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: any) {
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.debug(message, data);
      } else {
        console.debug(message);
      }
    }
  }
}

// Export a singleton instance
export const logger = new Logger();
