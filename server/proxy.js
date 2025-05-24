// Google API Proxy Server
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Google Places Text Search endpoint
app.get('/api/google/textsearch', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await axios.get(url);
    
    res.json(response.data);
  } catch (error) {
    console.error('Google API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Google API' });
  }
});

// Google Places Details endpoint
app.get('/api/google/details', async (req, res) => {
  try {
    const { place_id, fields } = req.query;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!place_id) {
      return res.status(400).json({ error: 'place_id parameter is required' });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields || 'name,formatted_address,website,photos,rating,formatted_phone_number,reviews'}&key=${apiKey}`;
    const response = await axios.get(url);
    
    res.json(response.data);
  } catch (error) {
    console.error('Google API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Google API' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
