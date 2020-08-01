/**
 *
 **/
class SimpleCM {
  constructor(tca) {
    this.tca = tca;
  }

  before(channel) {
    return this.tca.setChannels([channel])
      .then(() => console.log('channel changed before', this.channels));
  }

  after() {
    return this.tca.setChannels([])
      .then(() => console.log('channel changed after'));
  }
}

module.exports = { SimpleCM };
