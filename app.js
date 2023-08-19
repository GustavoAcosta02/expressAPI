const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello cars');
}); 

app.get('/cars', async function(req, res) {
  try {
    const query = 'SELECT * FROM car';
    const [rows, fields] = await req.db.query(query);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.json({ success: false, message: err, data: null });
  }
});
app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
  
    await next();

  } catch (err) {

  }
});

app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

app.delete('/car/:id', async function(req, res) {
    try {
      const carId = req.params.id;
      const query = 'UPDATE car SET deleted_flag = 1 WHERE id = ?';
      await req.db.query(query, [carId]);
  
      res.json({ success: true, message: 'Car marked as deleted' });
    } catch (err) {
      res.json({ success: false, message: err, data: null });
    }
  });

  app.put('/car/:id', async function(req, res) {
    try {
      const carId = req.params.id;
      const { make, model, year } = req.body;
  
      const query = `
        UPDATE car
        SET make = ?, model = ?, year = ?
        WHERE id = ?
      `;
  
      await req.db.query(query, [make, model, year, carId]);
  
      res.json({ success: true, message: 'Car updated successfully' });
    } catch (err) {
      res.json({ success: false, message: err, data: null });
    }
  });


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));