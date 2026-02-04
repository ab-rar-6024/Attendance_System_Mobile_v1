console.log('🚀 Serverless function starting...');
require('dotenv').config();
console.log('✅ Environment variables loaded');

try {
    const app = require('../src/app');
    console.log('✅ App required successfully');
    module.exports = app;
} catch (err) {
    console.error('❌ FATAL ERROR DURING REQUIRE:', err);
    throw err;
}
