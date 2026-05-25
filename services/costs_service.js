const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const connectDb = require('../utils/db_connection'); // Updated to camelCase
const logger = require('../utils/logger');
const Cost = require('../models/cost');
const Report = require('../models/report');
const User = require('../models/user');

const app = express();
app.use(express.json());

// Middleware to log every incoming HTTP request
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, msg: 'Endpoint accessed' });
    next();
});

/*
 * POST /api/add
 * Adds a new cost item to the database.
 * Validates the input and checks if the user exists before adding.
 */
app.post('/api/add', async (req, res) => {
    try {
        const { description, category, userid, sum } = req.body;

        // Basic validation for missing parameters
        if (!description || !category || !userid || !sum) {
            return res.status(400).json({ id: null, message: "Missing required parameters." });
        }

        // Validate that the category is one of the allowed options
        const allowedCategories = ['food', 'health', 'housing', 'sports', 'education']; // Updated to camelCase
        if (!allowedCategories.includes(category)) {
            return res.status(400).json({ id: null, message: "Invalid category." });
        }

        // Validate that the user exists (As per Q&A #11)
        const userExists = await User.findOne({ id: userid }); // Updated to camelCase
        if (!userExists) {
            return res.status(404).json({ id: null, message: "User does not exist." });
        }

        // Create and save the new cost
        const newCost = new Cost({ description, category, userid, sum }); // Updated to camelCase
        const savedCost = await newCost.save(); // Updated to camelCase

        // Return the saved document
        res.status(201).json({
            description: savedCost.description,
            category: savedCost.category,
            userid: savedCost.userid,
            sum: savedCost.sum
        });
    } catch (error) {
        res.status(500).json({ id: null, message: `Error adding cost: ${error.message}` });
    }
});

/*
 * GET /api/report
 * Retrieves a monthly report for a specific user.
 * * COMPUTED DESIGN PATTERN IMPLEMENTATION:
 * This endpoint implements the Computed Design Pattern. When a report is requested,
 * the system first checks the 'reports' collection to see if the calculation for 
 * this specific user, year, and month has already been performed and saved.
 * If the pre-computed document exists, it is returned immediately, saving processing time.
 * If it does not exist, the system queries the 'costs' collection, performs the grouping 
 * and calculation, and generates the JSON. 
 * If the requested report is for a month that has already passed, this newly computed 
 * result is saved into the 'reports' collection for future requests.
 */
app.get('/api/report', async (req, res) => {
    try {
        const userid = Number(req.query.id);
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        // Input validation
        if (!userid || !year || !month) {
            return res.status(400).json({ id: null, message: "Missing id, year, or month." });
        }

        // Check if report is already computed and saved
        const existingReport = await Report.findOne({ userid, year, month }); // Updated to camelCase
        if (existingReport) {
            return res.status(200).json({
                userid: existingReport.userid,
                year: existingReport.year,
                month: existingReport.month,
                costs: existingReport.costs
            });
        }

        // If not found, compute the report
        const startDate = new Date(year, month - 1, 1); // Updated to camelCase
        const endDate = new Date(year, month, 1); // Updated to camelCase

        // Fetch costs for the specific month
        const rawCosts = await Cost.find({ // Updated to camelCase
            userid: userid,
            date: { $gte: startDate, $lt: endDate }
        });

        // Initialize structure ensuring all categories exist, even if empty
        const groupedCosts = { // Updated to camelCase
            food: [],
            education: [],
            health: [],
            housing: [],
            sports: []
        };

        // Populate the groups with cost data
        for (let i = 0; i < rawCosts.length; i++) {
            const cost = rawCosts[i];
            const day = cost.date.getDate();
            groupedCosts[cost.category].push({
                sum: cost.sum,
                description: cost.description,
                day: day
            });
        }

        // Format exactly as requested in the project instructions
        const finalCostsArray = [ // Updated to camelCase
            { food: groupedCosts.food },
            { education: groupedCosts.education },
            { health: groupedCosts.health },
            { housing: groupedCosts.housing },
            { sports: groupedCosts.sports }
        ];

        const reportData = { // Updated to camelCase
            userid: userid,
            year: year,
            month: month,
            costs: finalCostsArray
        };

        // Save computed pattern to database ONLY if it's a past month
        const currentDate = new Date(); // Updated to camelCase
        const isPastMonth = (year < currentDate.getFullYear()) ||  // Updated to camelCase
                              (year === currentDate.getFullYear() && month < (currentDate.getMonth() + 1));

        if (isPastMonth) {
            const savedReport = new Report(reportData); // Updated to camelCase
            await savedReport.save();
        }

        res.status(200).json(reportData);
    } catch (error) {
        res.status(500).json({ id: null, message: `Error generating report: ${error.message}` });
    }
});

// Updated port variable to be specific to this service
const PORT = process.env.PORT || process.env.COSTS_SERVICE_PORT || 3002; 
/*
 * Only start the server if this file is run directly (e.g., node costs_service.js).
 * If it is being imported by Jest for testing, do not bind to the port.
 */
if (require.main === module) {
    app.listen(PORT, async () => {
        await connectDb(); // Updated function call
        console.log(`Costs Service is running on port ${PORT}`);
    });
}

// Export the app for Supertest
module.exports = app;