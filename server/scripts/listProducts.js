require('dotenv').config();

const { listProducts } = require('../services/bachsService');

async function main() {
    try {
        const products = await listProducts();
        console.log(JSON.stringify(products, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();