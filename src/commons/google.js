const axios = require('axios')

const GOOGLE_KEY = process.env.GOOGLE_MAP_API

async function getGeocode(lat, lng) {
  if (!lat || !lng)
    throw new Error('Latitude or longitude are missing to call Google Maps API.')
  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`)
  if (!data || !data.results) return []
  const locations = data.results.map((o) => o.geometry.location)
  console.debug('Google Maps Geocode locations', locations)
  return locations
}

module.exports = { getGeocode }
