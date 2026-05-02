const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const connect_db = require('../utils/db_connection');
const logger = require('../utils/logger');
const Log = require('../models/log');

const app = express();

// Middleware to log every incoming HTTP request
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, msg: 'Endpoint accessed' });
    next();
});

/*
 * GET /api/logs
 * Retrieves a list of all logs recorded in the database.
 */
app.get('/api/logs', async (req, res) => {
    try {
        // Retrieve all logs, hiding the internal MongoDB _id
        const logs = await Log.find({}, '-_id method url message timestamp');
        
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ id: null, message: `Error retrieving logs: ${error.message}` });
    }
});

const PORT = process.env.PORT || process.env.USERS_SERVICE_PORT || 3004;
/*
 * Only start the server if this file is run directly (e.g., node users_service.js).
 * If it is being imported by Jest for testing, do not bind to the port.
 */
if (require.main === module) {
    app.listen(PORT, async () => {
        await connect_db();
        console.log(`Service is running on port ${PORT}`);
    });
}

// Export the app for Supertest
module.exports = app;