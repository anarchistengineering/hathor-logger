Hathor Logger
===

Default logger for Hathor, outputs log entries to stdout using a pretty printed value.  Allows override of how the output is formatted in case you need something like a pure JSON output.

Install
---

```
npm install --save hathor-logger
```

Usage
---

```js
const logger = require('hathor-logger');
logger.info('This is a test');
logger.info('This is some object', {foo: 'bar'});
logger.error('Something bad happend', new Error('And this is it'));
```

API
---

### Logger.debug(...args)

Output's a debug level (10) message

### Logger.info(...args)

Output's an info level (20) message

### Logger.warn(...args)

Output's a warning level (40) message

### Logger.error(...args)

Output's an error level (50) message

### Logger.critical(...args)

Output's a critical level (60) message

### Logger.outputHandler(pkt, rawPkt)

Handles the actual outputting of the data (pkt) to stdout.  If you want to override where a log message is going then you override logger.outputHandler.  rawPkt is the NON-JSON compliant (could have back references, long string sizes, etc...) version of the message.
