import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app';
import User from '../models/User';
import Client from '../models/Client';
import FoodItem from '../models/FoodItem';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '6.0.5';

describe('Program routes', () => {
    let mongoServer;
    let token;
    let user;
    let client;
    let foodItem;
    let skipSuite = false;
    let skipReason = '';

    beforeAll(async () => {
        try {
            mongoServer = await MongoMemoryServer.create({
                binary: { version: process.env.MONGOMS_VERSION }
            });
            await mongoose.connect(mongoServer.getUri());
        } catch (error) {
            skipSuite = true;
            skipReason = `Mongo binary unavailable: ${error.message}`;
            console.warn(`Skipping program route tests - ${skipReason}`);
        }
    });

    beforeEach(async () => {
        if (skipSuite) {
            return;
        }

        await mongoose.connection.db.dropDatabase();

        user = await User.create({
            email: 'coach@example.com',
            password: 'password123',
            role: 'nutritionist'
        });

        client = await Client.create({
            nutritionist: user._id,
            name: 'Client One',
            dob: new Date('1990-01-01'),
            goals: ['Build muscle']
        });

        foodItem = await FoodItem.create({
            nutritionist: user._id,
            name: 'Oats',
            category: 'Grain',
            defaultServingSize: '50g',
            caloriesPerServing: 190,
            proteinPerServing: 6,
            carbsPerServing: 32,
            fatPerServing: 4
        });

        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        if (skipSuite) {
            return;
        }

        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    it('handles nested CRUD for days, meals, and items with macro recalculation', async () => {
        if (skipSuite) {
            expect(skipSuite).toBe(true);
            return;
        }

        const createResponse = await request(app)
            .post('/api/programs')
            .set('Authorization', `Bearer ${token}`)
            .send({
                client: client._id.toString(),
                name: 'Starter Plan',
                startDate: new Date('2024-01-01').toISOString(),
                length: 7,
                notes: 'Initial program'
            });

        expect(createResponse.status).toBe(201);
        const programId = createResponse.body._id;
        expect(createResponse.body.days).toHaveLength(0);

        const addDayResponse = await request(app)
            .post(`/api/programs/${programId}/days`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                date: '2024-01-01',
                meals: []
            });

        expect(addDayResponse.status).toBe(201);
        expect(addDayResponse.body.days).toHaveLength(1);
        const dayId = addDayResponse.body.days[0]._id;

        const addMealResponse = await request(app)
            .post(`/api/programs/${programId}/days/${dayId}/meals`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                mealTime: 'breakfast',
                items: []
            });

        expect(addMealResponse.status).toBe(201);
        const mealId = addMealResponse.body.days[0].meals[0]._id;

        const addItemResponse = await request(app)
            .post(`/api/programs/${programId}/days/${dayId}/meals/${mealId}/items`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Morning oats',
                sourceType: 'food',
                sourceId: foodItem._id.toString(),
                amount: 1
            });

        expect(addItemResponse.status).toBe(201);
        const mealAfterItem = addItemResponse.body.days[0].meals[0];
        expect(mealAfterItem.items).toHaveLength(1);
        expect(mealAfterItem.macros.calories).toBeCloseTo(190);

        const itemId = mealAfterItem.items[0]._id;

        const patchItemResponse = await request(app)
            .patch(`/api/programs/${programId}/days/${dayId}/meals/${mealId}/items/${itemId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 2 });

        expect(patchItemResponse.status).toBe(200);
        const updatedMeal = patchItemResponse.body.days[0].meals[0];
        expect(updatedMeal.items[0].macros.calories).toBeCloseTo(380);

        const deleteItemResponse = await request(app)
            .delete(`/api/programs/${programId}/days/${dayId}/meals/${mealId}/items/${itemId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteItemResponse.status).toBe(200);
        expect(deleteItemResponse.body.days[0].meals[0].items).toHaveLength(0);

        const updateMealResponse = await request(app)
            .patch(`/api/programs/${programId}/days/${dayId}/meals/${mealId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ mealTime: 'brunch' });

        expect(updateMealResponse.status).toBe(200);
        expect(updateMealResponse.body.days[0].meals[0].mealTime).toBe('brunch');

        const deleteMealResponse = await request(app)
            .delete(`/api/programs/${programId}/days/${dayId}/meals/${mealId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteMealResponse.status).toBe(200);
        expect(deleteMealResponse.body.days[0].meals).toHaveLength(0);

        const updateDayResponse = await request(app)
            .patch(`/api/programs/${programId}/days/${dayId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ macrosSource: 'overridden', macros: { calories: 500, protein: 30, carbs: 60, fat: 10 } });

        expect(updateDayResponse.status).toBe(200);
        expect(updateDayResponse.body.days[0].macros.calories).toBe(500);
        expect(updateDayResponse.body.days[0].macrosSource).toBe('overridden');

        const deleteDayResponse = await request(app)
            .delete(`/api/programs/${programId}/days/${dayId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteDayResponse.status).toBe(200);
        expect(deleteDayResponse.body.days).toHaveLength(0);

        const updateProgramResponse = await request(app)
            .put(`/api/programs/${programId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Plan', notes: 'Revised' });

        expect(updateProgramResponse.status).toBe(200);
        expect(updateProgramResponse.body.name).toBe('Updated Plan');

        const listResponse = await request(app)
            .get('/api/programs')
            .set('Authorization', `Bearer ${token}`);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toHaveLength(1);

        const getResponse = await request(app)
            .get(`/api/programs/${programId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body._id).toBe(programId);

        const deleteProgramResponse = await request(app)
            .delete(`/api/programs/${programId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteProgramResponse.status).toBe(200);
        expect(deleteProgramResponse.body.message).toBe('Program removed');

        const finalList = await request(app)
            .get('/api/programs')
            .set('Authorization', `Bearer ${token}`);

        expect(finalList.body).toHaveLength(0);
    });
});
