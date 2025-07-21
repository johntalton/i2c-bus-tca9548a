import { Tca9548a } from '@johntalton/tca9548a'

import { isChannelManager, DefaultChannelManager } from './channel-manager.js'

export class I2CBusTCA9548A {
	#bus
	#device
	#channelManager

	static async wrap(provider, fn) {
		return provider.#channelManager.before(provider.#device)
			.then(() => {
				const future = fn(provider.#bus)
				future.finally(() => provider.#channelManager.after(provider.#device))
				return future
			})
	}

	static async XXXwrap(provider, fn) {
		return provider.#bus.transaction(bus => {
			console.log('transaction 1', bus.name)
			return provider.#channelManager.before(provider.#device)
				.then(() => {
					console.log('transaction 2', bus.name)
					const future = fn(bus)
					future.finally(() => provider.#channelManager.after(provider.#device))
					return future
				})
		})
	}

	static from(bus, device, channelManagerOrStrategy) { return new I2CBusTCA9548A(bus, device, channelManagerOrStrategy) }

	constructor(bus, device, channelManagerOrStrategy) {
		this.#bus = bus
		this.#device = device
		this.#channelManager = isChannelManager(channelManagerOrStrategy) ?
			channelManagerOrStrategy :
			new DefaultChannelManager(channelManagerOrStrategy)
	}

	get name() {
		return `ManagedChannelBus(${this.#bus.name})`
	}

	close() {
	}

	sendByte(address, byte) {
		throw new Error('no implementation')
	}

	readI2cBlock(address, cmd, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.readI2cBlock(address, cmd, length, buffer))
	}

	writeI2cBlock(address, cmd, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.writeI2cBlock(address, cmd, length, buffer))
	}

	i2cRead(address, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.i2cRead(address, length, buffer))
	}

	i2cWrite(address, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.i2cWrite(address, length, buffer))
	}
}