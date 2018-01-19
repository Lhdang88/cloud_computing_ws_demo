/**
 * @description calls the endpoints of bidders
 */
const env = require('../environment');
const rp = require('request-promise');

function notifyBidder(gameround, bidder) {
  let options = {
      method: 'POST',
      uri: `${bidder.endpoint}`,
      body: {
          gameround,
          bidder,
          timeleft: gameround.endsAt - Date.now(),
          msg: `Hello ${bidder.name}, a new Bidding round has begun. Time until round ends: ${gameround.endsAt - Date.now()}`
      },
      json: true
  };

  return rp(options)
    .then(function (parsedBody) {
      console.log(`successfully notified ${bidder.endpoint}`);
    })
    .catch(function (err) {
      console.error(`Could not notify ${bidder.endpoint}`);
      console.error(err);
      throw err;
    });
}

function notifyAllBidders(gameround) {
  const dbServices = require('../db/dbservices');

  return dbServices.loadAllBidders()
  .then(bidders => {
    const requestPromises = [];
    bidders.forEach(bidder => {
      requestPromises.push(notifyBidder(gameround, bidder));
    });
    return Promise.all(requestPromises);
  })
  .then(() => {
    console.log('all bidders notified');
    return gameround;
  })
  .catch(err => {
    console.warn('Could not notify all bidders');
    console.warn(err);
    return gameround;
  });
}

module.exports = {
  notifyAllBidders
}
