const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, extra = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...extra
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    const logFile = path.join(this.logDir, filename);
    fs.appendFileSync(logFile, message + '\n');
  }

  writeToConsole(level, message, extra = {}) {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',  // Cyan
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      DEBUG: '\x1b[35m', // Magenta
      RESET: '\x1b[0m'   // Reset
    };

    const color = colors[level] || colors.RESET;
    const extraStr = Object.keys(extra).length > 0 ? ` | ${JSON.stringify(extra)}` : '';
    
    console.log(`${color}[${timestamp}] ${level}: ${message}${extraStr}${colors.RESET}`);
  }

  log(level, message, extra = {}) {
    const formattedMessage = this.formatMessage(level, message, extra);
    
    // Écrire dans la console
    this.writeToConsole(level, message, extra);
    
    // Écrire dans les fichiers
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`${today}-all.log`, formattedMessage);
    
    if (level === 'ERROR') {
      this.writeToFile(`${today}-errors.log`, formattedMessage);
    }
  }

  info(message, extra = {}) {
    this.log('INFO', message, extra);
  }

  warn(message, extra = {}) {
    this.log('WARN', message, extra);
  }

  error(message, extra = {}) {
    this.log('ERROR', message, extra);
  }

  debug(message, extra = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.log('DEBUG', message, extra);
    }
  }

  // Middleware pour Express
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        };

        if (res.statusCode >= 400) {
          logger.error(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
        } else {
          logger.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
        }

        originalSend.call(this, data);
      };

      next();
    };
  }
}

const logger = new Logger();
module.exports = logger;
