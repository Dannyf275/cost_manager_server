const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Explicitly finds .env in root
const express = require('express');
const connect_db = require('../utils/db_connection'); // Navigates up
const logger = require('../utils/logger');
const User = require('../models/user');
const Cost = require('../models/cost');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, msg: 'Endpoint accessed' });
    next();
});

/*
 * POST /api/add
 * Adds a new user to the database.
 * Expects id, first_name, last_name, and birthday in the request body.
 */
app.post('/api/add', async (req, res) => {
    try {
        // Extract parameters from the request body
        const { id, first_name, last_name, birthday } = req.body;

        // Check if all required fields are present
        if (!id || !first_name || !last_name || !birthday) {
            return res.status(400).json({ 
                id: id || null, 
                message: "Missing required parameters: id, first_name, last_name, or birthday." 
            });
        }

        // Create a new User document
        const new_user = new User({ id, first_name, last_name, birthday });
        
        // Save the user to the database
        const saved_user = await new_user.save();

        // Return the saved user details omitting MongoDB internal properties
        res.status(201).json({
            id: saved_user.id,
            first_name: saved_user.first_name,
            last_name: saved_user.last_name,
            birthday: saved_user.birthday
        });
    } catch (error) {
        // Handle database or server errors
        res.status(500).json({ 
            id: req.body.id || null, 
            message: `Error adding user: ${error.message}` 
        });
    }
});

/*
 * GET /api/users/:id
 * Retrieves the details of a specific user including their total costs.
 */
app.get('/api/users/:id', async (req, res) => {
    try {
        // Extract the user ID from the URL parameters and convert to a number
        const user_id = Number(req.params.id);

        // Find the user in the database
        const user = await User.findOne({ id: user_id });

        // If the user does not exist, return an error
        if (!user) {
            return res.status(404).json({ 
                id: user_id, 
                message: "User not found." 
            });
        }

        // Find all cost items associated with this user ID
        const user_costs = await Cost.find({ userid: user_id });

        // Calculate the total sum of all costs for this user
        let total_costs = 0;
        for (let i = 0; i < user_costs.length; i++) {
            total_costs += user_costs[i].sum;
        }

        // Return the formatted JSON response
        res.status(200).json({
            first_name: user.first_name,
            last_name: user.last_name,
            id: user.id,
            total: total_costs
        });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ 
            id: req.params.id || null, 
            message: `Error retrieving user details: ${error.message}` 
        });
    }
});

/*
 * GET /api/users
 * Retrieves a list of all users in the database.
 */
app.get('/api/users', async (req, res) => {
    try {
        // Fetch all users, excluding the MongoDB _id field from the result
        const users = await User.find({}, '-_id id first_name last_name birthday');
        
        // Return the array of user documents
        res.status(200).json(users);
    } catch (error) {
        // Handle server errors
        res.status(500).json({ 
            id: null, 
            message: `Error retrieving users list: ${error.message}` 
        });
    }
});

// Start the process
const PORT = process.env.PORT || process.env.USERS_SERVICE_PORT || 3001;
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