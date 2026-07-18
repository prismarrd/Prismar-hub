import re
import sys

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# --- Firestore Helpers ---
helpers = """
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
"""
content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + helpers)

# Replacements
content = re.sub(r'await db\.([a-zA-Z0-9_]+)\.add\(([^)]+)\)', r"await db.collection('\1').add(\2)", content)
content = re.sub(r'await db\.products\.update\(parseInt\(([^)]+)\),\s*([^)]+)\)', r"await db.collection('products').doc(\1).update(\2)", content)
content = re.sub(r'await db\.([a-zA-Z0-9_]+)\.update\(([^,]+),\s*([^)]+)\)', r"await db.collection('\1').doc(String(\2)).update(\3)", content)
content = re.sub(r'await db\.([a-zA-Z0-9_]+)\.delete\(([^)]+)\)', r"await db.collection('\1').doc(String(\2)).delete()", content)
content = re.sub(r'await db\.([a-zA-Z0-9_]+)\.get\(([^)]+)\)', r"await docGet('\1', \2)", content)
content = re.sub(r'await db\.([a-zA-Z0-9_]+)\.toArray\(\)', r"await colGet('\1')", content)
content = re.sub(r"await db\.([a-zA-Z0-9_]+)\.where\(\{productId:\s*([^}]+)\}\)\.toArray\(\)", r"await colWhere('\1', 'productId', String(\2))", content)
content = re.sub(r"await db\.layaways\.where\('status'\)\.equals\('pending'\)\.toArray\(\)", r"await colWhere('layaways', 'status', 'pending')", content)

# DOM element quotes
content = content.replace('editProduct(${p.id})', "editProduct('${p.id}')")
content = content.replace('deleteProduct(${p.id})', "deleteProduct('${p.id}')")
content = content.replace('deleteExpense(${e.id}, ${e.productId})', "deleteExpense('${e.id}', '${e.productId}')")
content = content.replace('markLayawaySold(${l.id}, ${l.productId})', "markLayawaySold('${l.id}', '${l.productId}')")
content = content.replace('cancelLayaway(${l.id}, ${l.productId})', "cancelLayaway('${l.id}', '${l.productId}')")
content = content.replace('editProduct(${l.productId})', "editProduct('${l.productId}')")
content = content.replace('window.quickEditPrice(p.id, p.price)', "window.quickEditPrice(String(p.id), p.price)")
content = content.replace("window.quickAdjustStock(p.id, p.stock, 'add')", "window.quickAdjustStock(String(p.id), p.stock, 'add')")
content = content.replace("window.quickAdjustStock(p.id, p.stock, 'remove')", "window.quickAdjustStock(String(p.id), p.stock, 'remove')")
content = content.replace("window.deleteProduct(p.id)", "window.deleteProduct(String(p.id))")

content = content.replace("const prodId = parseInt(document.getElementById('prod-id').value);", "const prodId = document.getElementById('prod-id').value;")

content = content.replace("allSales.filter(s => s.productId === p.id)", "allSales.filter(s => String(s.productId) === String(p.id))")
content = content.replace("allExpenses.filter(e => e.productId === p.id)", "allExpenses.filter(e => String(e.productId) === String(p.id))")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactor complete.")
