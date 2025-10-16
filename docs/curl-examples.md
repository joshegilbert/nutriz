# Sample API Requests

All commands assume the backend is running on `http://localhost:5000`.

## Seed the database with demo data

Populate a nutritionist account, clients, foods, and recipes in one step:

```bash
cd nutriz-backend
npm run seed:sample
```

The script creates (or reuses) a nutritionist with the email `coach@nutriz.demo`
and password `DemoPass123!`. Override the defaults with `SEED_EMAIL` and
`SEED_PASSWORD` in your `.env` file if desired.

After seeding, log in through the frontend with the same credentials or capture a
JWT as shown below.

## Register a nutritionist account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "SuperSecret123",
    "role": "nutritionist"
  }'
```

## Login and capture the JWT
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "SuperSecret123"
  }'
# -> copy the "token" value from the response
```

Set the token for reuse:
```bash
TOKEN="<paste-token-here>"
```

## Create a client
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Athlete",
    "dob": "1990-04-12",
    "contact": {"email": "jane@example.com", "phone": "555-123-9876"},
    "goals": ["Build lean mass"],
    "notes": "Prefers plant-forward meals."
  }'
```

## List clients
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/clients
```

## Create a food item
```bash
curl -X POST http://localhost:5000/api/fooditems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grilled Chicken Breast",
    "category": "Protein",
    "defaultServingSize": "100g",
    "caloriesPerServing": 165,
    "proteinPerServing": 31,
    "carbsPerServing": 0,
    "fatPerServing": 4
  }'
```

## Create a recipe (references an existing food item id)
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicken Bowl",
    "description": "Balanced protein bowl",
    "instructions": "Combine all ingredients and serve warm.",
    "ingredients": [
      { "foodItem": "<food-item-id>", "amount": "1 serving", "quantity": 1 }
    ]
  }'
```
