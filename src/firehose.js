const Transport = require('winston-transport');
const AWS = require('aws-sdk');
const firehoser = require('firehoser');

AWS.config.setPromisesDependency(Promise);

const IFireHoser = class IFireHoser {
  // eslint-disable-next-line no-useless-constructor, no-unused-vars
  constructor(streamName, firehoseOptions) {
    // new.target doesn't work with babel and nodejs <= 4.0.0
    // so leaving this out for now
    // if (new.target === IFireHoser) {
    //  throw new TypeError('Cannot construct Abstract instances directly');
    // }
  }

  /**
   * @returns Promise containing the recordId
   */
  send(message) { // eslint-disable-line no-unused-vars
    throw new Error('Not Implemented.');
  }
};

const FireHoser = class FireHoser extends IFireHoser {
  constructor(streamName, firehoseOptions) {
    super(streamName, firehoseOptions);
    this.streamName = streamName;
    
    console.log('winston-firehose ignoring some options', firehoseOptions);

    this.firehose = new firehoser.QueueableJSONDeliveryStream(
      this.streamName, 
      15000,
      100
    );
  }

  /**
   * @returns Promise
   */
  send(message) {
    return this.firehose.putRecord(message);
  }
};

const FirehoseLogger = class FirehoseLogger extends Transport {
  constructor(options) {
    super(options);
    this.name = 'FirehoseLogger';
    this.level = options.level || 'info';
    this.formatter = options.formatter || JSON.stringify;

    const streamName = options.streamName;
    const firehoseOptions = options.firehoseOptions || {};

    this.firehoser = options.firehoser || new FireHoser(streamName, firehoseOptions);
  }

  log(info, callback) {
    try { 
      const message = Object.assign({ timestamp: (new Date()).toISOString() }, info);
      this.firehoser.send(message);
    } catch (ex) { 
      console.error("Firehose log delivery failed!", ex);
    } finally { 
      // This probably has some real important behaviors like
      // waiting for delivery of the log message and various 
      // guarantees... I would know if I'd read the docs/code
      // properly, wouldn't I? 
      callback();
    }   
  }
};

module.exports = { IFireHoser, FireHoser, FirehoseLogger };
