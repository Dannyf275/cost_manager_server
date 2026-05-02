// [NEW CHANGE] Set the environment to 'test' so the logger knows to skip DB saves
process.env.NODE_ENV = 'test';

const path = require('path');
// Ensure dotenv finds the .env file in the root directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../services/users_service');

/*
 * Unit tests for the Users Microservice.
 * We connect to the database before all tests and disconnect after all tests close.
 */
describe('Users API Endpoints', () => {

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // Test the GET /api/users endpoint
    it('should fetch the list of all users', async () => {
        const response = await request(app).get('/api/users');
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    // Test the POST /api/add user endpoint with missing parameters
    it('should return a 400 error when missing parameters', async () => {
        const response = await request(app)
            .post('/api/add')
            .send({
                first_name: "test",
                last_name: "user"
                // Missing id and birthday intentionally
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });

    // Test GET /api/users/:id for a non-existent user
    it('should return a 404 for a user that does not exist', async () => {
        const response = await request(app).get('/api/users/999999999');
        
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User not found.');
    });
});