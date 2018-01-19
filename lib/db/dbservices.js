/**
 * @description Provides DB Operations
 */

const env = require('../environment');
const db = require('./mongodb').getDB();
const utils = require('../utils/utils');

function findBidderByName(bidderName) {
  const bidderColl = db.collection('bidders');
  return new Promise((resolve, reject) => {
    bidderColl.find({name: bidderName})
    .toArray(function(err, docs) {
      if(err) {
        reject(err);
      }
      console.log(`Found: ${JSON.stringify(docs)} for ${bidderName}`);
      resolve(docs);
    });
  });
}

function loadBidder(bidderEndpoint) {
  const bidderColl = db.collection('bidders');
  return new Promise((resolve, reject) => {
    bidderColl.find({endpoint: bidderEndpoint})
    .limit(1)
    .toArray(function(err, docs) {
      if(err) {
        reject(err);
      }
      console.log(`Found: ${JSON.stringify(docs[0])} for ${bidderEndpoint}`);
      resolve(docs[0]);
    });
  });
}

function loadAllBidders() {
  const bidderColl = db.collection('bidders');
  return new Promise((resolve, reject) => {
    //finds all liquid bidders
    bidderColl.find({ wallet: {$gte: env.biddingValues.ante}})
    .toArray(function(err, docs) {
      if(err) {
        reject(err);
      }
      console.log(`Found: ${docs.length} registered bidders`);
      resolve(docs);
    });
  });
}

function addBidder(bidder) {
  if(!bidder || bidder === {}) {
    return Promise.reject(`Can not add empty bidder: ${bidder}`);
  }

  if(!bidder.endpoint || bidder.endpoint === {}) {
    return Promise.reject(`Bidder Endpoint must be specified: ${bidder.endpoint}`);
  }

  if(!bidder.name || bidder.name === {}) {
    return Promise.reject(`Bidder Name must be specified: ${bidder.name}`);
  }

  const bidderColl = db.collection('bidders');
  return loadBidder(bidder.endpoint).then( data => {
    if(!data) {
      bidder.wallet = env.biddingValues.initialCapital;
      return bidderColl.insert(bidder).then( result => {
        console.log(`Added ${JSON.stringify(bidder)} to game`);
        return result;
      });
    }
  });
}

function createNewBiddingRound() {
  return loadAllBidders().then(bidders => {
    if(bidders.length < 2) {
      console.log('Less than 2 registered Bidders found, no Bidding Round created');
      return Promise.resolve(null);
    }
    const gameround = {
      host: `${env.hostname}`,
      createdAt: new Date(),
      endsAt: Date.now() + env.biddingRoundDuration,
      gameround: `${env.hostname}_${Date.now()}`,
      ante: bidders[utils.getRandomIntInclusive(0, bidders.length-1)],
      fee: env.biddingValues.biddingFee,
      bids: [],
      status: 'NEW',
      endPot: 0
    }

    const gameRoundsColl = db.collection('gamerounds');
    return gameRoundsColl.insert(gameround).then( result => {
      console.log(`New Bidding-Round created: ${JSON.stringify(gameround)}`);
      return gameround;
    });
  });
}

module.exports = {
  findBidderByName,
  loadAllBidders,
  addBidder,
  createNewBiddingRound
}
