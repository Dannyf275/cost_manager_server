process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../services/logs_service');

/*
 * Unit tests for the Logs Microservice.
 */
describe('Logs API Endpoints', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // Test the GET /api/logs endpoint
    it('should fetch the list of all logs', async () => {
        const response = await request(app).get('/api/logs');
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });
});