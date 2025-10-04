interface LogData {
  message: string;
  error?: unknown;
  userId?: string;
  timestamp?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

interface LogOptions {
  includeTimestamp?: boolean;
  includeErrorStack?: boolean;
}

const defaultOptions: Required<LogOptions> = {
  includeTimestamp: true,
  includeErrorStack: process.env.NODE_ENV === 'development'
};

function formatError(error: unknown, includeStack = false): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(includeStack && { stack: error.stack }),
      ...(error as any).code && { code: (error as any).code }
    };
  }
  return error;
}

function formatLogData(data: LogData, options: Required<LogOptions>): Record<string, unknown> {
  const formattedData: Record<string, unknown> = {
    message: data.message
  };

  if (options.includeTimestamp) {
    formattedData.timestamp = data.timestamp || new Date().toISOString();
  }

  if (data.userId) {
    formattedData.userId = data.userId;
  }

  if (data.error) {
    formattedData.error = formatError(data.error, options.includeErrorStack);
  }

  if (data.context) {
    formattedData.context = data.context;
  }

  // Adiciona campos extras
  Object.entries(data).forEach(([key, value]) => {
    if (!['message', 'timestamp', 'userId', 'error', 'context'].includes(key)) {
      formattedData[key] = value;
    }
  });

  return formattedData;
}

export const logger = {
  info(data: LogData, options: LogOptions = {}) {
    const opts = { ...defaultOptions, ...options };
    console.log(JSON.stringify(formatLogData(data, opts)));
  },

  warn(data: LogData, options: LogOptions = {}) {
    const opts = { ...defaultOptions, ...options };
    console.warn(JSON.stringify(formatLogData(data, opts)));
  },

  error(data: LogData, options: LogOptions = {}) {
    const opts = { ...defaultOptions, ...options };
    console.error(JSON.stringify(formatLogData(data, opts)));
  },

  debug(data: LogData, options: LogOptions = {}) {
    if (process.env.NODE_ENV === 'development') {
      const opts = { ...defaultOptions, ...options };
      console.debug(JSON.stringify(formatLogData(data, opts)));
    }
  }
};