function getBidder(req, res, next) {
  const dbServices = require('../db/dbservices');
  dbServices.findBidderByName(req.params.name)
  .then(bidder => {
    res.send(bidder);
  }).catch(err => {
    res.send({ error: err, description: `Could not get Bidder for ${req.params.name}` });
  })
}

function postBidder(req, res, next) {
  const dbServices = require('../db/dbservices');
  dbServices.addBidder(req.body)
  .then(bidder => {
    res.send({ msg: 'OK' });
  }).catch(err => {
    res.send({ error: err, description: `Could not register Bidder for ${req.body}` });
  })
}

function getAllBidders(req, res, next) {
  const dbServices = require('../db/dbservices');
  dbServices.loadAllBidders()
  .then(bidders => {
    res.send(bidders);
  }).catch(err => {
    res.send({ error: err, description: 'Could not load all Bidders' });
  })
}

function init(app) {
  app.get('/api/bidder/:name', getBidder);
  console.log(`*** API [GET] /api/bidder/:name registered`);
  app.get('/api/allBidders', getAllBidders);
  console.log(`*** API [GET] /api/allBidders registered`);
  app.post('/api/registerBidder', postBidder);
  console.log(`*** API [POST] /api/registerBidder registered`);
}

module.exports = {
  init
};
