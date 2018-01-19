/**
 * @description The Game Logic
 */

const env = require('../environment');
const notification = require('../service/notification');

let isRunning = false;

function run() {
  if(isRunning) {
    console.log('a gameround is still running on this instance.');
    return;
  }
  isRunning = true;

  const dbServices = require('../db/dbservices');
  dbServices.createNewBiddingRound()
  .then(gameround => {
    if(!gameround){
      return;
    }

    return notification.notifyAllBidders(gameround);
  })
  .then(gameround => {
    if(!gameround){
      isRunning = false;
      return;
    }

    let timeout = gameround.endsAt - Date.now();
    timeout = timeout < 0 ? 0 : timeout;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(`Finishing Bidding round: ${gameround.gameround}`);
        isRunning = false;
        resolve(gameround);
      }, timeout);
    });
  })
  .catch(err => {
    isRunning = false;
    console.error('An Unexpected Error occured');
    console.error(err);
  });
}

module.exports = {
  run
}
