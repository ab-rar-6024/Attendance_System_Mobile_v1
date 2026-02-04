const geocoder = require('node-geocoder');

const options = {
    provider: 'openstreetmap'
};

const geo = geocoder(options);

/**
 * Get location from IP (fallback)
 * Note: node-geocoder doesn't support IP geolocation like Python's geocoder.ip()
 * This is a simplified version - you may want to use a service like ipapi.co
 */
async function getLocation() {
    try {
        // For now, return a default location
        // In production, you'd want to use an IP geolocation service
        return 'Unknown|0.0000|0.0000';
    } catch (error) {
        console.error('Error getting location:', error);
        return 'Unknown|0.0000|0.0000';
    }
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(lat, lng) {
    try {
        const res = await geo.reverse({ lat, lon: lng });
        if (res && res.length > 0) {
            return res[0].formattedAddress || 'Unknown';
        }
        return 'Unknown';
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return 'Unknown';
    }
}

module.exports = {
    getLocation,
    reverseGeocode
};
