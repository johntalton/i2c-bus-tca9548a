class ChannelManager {
  before(channel) { throw new Error(this); }
  after() { throw new Error(this); }
}

module.exports = { ChannelManager };
