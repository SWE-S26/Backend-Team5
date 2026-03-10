const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

type LogType = 'success' | 'info' | 'error' | 'start' | 'warning' | 'end';

/**
 * Logs a message with optional color/style by type.
 *
 * @param msg Message to log.
 * @param type Log type (IntelliSense options):
 * - `"success"`
 * - `"info"`
 * - `"error"`
 * - `"start"`
 * - `"warning"`
 * - `"end"`
 */

export const log = (msg: any, type: LogType = 'info') => {
  if (typeof msg === 'object') {
    console.log(msg);
    return;
  }

  let style = '';

  switch (type) {
    case 'success':
      style = COLORS.bold + COLORS.green;
      break;

    case 'info':
      style = COLORS.bold + COLORS.cyan;
      break;

    case 'error':
      style = COLORS.bold + COLORS.red;
      break;

    case 'start':
      style = COLORS.bold + COLORS.magenta;
      break;

    case 'warning':
      style = COLORS.bold + COLORS.yellow;
      break;

    case 'end':
      style = COLORS.bold + COLORS.blue;
      break;

    default:
      style = '';
  }

  console.log(style + msg + COLORS.reset);
};
