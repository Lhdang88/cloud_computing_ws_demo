/**
 * @description Provides information about the running environment.
 */
const os = require('os');

module.exports = {
  hostname: os.hostname(),
  port: process.env.PORT || 3000,
  mongodb: {
    url: process.env.MONGO_DB || 'mongodb://localhost:27017/dhbw'
  },
  auth: {
    user: process.env.DHBW_USER || 'dhbw',
    password: process.env.DHBW_PASSWORD || 'dhbw-pw'
  },
  biddingRoundInterval: 1000 * 60,
  biddingRoundDuration: 1000 * 45,
  biddingValues: {
    initialCapital: 1000.0,
    biddingFee: 1.0,
    ante: 10.0
  }
};
