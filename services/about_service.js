const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const logger = require('../utils/logger');
// Note: DB connection is not strictly necessary here if we use hardcoded data, 
// but we include the logger which connects to the DB for logging.
const connectDb = require('../utils/db_connection'); // Updated to camelCase

const app = express();

// Middleware to log every incoming HTTP request
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, msg: 'Endpoint accessed' });
    next();
});

/*
 * GET /api/about
 * Returns a JSON document describing the team members.
 * The names of the properties match the users collection, but data is hardcoded here 
 * as per the requirement not to store this in the database.
 */
app.get('/api/about', (req, res) => {
    try {
        const teamMembers = [ // Updated to camelCase
            { first_name: "daniel", last_name: "firley" },
            { first_name: "yoni", last_name: "libman" },
            { first_name: "yuval", last_name: "reznik" }
        ];

        res.status(200).json(teamMembers);
    } catch (error) {
        res.status(500).json({ id: null, message: `Error retrieving team details: ${error.message}` });
    }
});

// Updated port variable to be specific to this service
const PORT = process.env.PORT || process.env.ABOUT_SERVICE_PORT || 3003;
/*
 * Only start the server if this file is run directly (e.g., node about_service.js).
 * If it is being imported by Jest for testing, do not bind to the port.
 */
if (require.main === module) {
    app.listen(PORT, async () => {
        await connectDb(); // Updated function call
        console.log(`About Service is running on port ${PORT}`);
    });
}

// Export the app for Supertest
module.exports = app;