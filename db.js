// Initialize Dexie DB
const db = new Dexie("PrismarERP");

// Define schema
db.version(5).stores({
    products: '++id, name, bundle, sku, category, supplier, status, image', // Status: active, inactive
    layaways: '++id, productId, customer, date, status', // Status: pending, sold, cancelled
    sales: '++id, productId, customer, date',
    expenses: '++id, productId, type, amount, date, description',
    history: '++id, entityType, entityId, action, date',
    dailyCash: '++id, date, status' // Status: open, closed
});

// Some initial data if empty
db.on('populate', async () => {
    console.log("Database initialized and empty, ready for Prismar ERP.");
});

db.open().catch(function (e) {
    console.error("Open failed: " + e.stack);
});
