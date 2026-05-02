process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../services/about_service');

/*
 * Unit tests for the About Microservice.
 */
describe('About API Endpoints', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // Test the GET /api/about endpoint
    it('should fetch the team members array', async () => {
        const response = await request(app).get('/api/about');
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        // Check if your team members are returned
        expect(response.body.length).toBe(3);
    });
});