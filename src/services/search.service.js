const googleAPI = require('./../commons/google')

async function searchListings(latlng) {
  const latAndLng = latlng.split(',')
  if (!latAndLng)
    throw new Error('Latitude or longitude are missing to call Google Maps API.')
  const geoLocations = await googleAPI.getGeocode(latAndLng[0], latAndLng[1])
  return []
}

module.exports = { searchListings }
