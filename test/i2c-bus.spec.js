/* eslint-disable max-classes-per-file */
const { describe, it } = require('mocha');
const { expect } = require('chai');

const { I2CAddressedBus, I2CScriptBus, EOS_SCRIPT } = require('@johntalton/and-other-delights');
const { Tca9548a } = require('@johntalton/tca9548a');

const { I2CTca9548aBusProvider } = require('../');

const READ_42_SCRIPT = [
  // { method: 'debug' },
  // { method: 'throw', result: 'here and error there an error' },
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },
  { method: 'readI2cBlock', result: { bytesRead: 1, buffer: Buffer.from([42]) } },
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },
  ...EOS_SCRIPT
];

const READ_3_5_CHANNEL_SCRIPT = [
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },
  { method: 'readI2cBlock', result: { bytesRead: 1, buffer: Buffer.from([37]) } },
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },

  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },
  { method: 'readI2cBlock', result: { bytesRead: 1, buffer: Buffer.from([42]) } },
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },

  ...EOS_SCRIPT
];

const WRITE_PFOFILE_SCRIPT = [
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },
  { method: 'writeI2cBlock', result: { bytesWritten: 0, buffer: undefined } },
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: undefined } },

  ...EOS_SCRIPT
];

class MockManager {
  constructor(multiplexer) {
    this.multiplexer = multiplexer;
  }

  before(channel) {
    console.log('BEFORE', channel);
    return this.multiplexer.setChannels([channel]);
  }
  after() {
    console.log('AFTER');
    return this.multiplexer.setChannels([]);
  }
}

class MockSensor {
  static from(bus) { return Promise.resolve(new MockSensor(bus)); }
  constructor(bus) { this.bus = bus; }
  async readSensor() {
    const data = await this.bus.read(0x00, 1);
    return data.readInt8();
  }
  setProfile(profile) {
    return this.bus.write(0x00, Buffer.from(profile));
  }
}

async function setup(busNumber, busAddress, busInfos = [], script = EOS_SCRIPT) {
  const sb = await I2CScriptBus.openPromisified(busNumber, script);
  // const lb = await I2CLockBus.from(sb);

  const provider = sb;

  const ab = new I2CAddressedBus(provider, busAddress);
  const multiplexer = await Tca9548a.from(ab, {});

  const manager = new MockManager(multiplexer);

  const vProvider = await I2CTca9548aBusProvider.from(provider, multiplexer, manager);

  // Build dictionary of bus number to Promise of provider bus.
  const busCache = busInfos.reduce((acc, item) => {
    if(acc[item.busN] === undefined) {
      // create Promise here to reduce complexity and speed up call
      acc[item.busN] = vProvider.openPromisified(item.busN);
    }
    return acc;
  }, {});

  // console.log('busCache', busCache);

  return { multiplexer, devices: await Promise.all(busInfos.map(async info => {
    const vab = new I2CAddressedBus(await busCache[info.busN], info.busA);
    const device = MockSensor.from(vab);
    return device;
  })) };
}

describe('I2CTca9548aBusProvider', () => { // eslint-disable-line spellcheck/spell-checker
  describe('#from', () => {
    it('should construct object without error', async () => {
      //
      await setup(1, 0x70, [{}], EOS_SCRIPT);
    });
  });
});

describe('I2CTca9548aBus', () => { // eslint-disable-line spellcheck/spell-checker
  describe('#constructor', () => {
    it('should construct object without error', async () => {
      //
      const s = await setup(1, 0x70, [{ busN: 0, busA: 0x20 }], EOS_SCRIPT);
      expect(s.devices.length).to.equal(1);
    });

    describe('I2CBus-Interface', () => {
      describe('#read', () => {
        it('should read from a device', async () => {
          //
          const s = await setup(1, 0x70, [{ busN: 3, busA: 0x20 }], READ_42_SCRIPT);
          const r = await Promise.all(s.devices.map(item => item.readSensor()));
          expect(r).to.deep.equal([42]);
        });

        it('should read from two devices', async () => {
          //
          const s = await setup(1, 0x70, [{ busN: 3, busA: 0x20 }, { busN: 5, busA: 0x20 }], READ_3_5_CHANNEL_SCRIPT);
          const r = await Promise.all(s.devices.map(item => item.readSensor()));
          expect(r).to.deep.equal([37, 42]);
        });
      });

      describe('#write', () => {
        it('should write', async () => {
          //
          const s = await setup(1, 0x70, [{ busN: 3, busA: 0x20 }], WRITE_PFOFILE_SCRIPT);
          const r = await Promise.all(s.devices.map(item => item.setProfile([3, 5, 7])));
          expect(r).to.deep.equal([undefined]);
        });
      });

      describe('#readBuffer', () => {
        it('should read', () => {
          //
        });
      });

      describe('#writeBuffer', () => {
        it('should write', () => {
          //
        });
      });
    });

  });
});
