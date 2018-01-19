
function postBid(req, res, next) {
  const dbServices = require('../db/dbservices');
  dbServices.bid(req.body.bidder, req.body.gameround, req.body.value)
  .then(bidder => {
    res.send({ msg: 'Bid accepted' });
  }).catch(err => {
    res.send({ error: err, description: `Could not accept bid` });
  })
}

function init(app) {
  app.post('/api/bid', postBid);
  console.log(`*** API [POST] /api/bid registered`);
}

module.exports = {
  init
};
