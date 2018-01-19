/**
 * @description Main Entry - creates an Express Server on Port 3000.
 */

/**
 * dependencies - reference modules with require-keyword
 */
const express = require('express');
const bodyParser = require('body-parser');
const env = require('./lib/environment');
const api = require('./lib/api/base');
const db = require('./lib/db/mongodb');
const game = require('./lib/game/engine');

/**
* variables - here you can define local variables
*/
//initialize the express http-module
let app = express();
app.use(bodyParser.json());

// start the http-server on port:xxxx
app.listen(env.port, function() {
  console.log(`App is listening on port ${env.port}`);
  db.init();

  //register periodic import
  setInterval(function () {
    game.run();
  }, env.biddingRoundInterval);
});

// register APIs - register all files under /lib/api/...
api.registerAPIs(app);

/**
 * exit handling - the exitHandler function is called when the events are fired.
 */
function exitHandler(process, event, err) {
  console.warn(`Event ${event.type} received. ${err}`);

  // closeDB Connection if present
  db.close()
  .catch(function (err) {
    console.error('Could not close DB Connection');
    console.error(err);
  })
  .then(function () {
    if(event.exit) {
      console.log(`Shutting down app on ${env.hostname} ...`);
      process.exit();
    }
  });
}

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, process, { exit: true, type: 'SIGINT' }));
// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, process, { exit: false, type: 'uncaughtException' }));
