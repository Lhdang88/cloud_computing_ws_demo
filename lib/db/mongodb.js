/**
 * @description Provides the DB Connection
 */

const pkg = require('../../package.json');
const env = require('../environment');
const MongoClient = require('mongodb').MongoClient;
const dbString = env.mongodb.url;

let dbConn;

function init() {
  initConnection()
  .then(function () {
    return setupGameDB();
  })
  .catch(function (err) {
    console.error(`could not establish MongoDB Connection with ${dbString}`);
    console.error(err);
    // Fail-Hard: Stop App
    setTimeout(() => {
      process.exit(1);
    }, 1500);
  });
}

function initConnection() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(dbString, (err, conn) => {
      if (err) {
        return reject(err);
      }
      console.log('MongoDB Connection established');
      dbConn = conn;
      return resolve(dbConn);
    });
  });
}

function close() {
  if (dbConn) {
    console.log('Closing existing db connection...');
    return dbConn.close();
  }
  return Promise.resolve('OK');
}

function setupGameDB() {
  const dbColl = dbConn.collection('betting_game');
  return dbColl.count({}).then( cnt => {
    if (cnt === 0) {
      const promiseArray = [];
      const metadata = {
        host: `${env.hostname}:${env.port}`,
        version: `${pkg.name}:${pkg.version}`,
        createdAt: new Date()
      };

      console.log(`Initializing GameDB: ${JSON.stringify(metadata)}`);
      promiseArray.push(dbColl.insert(metadata));
      promiseArray.push(resetBidders());
      promiseArray.push(resetGameLogs());
      return Promise.all(promiseArray);
    }
  });
}

function resetBidders() {
  const dbColl = dbConn.collection('bidders');
  console.log('Clearing all bidders from game');
  return dbColl.remove({});
}

function resetGameLogs() {
  const dbColl = dbConn.collection('gamerounds');
  console.log('Clearing all game-logs');
  return dbColl.remove({});
}

function getDB() {
  return dbConn;
}

module.exports = {
  init,
  close,
  getDB
}
