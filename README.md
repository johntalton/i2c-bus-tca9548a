# I²C Bus interface for TCA9548

Provides a `I2CBus` interface for managing the channels for the TCA9548

[![npm Version](http://img.shields.io/npm/v/@johntalton/i2c-bus-tca9548a.svg)](https://www.npmjs.com/package/@johntalton/i2c-bus-tca9548a)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/i2c-bus-tca9548a)
![CI](https://github.com/johntalton/i2c-bus-tca9548a/workflows/CI/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/i2c-bus-tca9548a)
[![Downloads Per Month](http://img.shields.io/npm/dm/@johntalton/i2c-bus-tca9548a.svg)](https://www.npmjs.com/package/@johntalton/i2c-bus-tca9548a)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/i2c-bus-tca9548a)


- [Usage Example](#usage)
- [Strategies](#strategies)
- [TransactionBus](#transaction-bus)


# Description

While the TCA9548 can be use "along size" other existing chips, the orchestration code needed can be burdensome 😢.

This library provides an abstraction of the [`I2CBus`](https://github.com/johntalton/and-other-delights) while exposing the `ChannelManager` interface 👍.

This allows device code to be abstractly written against the `I2CBus` interface, while allowing for custom channel changing methodologies required by the application, without rewriting device code 🥳.


# Usage

The following example show the usage in order to manage two (2) [HT16K33](https://github.com/johntalton/ht16k33) that share the same address.

In this case, the TCA9548 exist at address `0x70`, while the two HT16K33 chips are both at address `0x71`.

The two devices are connected to channel `1` and `3` of the multiplexer.

```js
import { Tca9548a } from '@johntalton/tca9548a'
import { I2CAddressedBus } from '@johntalton/and-other-delights'
import { I2CBusTCA9548A } from '@johntalton/i2c-bus-tca9548a'
import { HT16K33 } from '@johntalton/ht16k33' // example device

// acquire an I2CBus implementation
//  like Excamera I2CDriver
//  or MCP2221 over HID
//  etc.
const bus = await SomeUnderlyingI2CBusImplementation()
const tca = Tca9548a.from(new I2CAddressedBus(bus, 0x70))

// create the two managed busses
// for exclusive strategies, two unique busses are created
const managedBus_1 = I2CBusTCA9548A.from(bus, tca, { exclusive: 1 })
const managedBus_3 = I2CBusTCA9548A.from(bus, tca, { exclusive: 3 })

// given the managed busses, create addressed devices (same address) for each
const device_1 = HT16K33.from(new I2CAddressBus(managedBus_1, 0x71))
const device_3 = HT16K33.from(new I2CAddressBus(managedBus_3, 0x71))

```

Other interaction using the initial code above:

```js
// enable both devices oscillators
// the ChannelManager will exclusively switch to channel 1 here
await device_1.enableOscillator()
// then to channel 3 (only) here
await device_3.enableOscillator()
```
```js
// external changes to the channels remain valid
// this will not effect either devices_1 or _3s operation
await tca.setChannels([ 4 ])

// turn on the display (disable blinking)
// again, interacting with both will switch channels 1 and 3 sequentially
await device_1.setDisplay(true, 'off')
await device_3.setDisplay(true, 'off')
```
```js
// The following is valid from the perspective of the tca chip,
// however, accessing device directly via 0x71 will have undefined behavior ☠️
// (as noted above, using the managed device_1 or _3 will work)
await tca.setChannels([ 1, 3 ])
```
```js
// It is also possible to create un-managed device.

// Bypassing the Managed Bus is considered an "escape hatch" for scenarios that do not fit well into the ChannelManager api design.

// Note that this works because the HT16K33 driver is stateless, and not effected by the hardware change
const eitherDevice = HT16K33.from(new I2CAddressBus(bus, 0x71))
await tca.setChannels([ 1 ])
await eitherDevice.setDisplay(true, 'off') // effect device on channel 1
await tca.setChannels([ 3 ])
await eitherDevice.setDisplay(true, 'off') // effect device on channel 3
```

# Strategies

## Default Channel Manager
Enable, exclusively, a channel (or channels) during bus calls.

This example will set the channels explicitly to `3` (and only `3`) prior to any further bus calls. And it will restore the existing set channels after bus operations.

```js
{
  exclusive: [ 3 ],
  restore: true
}
```

The `DefaultChannelManager` has the following properties:
- `exclusive`: `Array<number>` a list of channels that must be set prior to bus call
- `pedantic`: `boolean` if true, ignore any previous channel value and alway set the exclusive channels, also ignore restoration of previous channels
- `allow`: `Array<number>` list of exception to exclusivity, channels listed here will be allowed to remain set, if set when switching to the exclusive list, only applies if not pedantic.
- `restore`: `boolean` if true, and not pedantic, the channels set prior to setting the exclusive list will be restored in full after bus operation complete



# Transaction Bus

While managed busses allow for a cleaner abstraction for device authors and a flexible solution for consumers, it does "hide" the async nature of the interaction (get/set channel prior to device call, and then again after).

Due to this async nature, consumers must take care to grantee that the underlying bus calls are serialized.

There are several solution to this - with the most common being ignore it in most cases 🙈

In cases where serialization of calls is required, a `TransactionBus` can be used:

```js
import /* ...stuff from above  */
import { TransactionBus } from '@johntalton/and-other-delights'

const rawBus = await SomeUnderlyingI2CBusImplementation()
const transBus = new TransactionBus(rawBus)
const tca = Tca9548a.from(new I2CAddressedBus(transBus, 0x70))
const managedBus_1 = I2CBusTCA9548A.from(transBus, tca, { exclusive: 1 })

// use tca nad managedBus_1 as above (now safely 🦺 )
```