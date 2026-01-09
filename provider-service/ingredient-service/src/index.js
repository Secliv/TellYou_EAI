const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes will be added here
// GET /ingredients
// POST /order
// POST /update-stock

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ingredient-service' });
});

app.listen(PORT, () => {
  console.log(`Ingredient Management Service running on port ${PORT}`);
});

