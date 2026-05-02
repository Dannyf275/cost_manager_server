// [NEW CHANGE] Set the environment to 'test' so the logger knows to skip DB saves
process.env.NODE_ENV = 'test';

const path = require('path');
// Ensure dotenv finds the .env file in the root directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../services/costs_service');

/*
 * Unit tests for the Costs Microservice.
 */
describe('Costs API Endpoints', () => {

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
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

    // Test the GET /api/report endpoint validation
    it('should return 400 if report query parameters are missing', async () => {
        // Missing year and month parameters in the query string
        const response = await request(app).get('/api/report?id=123123'); 
        
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Missing id, year, or month.');
    });
});