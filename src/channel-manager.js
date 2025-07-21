export function isChannelManager(object) {
	return (('before' in object) && ('after' in object))
}

export class DefaultChannelManager {
	#exclusive
	#pedantic
	#allow
	#restore
	#previous

	constructor(strategy) {
		const exclusive = strategy?.exclusive ?? []
		const allow = strategy?.allow ?? []

		this.#exclusive = new Set(Array.isArray(exclusive) ? exclusive : [ exclusive ])
		this.#pedantic = strategy?.pedantic ?? true
		this.#allow = new Set(Array.isArray(allow) ? allow : [ allow ])
		this.#restore = false
		this.#previous = new Set()
	}

	// get exclusive() { return this.#exclusive }

	/** @param {Tca9548a} device  */
	async before(device) {
		if(this.#pedantic) {
			return device.setChannels([ ...this.#exclusive ])
		}

		const channels = await device.getChannels()
		this.#previous = new Set(channels)

		if(this.#previous
				.difference(this.#allow)
				.symmetricDifference(this.#exclusive)
				.size === 0) {

			// the set are the same, clear previous
			this.#previous.clear()
			return
		}

		return device.setChannels([ ...this.#previous
				.intersection(this.#allow)
				.union(this.#exclusive) ])
  }
	async after(device) {
		if(this.#restore && (this.#previous.size !== 0) && !this.#pedantic) {
			return device.setChannels([ ...this.#previous ])
		}
	 }
}
