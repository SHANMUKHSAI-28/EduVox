const express = require('express');
const cors = require('cors');
require('dotenv').config();

const placesApiRouter = require('./placesApiProxy');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Use the Places API proxy router
app.use('/api/places', placesApiRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
