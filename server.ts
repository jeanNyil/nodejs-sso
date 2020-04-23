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

app.get("/securePing", keycloak.protect('realm:secure'), (req, res) => {
  console.log("secure ping");
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'You did succeed to call the secure route ! :)' }));
})

app.use('*', function (req, res) {
  res.status(404).send('Not found!');
});

app.listen(8080, () => {
  /*console.log('=> Custom CA certificates to extend the well known "root" CAs (like VeriSign)');
  console.log('env NODE_EXTRA_CA_CERTS: ', process.env.NODE_EXTRA_CA_CERTS);

  console.log('=> Additional Node OPTIONS');
  process.env.NODE_OPTIONS = '--trace-tls --trace-warnings',
  console.log('env NODE_OPTIONS: ', process.env.NODE_OPTIONS);*/

  console.log('==> Deactivating certificate validation ( /!\\ not recommended in PRODUCTION! )');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // This is not recommended in PRODUCTION
  console.log('env NODE_TLS_REJECT_UNAUTHORIZED: ', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
  
  console.log({ message: 'App is now running on port 8080' }, 'START');
});