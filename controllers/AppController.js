import db from '../utils/db';
import redis from '../utils/redis';

const express = require('express');

const app = express();
const port = 5000;

app.get('/status', (req, res) => {
  if (db.isAlive() && redis.isAlive()) {
    res.statusCode(200).send('{ "redis": true, "db": true }');
  }
});

app.get('/stats', (req, res) => {
  const numFile = db.nbFiles();
  const numUser = db.nbUsers();
  res.statusCode(200).send(`{ "user": ${numUser}, "files": ${numFile} }`);
});

app.listen(port);
