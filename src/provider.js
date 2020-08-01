const throat = require('throat');

const { I2CTca9548aBus } = require('./i2c-bus.js');

/**
 *
 **/
class I2CTca9548aBusProvider {
  static from(sourceBus, device, manager) {
    return Promise.resolve(new I2CTca9548aBusProvider(sourceBus, device, manager));
  }

  constructor(sourceBus, device, manager) {
    this.lock = throat(1);
    this.sourceBus = sourceBus;
    this.device = device;
    this.manager = manager;
  }

  openPromisified(busNumber) {
    return Promise.resolve(new I2CTca9548aBus(busNumber, this));
  }
}

module.exports = { I2CTca9548aBusProvider };
