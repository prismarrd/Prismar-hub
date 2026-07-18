const firebaseConfig = {
  apiKey: "AIzaSyBP-4A59M-yoj0euyjdiMhMJKTiXGOGgmY",
  authDomain: "prisma-hub-cd693.firebaseapp.com",
  projectId: "prisma-hub-cd693",
  storageBucket: "prisma-hub-cd693.firebasestorage.app",
  messagingSenderId: "791883243014",
  appId: "1:791883243014:web:6b74199c57a596d5742d87",
  measurementId: "G-7H3LRRLZV3"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// Habilitar modo offline para seguir funcionando sin internet
firestore.enablePersistence().catch((err) => {
    console.error("Firebase Offline Error:", err.code);
});

// =========================================================================
// FIREBASE ADAPTER (Capa de compatibilidad con Dexie.js)
// Esto permite que app.js siga funcionando exactamente igual, 
// pero guardando los datos en la nube (Firestore) en lugar de en local.
// =========================================================================

class FirestoreAdapter {
    constructor(collectionName) {
        this.col = firestore.collection(collectionName);
    }
    
    async add(obj) {
        // Usamos timestamp para generar un ID numérico que app.js pueda parsear con parseInt()
        const id = Date.now();
        await this.col.doc(String(id)).set(obj);
        return id;
    }
    
    async update(id, obj) {
        if(!id) return;
        await this.col.doc(String(id)).update(obj);
    }
    
    async get(id) {
        if(!id) return null;
        const doc = await this.col.doc(String(id)).get();
        if(doc.exists) {
            return { id: parseInt(doc.id), ...doc.data() };
        }
        return null;
    }
    
    async delete(id) {
        if(!id) return;
        await this.col.doc(String(id)).delete();
    }
    
    async toArray() {
        const snap = await this.col.get();
        return snap.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
    }
    
    where(conditions) {
        let query = this.col;
        
        // Soporte para: db.collection.where({ productId: 123, status: 'pending' })
        if (typeof conditions === 'object') {
            for(let key in conditions) {
                query = query.where(key, '==', conditions[key]);
            }
            return {
                toArray: async () => {
                    const snap = await query.get();
                    return snap.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
                }
            }
        }
        
        // Soporte para sintaxis encadenada si se usara: db.collection.where('status').equals('pending')
        if (typeof conditions === 'string') {
            const field = conditions;
            return {
                equals: (val) => ({
                    toArray: async () => {
                        const snap = await this.col.where(field, '==', val).get();
                        return snap.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
                    }
                })
            }
        }
    }
}

// Reemplazamos la variable db global
const db = {
    products: new FirestoreAdapter('products'),
    layaways: new FirestoreAdapter('layaways'),
    sales: new FirestoreAdapter('sales'),
    expenses: new FirestoreAdapter('expenses'),
    history: new FirestoreAdapter('history'),
    dailyCash: new FirestoreAdapter('dailyCash'),
    
    // Ignorar inicializaciones antiguas de Dexie
    version: function() { return this; },
    stores: function() { return this; },
    on: function() {},
    open: async function() {}
};
