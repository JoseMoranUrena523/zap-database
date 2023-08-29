const express = require('express');
const { QuickDB, MySQLDriver } = require("quick.db");
const cors = require('cors');
const app = express();

const apiKey = '!apiKeyForZapInterface12312!';

const checkApiKey = (req, res, next) => {
  const providedApiKey = req.headers['x-api-key'];
  if (!providedApiKey || providedApiKey !== apiKey) {
    return res.status(401).json({ error: 'You are not allowed to use our database.' });
  }
  next();
};

app.use(express.json());
app.use(checkApiKey);
app.use(cors());

(async () => {
  const mysql = new MySQLDriver({
    host: "zap-database.c3lajz9qzkbd.us-east-2.rds.amazonaws.com:3306",
    user: "admin",
    password: "zapPassword",
    database: "zap-database",
  });

  await mysql.connect();

  const db = new QuickDB({ driver: mysql });

  app.get('/', (req, res) => {
    const manual = {
      endpoints: [
        { method: 'GET', path: '/get?key=<key>', description: 'Retrieve the value associated with the provided key' },
        { method: 'POST', path: '/add', description: 'Add a key-value pair to the database (body: { "key": "<key>", "value": "<value>" })' },
        { method: 'DELETE', path: '/remove?key=<key>', description: 'Remove a key-value pair from the database' },
        { method: 'GET', path: '/list', description: 'List all entries in the database' },
      ]
    };
    res.json(manual);
  });
  
  // GET endpoint
  app.get('/get', (req, res) => {
    try {
      const key = req.query.key;
      const value = await db.get(key);
      
      if (value === null) {
        return res.status(404).json({ error: 'Key Not Found' });
      }
      
      res.json({ "data": value });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
  });
  
  // POST endpoint
  app.post('/add', (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || !value) {
        return res.status(400).json({ error: 'Both key and value are required.' });
      }
  
      await db.set(key, value);
      res.json({ message: `Key "${key}" was added!` });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
  });
  
  // DELETE endpoint
  app.delete('/remove', (req, res) => {
    try {
      const key = req.query.key;
      const existingValue = await db.get(key);
  
      if (existingValue === null) {
        return res.status(404).json({ error: 'Key Not Found' });
      }
  
      await db.delete(key);
      res.json({ message: `Key "${key}" is removed!` });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
  });
  
  // List all entries endpoint
  app.get('/list', (req, res) => {
    try {
      const entries = await db.all();
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
  });

})();

app.listen(process.env.PORT, () => {
  console.log("App is running!");
});
