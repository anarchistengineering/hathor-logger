const os = require('os');
const HOSTNAME = os.hostname();
const PID = process.pid;
const util = require('util');

const {
  exclude,
  stringify
} = require('hathor-utils');

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 40,
  ERROR: 50,
  CRITICAL: 60
};

const LOG_LEVEL_NAMES = Object.keys(LOG_LEVELS).reduce((values, name)=>{
  const value = LOG_LEVELS[name];
  return Object.assign({}, values, {[value]: name});
}, {});

const LOG_LEVEL_LOOKUP = Object.keys(LOG_LEVELS).reduce((values, name)=>{
  const value = LOG_LEVELS[name];
  return Object.assign({}, values, {[value]: name, [name]: value});
}, {});

const flattenPayloads = (src, seen = [])=>{
  if(Array.isArray(src)){
    return src.map((item)=>flattenPayloads(item, seen.concat(src)));
  }
  if(typeof(src)!=='object'){
    return src;
  }
  if(!src){
    return src;
  }
  const seenThis = seen.concat(src);
  const payloadKey = src.payload?'payload':(src.Payload?'Payload':false);
  if(payloadKey){
    const tmpPayload = src[payloadKey];
    const strPayload = stringify(tmpPayload);
    const shortPayload = strPayload.length>1000?strPayload.substr(0, 1000)+'...':strPayload;
    return Object.assign({}, src, {[payloadKey]: shortPayload});
  }
  return Object.keys(src).reduce((res, key)=>{
    res[key] = flattenPayloads(src[key]);
    return res;
  }, {});
};

const isSpecialObject = (value)=>(value instanceof Date || value instanceof RegExp);

const reformLogObjects = (...args)=>{
  return args.map((value, index)=>{
    if(((typeof(value)==='object')&&(!isSpecialObject(value)))||Array.isArray(value)){
      return util.inspect(value, {colors: true, depth: null});
    }
    return value;
  });
};

const reformErrors = (args)=>{
  return args.map((arg)=>{
    if(arg instanceof Error){
      let error = args.pop();
      let errMsg = error.toString();
      if(error.stack){
        const stack = typeof(error.stack)!=='string'?error.stack:error.stack.split('\n').map((s)=>s.trim());
        return {
          message: errMsg,
          stack: stack
        };
      }
      return {message: errMsg};
    }
    return arg;
  });
  if(args[args.length-1] instanceof Error){
    let error = args.pop();
    let errMsg = error.toString();
    if(error.stack){
      errMsg = errMsg + '\n' + error.stack;
    }
    args.push(errMsg);
  }
  return args;
};

const _outputHandler = (logger, level, dt, ...args)=>{
  if(logger.minLogLevel && level < logger.minLogLevel){
    return;
  }
  const baseLogPacket = logger.baseLogPacket;
  const levelName = LOG_LEVEL_NAMES[level] || 'UNKNOWN';
  const payloadLimit = logger.payloadLimit || 1000;
  const DEFAULT_DATA_REFORM = (e)=>{
    if(Buffer.isBuffer(e)){
      const strPayload = e.toString();
      const shortPayload = strPayload.length>payloadLimit?strPayload.substr(0, payloadLimit)+'...':strPayload;
      return shortPayload;
    }
    const type = typeof(e);
    if(type === 'object' || Array.isArray(e)){
      return flattenPayloads(e);
    }
    return e;
  };
  const reformData = (logger.reformData || DEFAULT_DATA_REFORM);
  const pkt = Object.assign({
    logger,
    level,
    levelName,
    dateTime: dt,
    host: HOSTNAME,
    pid: PID,
    data: args.map(reformData)
  }, baseLogPacket);
  return logger.outputHandler(pkt, Object.assign({}, pkt, {data: args}));
};

class Logger{
  constructor({outputHandler, minLogLevel, baseLogPacket, reformData} = {}){
    this.minLogLevel = minLogLevel;
    if(typeof(outputHandler)==='function'){
      this.outputHandler = outputHandler;
    }
    this.baseLogPacket = baseLogPacket || {};
    this.reformData = reformData;
  }

  outputHandler(pkt){
    console.log.apply(console, reformLogObjects(exclude(pkt, 'logger')));
  }

  debug(...args){
    args.unshift(this, LOG_LEVELS.DEBUG, new Date());
    _outputHandler(...args);
  }

  info(...args){
    args.unshift(this, LOG_LEVELS.INFO, new Date());
    _outputHandler(...args);
  }

  warn(...args){
    args.unshift(this, LOG_LEVELS.WARN, new Date());
    _outputHandler(...args);
  }

  error(...args){
    args.unshift(this, LOG_LEVELS.ERROR, new Date());
    _outputHandler(...reformErrors(args));
  }

  critical(...args){
    args.unshift(this, LOG_LEVELS.ERROR, new Date());
    _outputHandler(...reformErrors(args));
  }
};

const logger = new Logger();
logger.Logger = Logger;
logger.flattenPayloads = flattenPayloads;
logger.reformLogObjects = reformLogObjects;
logger.isSpecialObject = isSpecialObject;

module.exports = logger;
