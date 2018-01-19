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

function bid(bidder, gameround, amount) {
  if(!bidder || !bidder.endpoint) {
    return Promise.reject('Bidder N/A');
  }

  if(!gameround || !gameround.gameround) {
    return Promise.reject('gameround N/A');
  }

  if(!amount) {
    return Promise.reject('amount N/A');
  }

  return loadBidder(bidder.endpoint)
  .then((bidder) => {
    if(amount > bidder.wallet) {
      return Promise.reject(`Not enough funding to bid. Bid: ${amount} Wallet: ${bidder.wallet}`);
    }

    const gameRoundsColl = db.collection('gamerounds');
    return gameRoundsColl.update({gameround: gameround.gameround}, { $push: { bids: { bidder, amount }} });
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

function findGameRound(gameround) {
  const gameRoundsColl = db.collection('gamerounds');
  return new Promise((resolve, reject) => {
    gameRoundsColl.find({gameround: gameround})
    .limit(1)
    .toArray(function(err, docs) {
      if(err) {
        reject(err);
      }
      console.log(`Found: ${JSON.stringify(docs[0])} for ${gameround}`);
      resolve(docs[0]);
    });
  });
}

function updateBidderWallet(endpoint, amount) {
  const bidderColl = db.collection('bidders');
  return bidderColl.update({ endpoint: endpoint }, { $inc: { wallet: amount } });
}

function finishGameround(gameround) {
    return findGameRound(gameround.gameround)
    .then((gRound) => {
      let pot = env.biddingValues.ante;
      let highestBidder = gameround.ante.endpoint;
      let highestBid = 0;
      updateBidderWallet(gameround.ante.endpoint, -env.biddingValues.ante)
      .catch((err) => {
        console.warn(`Could not update wallet of ${JSON.stringify(bidData.bidder)}`);
        console.warn(err);
      });

      gRound.bids.forEach((bidData) => {
        pot += bidData.amount;
        if(bidData.amount > highestBid) {
          highestBidder = bidData.bidder.endpoint;
          highestBid = bidData.amount;
        }
        updateBidderWallet(bidData.bidder.endpoint, -bidData.amount)
        .catch((err) => {
          console.warn(`Could not update wallet of ${JSON.stringify(bidData.bidder)}`);
          console.warn(err);
        });
      });
      updateBidderWallet(highestBidder, pot)
      .catch((err) => {
        console.warn(`Could not update wallet of ${JSON.stringify(bidData.bidder)}`);
        console.warn(err);
      });

      const gameRoundsColl = db.collection('gamerounds');
      return gameRoundsColl.update({gameround: gameround.gameround}, { $set: { endPot: pot, status: 'FINISHED' } });
    })
}

module.exports = {
  findBidderByName,
  loadAllBidders,
  addBidder,
  bid,
  createNewBiddingRound,
  findGameRound,
  finishGameround
}
