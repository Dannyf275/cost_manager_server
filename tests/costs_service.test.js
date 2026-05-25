// Set the environment to 'test' so the logger knows to skip DB saves
process.env.NODE_ENV = 'test';

const path = require('path');
// Ensure dotenv finds the .env file in the root directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../services/costs_service');
const Cost = require('../models/cost'); // Added to clean up DB after test

/*
 * Unit tests for the Costs Microservice.
 */
describe('Costs API Endpoints', () => {

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        // Clean up the newly added test cost so it doesn't stay in the DB
        await Cost.deleteMany({ description: "Test valid cost" });
        await mongoose.connection.close();
    });

    // [NEW HAPPY PATH TEST] Test successful cost addition
    it('should successfully add a valid cost item', async () => {
        const response = await request(app)
            .post('/api/add')
            .send({
                description: "Test valid cost",
                category: "food", 
                userid: 123123, // Assuming this required user is in the DB
                sum: 50
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('description', 'Test valid cost');
        expect(response.body).toHaveProperty('category', 'food');
        expect(response.body).toHaveProperty('sum', 50);
    });

    // Test the POST /api/add cost endpoint validation
    it('should reject a cost item with an invalid category', async () => {
        const response = await request(app)
            .post('/api/add')
            .send({
                description: "Test description",
                category: "invalid_category", // Not in the enum list
                userid: 123123,
                sum: 100
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid category.');
    });

    // [NEW HAPPY PATH TEST] Test getting a valid report
    it('should fetch a structured monthly report for a user', async () => {
        const response = await request(app).get('/api/report?id=123123&year=2026&month=5'); 
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('userid', 123123);
        expect(response.body).toHaveProperty('costs');
        expect(Array.isArray(response.body.costs)).toBeTruthy();
    });

    // Test the GET /api/report endpoint validation
    it('should return 400 if report query parameters are missing', async () => {
        // Missing year and month parameters in the query string
        const response = await request(app).get('/api/report?id=123123'); 
        
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Missing id, year, or month.');
    });
});