class MQTTChannelManager {
  static client() { return Promise.resolve(); }
  static provider() { return Promise.resolve(); }

  constructor(tca) {
    this.tca = tca;
  }

  static handleChannelTopic(manager, topic, message) {
    // { channels: [] }
    return manager.setChannels(message.channels);
  }

  setChannels(channels) {
    return this.tca.setChannels(channels);
  }

  // before(channels) { throw new Error(this); }
  // after() { throw new Error(this); }
}

module.exports = { MQTTChannelManager };
