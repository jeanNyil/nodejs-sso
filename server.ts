import * as bodyParser from "body-parser";
import express from "express";

const cors = require("cors");
var session = require('express-session');
var Keycloak = require('keycloak-connect');

var app = express();

app.use(bodyParser.json());
app.use(cors())

/**
 * SSO
 **/

var mStore = new session.MemoryStore();

app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: mStore
}))

var keycloak = new Keycloak({ store: mStore });

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

/**
 * END SSO
 **/

app.get("/ping", (req, res) => {
  console.log("ping");
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'I\'m the api and I\'m alive !' }));
})

app.get("/securePing", keycloak.protect('realm:ROLE_ADH'), (req, res) => {
  console.log("secure ping");
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'you did succeed to call the secure route ! :)' }));
})

app.listen(8080, () => {
  console.log({ message: 'App is now running on port 8080' }, 'START');
});