const express = require("express");
const app = express();
const routes = require('./routes');
const bodyParser = require("body-parser");
require('dotenv').config();
const { MongoClient } = require("mongodb");

function REST() {
  var self = this;
  self.configureExpress(app)
};

REST.prototype.configureExpress = function (app) {
  var self = this;
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  routes(app);

  self.startServer(app);
}

REST.prototype.startServer = function (app) {
  const mongoUrl = (function(connString){
    connString += process.env.MONGO_USER ? process.env.MONGO_USER + ":" : "" ;
    connString += process.env.MONGO_PASS ? process.env.MONGO_PASS + "@" : "" ;
    connString += process.env.MONGO_HOST;
    connString += process.env.MONGO_PORT ? ":" + process.env.MONGO_PORT : "";
    return connString;
  }("mongodb://"));
  
  MongoClient.connect(mongoUrl, { promiseLibrary: Promise, useUnifiedTopology: true }, (err, client) => {
    if (err) {
      throw err;
    }
    app.locals.db = client.db(process.env.MONGO_DB);

    const port = process.env.PORT || 8121
    app.listen(port, function () {
      console.log(`All right ! I am alive at Port ${port}.`);
    });
  });
}

new REST();