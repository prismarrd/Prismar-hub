const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const helpers = `
    // --- Firestore Helpers ---
    async function docGet(collection, id) {
        if (!id) return null;
        const doc = await db.collection(collection).doc(String(id)).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    async function colGet(collection) {
        const snap = await db.collection(collection).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    async function colWhere(collection, field, value) {
        const snap = await db.collection(collection).where(field, '==', value).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
`;
content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\\n" + helpers);

// Replacements using Regex
content = content.replace(/await db\.([a-zA-Z0-9_]+)\.add\(([^)]+)\)/g, "await db.collection('$1').add($2)");
content = content.replace(/await db\.products\.update\(parseInt\(([^)]+)\),\s*([^)]+)\)/g, "await db.collection('products').doc($1).update($2)");
content = content.replace(/await db\.([a-zA-Z0-9_]+)\.update\(([^,]+),\s*([^)]+)\)/g, "await db.collection('$1').doc(String($2)).update($3)");
content = content.replace(/await db\.([a-zA-Z0-9_]+)\.delete\(([^)]+)\)/g, "await db.collection('$1').doc(String($2)).delete()");
content = content.replace(/await db\.([a-zA-Z0-9_]+)\.get\(([^)]+)\)/g, "await docGet('$1', $2)");
content = content.replace(/await db\.([a-zA-Z0-9_]+)\.toArray\(\)/g, "await colGet('$1')");
content = content.replace(/await db\.([a-zA-Z0-9_]+)\.where\(\{productId:\s*([^}]+)\}\)\.toArray\(\)/g, "await colWhere('$1', 'productId', String($2))");
content = content.replace(/await db\.layaways\.where\('status'\)\.equals\('pending'\)\.toArray\(\)/g, "await colWhere('layaways', 'status', 'pending')");

// String replacements
content = content.split('editProduct(${p.id})').join("editProduct('${p.id}')");
content = content.split('deleteProduct(${p.id})').join("deleteProduct('${p.id}')");
content = content.split('deleteExpense(${e.id}, ${e.productId})').join("deleteExpense('${e.id}', '${e.productId}')");
content = content.split('markLayawaySold(${l.id}, ${l.productId})').join("markLayawaySold('${l.id}', '${l.productId}')");
content = content.split('cancelLayaway(${l.id}, ${l.productId})').join("cancelLayaway('${l.id}', '${l.productId}')");
content = content.split('editProduct(${l.productId})').join("editProduct('${l.productId}')");
content = content.split('window.quickEditPrice(p.id, p.price)').join("window.quickEditPrice(String(p.id), p.price)");
content = content.split("window.quickAdjustStock(p.id, p.stock, 'add')").join("window.quickAdjustStock(String(p.id), p.stock, 'add')");
content = content.split("window.quickAdjustStock(p.id, p.stock, 'remove')").join("window.quickAdjustStock(String(p.id), p.stock, 'remove')");
content = content.split("window.deleteProduct(p.id)").join("window.deleteProduct(String(p.id))");

content = content.split("const prodId = parseInt(document.getElementById('prod-id').value);").join("const prodId = document.getElementById('prod-id').value;");
content = content.split("parseInt(document.getElementById('prod-id').value)").join("document.getElementById('prod-id').value");

content = content.split("allSales.filter(s => s.productId === p.id)").join("allSales.filter(s => String(s.productId) === String(p.id))");
content = content.split("allExpenses.filter(e => e.productId === p.id)").join("allExpenses.filter(e => String(e.productId) === String(p.id))");

fs.writeFileSync('app.js', content, 'utf8');
console.log('Refactor complete.');
