import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app';
import User from '../models/User';
import FoodItem from '../models/FoodItem';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '6.0.5';

describe('Recipe routes', () => {
    let mongoServer;
    let token;
    let user;
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
            console.warn(`Skipping recipe route tests - ${skipReason}`);
        }
    });

    beforeEach(async () => {
        if (skipSuite) {
            return;
        }

        await mongoose.connection.db.dropDatabase();

        user = await User.create({
            email: 'chef@example.com',
            password: 'password123',
            role: 'nutritionist'
        });

        foodItem = await FoodItem.create({
            nutritionist: user._id,
            name: 'Chicken Breast',
            category: 'Protein',
            defaultServingSize: '100g',
            caloriesPerServing: 165,
            proteinPerServing: 31,
            carbsPerServing: 0,
            fatPerServing: 3.6
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

    it('supports full CRUD including ingredient management with nutrition totals', async () => {
        if (skipSuite) {
            expect(skipSuite).toBe(true);
            return;
        }

        const createResponse = await request(app)
            .post('/api/recipes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Grilled Chicken Salad',
                description: 'Lean protein with veggies',
                imageUrl: '',
                instructions: 'Grill chicken and mix with vegetables.',
                tags: ['lunch'],
                ingredients: [
                    {
                        foodItem: foodItem._id.toString(),
                        amount: '200g',
                        quantity: 2,
                        notes: 'Grilled'
                    }
                ]
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.ingredients).toHaveLength(1);
        expect(createResponse.body.totalCalories).toBeCloseTo(330);
        const recipeId = createResponse.body._id;

        const listResponse = await request(app)
            .get('/api/recipes')
            .set('Authorization', `Bearer ${token}`);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toHaveLength(1);
        expect(listResponse.body[0].totalProtein).toBeCloseTo(62);

        const getResponse = await request(app)
            .get(`/api/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.totalFat).toBeCloseTo(7.2);

        const updateResponse = await request(app)
            .put(`/api/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Chicken Salad',
                description: 'Updated description',
                imageUrl: '',
                instructions: 'Still delicious.',
                tags: ['lunch', 'high-protein'],
                ingredients: [
                    {
                        foodItem: foodItem._id.toString(),
                        amount: '150g',
                        quantity: 1.5,
                        notes: 'Lightly grilled'
                    }
                ]
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.totalCalories).toBeCloseTo(247.5);

        const addIngredientResponse = await request(app)
            .post(`/api/recipes/${recipeId}/ingredients`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                foodItem: foodItem._id.toString(),
                amount: '50g',
                quantity: 0.5,
                notes: 'Add-on'
            });

        expect(addIngredientResponse.status).toBe(201);
        expect(addIngredientResponse.body.ingredients).toHaveLength(2);
        expect(addIngredientResponse.body.totalCalories).toBeCloseTo(330);
        const newIngredientId = addIngredientResponse.body.ingredients[1]._id;

        const patchIngredientResponse = await request(app)
            .patch(`/api/recipes/${recipeId}/ingredients/${newIngredientId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ quantity: 1 });

        expect(patchIngredientResponse.status).toBe(200);
        expect(patchIngredientResponse.body.totalCalories).toBeCloseTo(412.5);

        const deleteIngredientResponse = await request(app)
            .delete(`/api/recipes/${recipeId}/ingredients/${newIngredientId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteIngredientResponse.status).toBe(200);
        expect(deleteIngredientResponse.body.ingredients).toHaveLength(1);

        const deleteResponse = await request(app)
            .delete(`/api/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe('Recipe removed');

        const finalList = await request(app)
            .get('/api/recipes')
            .set('Authorization', `Bearer ${token}`);

        expect(finalList.body).toHaveLength(0);
    });
});
