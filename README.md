# I²C Bus (`i2c-bus`-like) interface for the Tca9548a bus switch.
Provides a `I2CBus` that can be use for abstracting bus managment from device setup and configurations.

[![npm Version](http://img.shields.io/npm/v/@johntalton/i2c-bus-tca9548.svg)](https://www.npmjs.com/package/@johntalton/i2c-bus-tca9548)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/i2c-bus-tca9548)
![CI](https://github.com/johntalton/i2c-bus-tca9548/workflows/CI/badge.svg)
![CodeQL](https://github.com/johntalton/i2c-bus-tca9548A/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/i2c-bus-tca9548)
[![Downloads Per Month](http://img.shields.io/npm/dm/@johntalton/i2c-bus-tca9548.svg)](https://www.npmjs.com/package/@johntalton/i2c-bus-tca9548)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/i2c-bus-tca9548)
[![Package Quality](https://npm.packagequality.com/shield/%40johntalton%2Fi2c-bus-tca9548.svg)](https://packagequality.com/#?package=@johntalton/i2c-bus-tca9548)

## Usage
(see [this example]() to see the non-bus style functional interaction for manual bus managment)

Given the following setup using 'i2c-bus` as our source bus implementation.
```javascript
// see the standard tca9548a setup process
const { i2c, bus1, tcaDevice } = await allTheNormalSetupStuff(busNumber, busAddress)
```
Similar to the import of a source library, the factory `from` method can be used to createa a bus provider.
```javascript
const provider = await I2CTca9548BusFactory.from(provider, multiplexer, manager)
```
A provider (an interface of `I2CBus`) has the common `openPromisified` call. And then can be use in a similar manaer as a native provider.
```javascript
const channelAsBusNumber = 1
const vbus1 = await provider.openPromisified(channelAsBusNumber)
const abus = await I2CAddressedBus.from(vbus1, someDeviceAddress)
const device = await FictionalDevice.from(abus)
// device.read() etc ...
```
The useage of the Channel number as the `busNumber` parameter in the `openPromisified` call creates the virtual bus numbering of the provider instance.

Extending this to a set of multi-plexed devices with overlaping bus addresses the following can be construted:
```javascript
const vbus1 = // from above
const commonBusAddress = 0x77
const devices = awaitAll [0, 1, 2].map(async channel => 
  FictionalDevice.from(I2CAddressedBus.from(provider.oopenPromisified(channel), commonBusAddress))
)
```
The above code constructs a set of three `FictionalDevice`s that share a common bus address that would otherwise not work on a single bus segment.  By using the virtual bus as above the resulting devices can be used transparent to the bus configuration.

Thus the following:
```javascript
cosnt d2 = await devices[2].readData()
const d0 = await devcies[0].readData()
```
Results in the `ChannelManager` coordinating the device state. Thus, in the most simple case, the `ChannelManager` could simple call `setChannel()` during its `before` hook, cuase devices fictional `readData` to be read in context for both the above cases.

This simple abstraction simplifies complex layouts without application developer needing to re-factor setup and managment code.


