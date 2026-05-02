const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const connect_db = require('../utils/db_connection');
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
        const allowed_categories = ['food', 'health', 'housing', 'sports', 'education'];
        if (!allowed_categories.includes(category)) {
            return res.status(400).json({ id: null, message: "Invalid category." });
        }

        // Validate that the user exists (As per Q&A #11)
        const user_exists = await User.findOne({ id: userid });
        if (!user_exists) {
            return res.status(404).json({ id: null, message: "User does not exist." });
        }

        // Create and save the new cost
        const new_cost = new Cost({ description, category, userid, sum });
        const saved_cost = await new_cost.save();

        // Return the saved document
        res.status(201).json({
            description: saved_cost.description,
            category: saved_cost.category,
            userid: saved_cost.userid,
            sum: saved_cost.sum
        });
    } catch (error) {
        res.status(500).json({ id: null, message: `Error adding cost: ${error.message}` });
    }
});

/*
 * GET /api/report
 * Retrieves a monthly report for a specific user.
 * 
 * COMPUTED DESIGN PATTERN IMPLEMENTATION:
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
        const existing_report = await Report.findOne({ userid, year, month });
        if (existing_report) {
            return res.status(200).json({
                userid: existing_report.userid,
                year: existing_report.year,
                month: existing_report.month,
                costs: existing_report.costs
            });
        }

        // If not found, compute the report
        const start_date = new Date(year, month - 1, 1);
        const end_date = new Date(year, month, 1);

        // Fetch costs for the specific month
        const raw_costs = await Cost.find({
            userid: userid,
            date: { $gte: start_date, $lt: end_date }
        });

        // Initialize structure ensuring all categories exist, even if empty
        const grouped_costs = {
            food: [],
            education: [],
            health: [],
            housing: [],
            sports: []
        };

        // Populate the groups with cost data
        for (let i = 0; i < raw_costs.length; i++) {
            const cost = raw_costs[i];
            const day = cost.date.getDate();
            grouped_costs[cost.category].push({
                sum: cost.sum,
                description: cost.description,
                day: day
            });
        }

        // Format exactly as requested in the project instructions
        const final_costs_array = [
            { food: grouped_costs.food },
            { education: grouped_costs.education },
            { health: grouped_costs.health },
            { housing: grouped_costs.housing },
            { sports: grouped_costs.sports }
        ];

        const report_data = {
            userid: userid,
            year: year,
            month: month,
            costs: final_costs_array
        };

        // Save computed pattern to database ONLY if it's a past month
        const current_date = new Date();
        const is_past_month = (year < current_date.getFullYear()) || 
                              (year === current_date.getFullYear() && month < (current_date.getMonth() + 1));

        if (is_past_month) {
            const saved_report = new Report(report_data);
            await saved_report.save();
        }

        res.status(200).json(report_data);
    } catch (error) {
        res.status(500).json({ id: null, message: `Error generating report: ${error.message}` });
    }
});

const PORT = process.env.PORT || process.env.USERS_SERVICE_PORT || 3002;
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