/**
 * @import { Tca9548a } from '@johntalton/tca9548a'
 * @import { I2CBus } from '@johntalton/and-other-delights'
 * @import { ChannelManager, Strategy } from './channel-manager.js'
 */

import { isChannelManager, DefaultChannelManager } from './channel-manager.js'

/**
 * @implements {I2CBus}
 */
export class I2CBusTCA9548A {
	/** @type {I2CBus} */
	#bus
	/** @type {Tca9548a} */
	#device
	/** @type {ChannelManager} */
	#channelManager


	/**
	 * @template T
	 * @param {I2CBusTCA9548A} provider
	 * @param {function(I2CBus): Promise<T>} fn
	 */
	static async wrap(provider, fn) {
		return provider.#channelManager.before(provider.#device)
			.then(() => {
				const future = fn(provider.#bus)
				future.finally(() => provider.#channelManager.after(provider.#device))
				return future
			})
	}

	// static async XXXwrap(provider, fn) {
	// 	return provider.#bus.transaction(bus => {
	// 		console.log('transaction 1', bus.name)
	// 		return provider.#channelManager.before(provider.#device)
	// 			.then(() => {
	// 				console.log('transaction 2', bus.name)
	// 				const future = fn(bus)
	// 				future.finally(() => provider.#channelManager.after(provider.#device))
	// 				return future
	// 			})
	// 	})
	// }


	/**
	 * @param {I2CBus} bus
	 * @param {Tca9548a} device
	 * @param {ChannelManager|Object} channelManagerOrStrategy
	 */
	static from(bus, device, channelManagerOrStrategy) { return new I2CBusTCA9548A(bus, device, channelManagerOrStrategy) }

	/**
	 * @param {I2CBus} bus
	 * @param {Tca9548a} device
	 * @param {ChannelManager|Strategy} channelManagerOrStrategy
	 */
	constructor(bus, device, channelManagerOrStrategy) {
		this.#bus = bus
		this.#device = device
		this.#channelManager = isChannelManager(channelManagerOrStrategy) ?
			channelManagerOrStrategy :
			new DefaultChannelManager(channelManagerOrStrategy)
	}

	get supportsScan() { return this.#bus.supportsScan }
	get supportsMultiByteDataAddress() { return this.#bus.supportsMultiByteDataAddress}

	async scan() {
		return this.#bus.scan()
	}

	get name() {
		return `ManagedChannelBus(${this.#bus.name})`
	}

	close() {
	}

	async sendByte(address, byte) {
		throw new Error('no implementation')
	}

	async readI2cBlock(address, cmd, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.readI2cBlock(address, cmd, length, buffer))
	}

	async writeI2cBlock(address, cmd, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.writeI2cBlock(address, cmd, length, buffer))
	}

	async i2cRead(address, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.i2cRead(address, length, buffer))
	}

	async i2cWrite(address, length, buffer) {
		return I2CBusTCA9548A.wrap(this, async bus => bus.i2cWrite(address, length, buffer))
	}
}