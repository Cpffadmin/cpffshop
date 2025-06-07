type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  path?: string;
  userId?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
    path?: string,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      path,
      userId,
    };
  }

  info(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("info", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || "");
    }
  }

  warn(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("warn", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || "");
    }
  }

  error(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("error", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, data || "");
    }
  }

  debug(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("debug", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || "");
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // Helper method to log API requests
  logApiRequest(path: string, method: string, userId?: string, data?: any) {
    this.info(`API Request: ${method} ${path}`, data, path, userId);
  }

  // Helper method to log API responses
  logApiResponse(
    path: string,
    method: string,
    status: number,
    userId?: string,
    data?: any
  ) {
    if (status >= 400) {
      this.error(
        `API Response: ${method} ${path} - ${status}`,
        data,
        path,
        userId
      );
    } else {
      this.info(
        `API Response: ${method} ${path} - ${status}`,
        data,
        path,
        userId
      );
    }
  }

  // Helper method to log database operations
  logDbOperation(
    operation: string,
    collection: string,
    userId?: string,
    data?: any
  ) {
    this.debug(
      `DB Operation: ${operation} on ${collection}`,
      data,
      undefined,
      userId
    );
  }
}

export const logger = Logger.getInstance();
