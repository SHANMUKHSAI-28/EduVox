const express = require('express');
const cors = require('cors');
const axios = require('axios');
const router = express.Router();

// Enable CORS for all routes in this router
router.use(cors());

// Proxy endpoint for Places API text search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    try {
      // Try the new Places API v1 first
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: query,
          languageCode: "en"
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.phoneNumber,places.photos'
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      // If new API fails, try legacy API
      console.log('Falling back to legacy Places API');
      const legacyResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
      );
      
      // Map legacy response to match what the client expects
      const mappedResponse = {
        places: legacyResponse.data.results.map(place => ({
          id: place.place_id,
          displayName: { text: place.name },
          formattedAddress: place.formatted_address,
          rating: place.rating || null,
          photos: place.photos ? place.photos.map(photo => ({
            name: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
          })) : [],
          phoneNumber: place.formatted_phone_number || null,
          websiteUri: place.website || null
        }))
      };
      
      res.json(mappedResponse);
    }
  } catch (error) {
    console.error('Places API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch place data' });
  }
});

// Proxy endpoint for Places API details
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    try {
      // Try new Places API v1 first
      const response = await axios.get(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,websiteUri,rating,phoneNumber,photos,reviews'
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      // If new API fails, try legacy API
      console.log('Falling back to legacy Places API details');
      const legacyResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,website,rating,formatted_phone_number,photos,reviews&key=${apiKey}`
      );
      
      const result = legacyResponse.data.result;
      // Map legacy response to match what the client expects
      const mappedResponse = {
        website_url: result.website || null,
        formatted_address: result.formatted_address || null,
        phone_number: result.formatted_phone_number || null,
        rating: result.rating || null,
        photos: result.photos ? result.photos.map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
        ) : [],
        reviews_count: result.reviews ? result.reviews.length : 0
      };
      
      res.json(mappedResponse);
    }
  } catch (error) {
    console.error('Places API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

module.exports = router;
