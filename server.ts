import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("[SERVER] Warning: Supabase credentials missing. API routes will fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mutable mock data for fallback
let currentOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    itemName: 'Обручка з діамантом',
    clientName: 'Олександр Коваль',
    clientPhone: '+380 67 123 45 67',
    status: 'IN_PROGRESS',
    deadline: '2024-04-15',
    totalAmount: 45000,
    advance: 15000,
    materials: [
      { id: 'm1', name: 'Золото 585', weight: 4.5, unit: 'g', type: 'metal' },
      { id: 'm2', name: 'Діамант 0.5ct', weight: 1, unit: 'pcs', type: 'stone' }
    ],
    photos: [{ url: 'https://picsum.photos/seed/ring1/800/600' }],
    payments: [],
    expenses: [],
    description: 'Класична обручка з білого золота з центральним каменем.',
    notes: 'Клієнт хоче гравіювання всередині.',
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    itemName: 'Кольє "Зоряне сяйво"',
    clientName: 'Марія Іванова',
    clientPhone: '+380 50 987 65 43',
    status: 'ACCEPTED',
    deadline: '2024-05-20',
    totalAmount: 120000,
    advance: 40000,
    materials: [
      { id: 'm3', name: 'Золото 750', weight: 12.2, unit: 'g', type: 'metal' },
      { id: 'm4', name: 'Сапфір', weight: 3, unit: 'pcs', type: 'stone' }
    ],
    photos: [{ url: 'https://picsum.photos/seed/necklace/800/600' }],
    payments: [],
    expenses: [],
    description: 'Вишукане кольє з сапфірами та дрібними діамантами.',
    notes: 'Терміново до ювілею.',
    createdAt: '2024-03-05T14:30:00Z'
  }
];

let currentCatalog = [
  {
    id: 'c1',
    modelId: 'MOD-001',
    name: 'Перстень "Аврора"',
    description: 'Сучасний дизайн з асиметричним кріпленням каменя.',
    baseMaterials: [{ id: 'm1', name: 'Золото 585', weight: 3.8, unit: 'g', type: 'metal' }],
    photos: [{ url: 'https://picsum.photos/seed/aurora/800/600' }],
    baseLaborCost: 8000,
    complexity: 'MEDIUM'
  },
  {
    id: 'c2',
    modelId: 'MOD-002',
    name: 'Сережки "Крапля"',
    description: 'Елегантні сережки з перлами.',
    baseMaterials: [{ id: 'm5', name: 'Срібло 925', weight: 5.5, unit: 'g', type: 'metal' }],
    photos: [{ url: 'https://picsum.photos/seed/earrings/800/600' }],
    baseLaborCost: 4500,
    complexity: 'LOW'
  }
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
  });

  // Helper to map Supabase data to our camelCase types
  const mapData = (o: any) => {
    if (!o || typeof o !== 'object') return o;
    return {
      ...o,
      orderNumber: o.orderNumber || o.order_number || o.orderNumber,
      itemName: o.itemName || o.item_name || o.itemName,
      clientName: o.clientName || o.client_name || o.clientName,
      clientPhone: o.clientPhone || o.client_phone || o.clientPhone,
      totalAmount: o.totalAmount || o.total_amount || o.totalAmount,
      baseLaborCost: o.baseLaborCost || o.base_labor_cost || o.baseLaborCost,
      createdAt: o.createdAt || o.created_at || o.createdAt,
      modelId: o.modelId || o.model_id || o.modelId,
      baseMaterials: o.baseMaterials || o.base_materials || o.baseMaterials,
      catalogItemId: o.catalogItemId || o.catalog_item_id || o.catalogItemId
    };
  };

  // API Routes
  app.get("/api/orders", async (req, res) => {
    if (!supabaseUrl || !supabaseKey) {
      return res.json(currentOrders);
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }); // Try snake_case first
      
      if (error) {
        // If sorting by created_at fails, try createdAt
        const { data: data2, error: error2 } = await supabase
          .from('orders')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (error2) throw error2;
        return res.json(data2?.map(mapData) || currentOrders);
      }
      res.json(data && data.length > 0 ? data.map(mapData) : currentOrders);
    } catch (err: any) {
      console.error("[SERVER] Error fetching orders:", err.message);
      res.json(currentOrders);
    }
  });

  app.post("/api/orders", async (req, res) => {
    const order = req.body;
    if (!supabaseUrl || !supabaseKey) {
      const newOrder = { ...order, id: Math.random().toString(36).substr(2, 9) };
      currentOrders = [newOrder, ...currentOrders];
      return res.status(201).json(newOrder);
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select();
      
      if (error || !data || data.length === 0) {
        console.warn("[SERVER] Supabase insert failed or returned no data, falling back to local storage:", error?.message || "No data returned");
        const newOrder = { ...order, id: Math.random().toString(36).substr(2, 9) };
        currentOrders = [newOrder, ...currentOrders];
        return res.status(201).json(newOrder);
      }
      res.status(201).json(mapData(data[0]));
    } catch (err: any) {
      console.error("[SERVER] Error creating order:", err?.message || err);
      const newOrder = { ...order, id: Math.random().toString(36).substr(2, 9) };
      currentOrders = [newOrder, ...currentOrders];
      res.status(201).json(newOrder);
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (!supabaseUrl || !supabaseKey) {
      currentOrders = currentOrders.map(o => o.id === id ? { ...o, ...updates } : o);
      return res.json({ success: true, data: currentOrders.find(o => o.id === id) });
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error || !data || data.length === 0) {
        console.warn("[SERVER] Supabase update failed or returned no data, falling back to local storage:", error?.message || "No data returned");
        currentOrders = currentOrders.map(o => o.id === id ? { ...o, ...updates } : o);
        return res.json({ success: true, data: currentOrders.find(o => o.id === id) });
      }
      res.json({ success: true, data: mapData(data[0]) });
    } catch (err: any) {
      console.error("[SERVER] Error updating order:", err?.message || err);
      currentOrders = currentOrders.map(o => o.id === id ? { ...o, ...updates } : o);
      res.json({ success: true, data: currentOrders.find(o => o.id === id) });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    if (!supabaseUrl || !supabaseKey) {
      currentOrders = currentOrders.filter(o => o.id !== id);
      return res.json({ success: true });
    }
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.warn("[SERVER] Supabase delete failed, falling back to local storage:", error.message);
        currentOrders = currentOrders.filter(o => o.id !== id);
        return res.json({ success: true });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("[SERVER] Error deleting order:", err.message);
      currentOrders = currentOrders.filter(o => o.id !== id);
      res.json({ success: true });
    }
  });

  app.get("/api/catalog", async (req, res) => {
    if (!supabaseUrl || !supabaseKey) {
      return res.json(currentCatalog);
    }
    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*');
      
      if (error) throw error;
      res.json(data && data.length > 0 ? data.map(mapData) : currentCatalog);
    } catch (err: any) {
      console.error("[SERVER] Error fetching catalog:", err.message);
      res.json(currentCatalog);
    }
  });

  app.post("/api/catalog", async (req, res) => {
    const item = req.body;
    if (!supabaseUrl || !supabaseKey) {
      const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
      currentCatalog = [newItem, ...currentCatalog];
      return res.status(201).json(newItem);
    }
    try {
      const { data, error } = await supabase
        .from('catalog')
        .insert([item])
        .select();
      
      if (error || !data || data.length === 0) {
        console.warn("[SERVER] Supabase catalog insert failed or returned no data, falling back to local storage:", error?.message || "No data returned");
        const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
        currentCatalog = [newItem, ...currentCatalog];
        return res.status(201).json(newItem);
      }
      res.status(201).json(mapData(data[0]));
    } catch (err: any) {
      console.error("[SERVER] Error creating catalog item:", err?.message || err);
      const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
      currentCatalog = [newItem, ...currentCatalog];
      res.status(201).json(newItem);
    }
  });

  app.patch("/api/catalog/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (!supabaseUrl || !supabaseKey) {
      currentCatalog = currentCatalog.map(i => i.id === id ? { ...i, ...updates } : i);
      return res.json(currentCatalog.find(i => i.id === id));
    }
    try {
      const { data, error } = await supabase
        .from('catalog')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error || !data || data.length === 0) {
        console.warn("[SERVER] Supabase catalog update failed or returned no data, falling back to local storage:", error?.message || "No data returned");
        currentCatalog = currentCatalog.map(i => i.id === id ? { ...i, ...updates } : i);
        return res.json(currentCatalog.find(i => i.id === id));
      }
      res.json(mapData(data[0]));
    } catch (err: any) {
      console.error("[SERVER] Error updating catalog item:", err?.message || err);
      currentCatalog = currentCatalog.map(i => i.id === id ? { ...i, ...updates } : i);
      res.json(currentCatalog.find(i => i.id === id));
    }
  });

  app.delete("/api/catalog/:id", async (req, res) => {
    const { id } = req.params;
    if (!supabaseUrl || !supabaseKey) {
      currentCatalog = currentCatalog.filter(i => i.id !== id);
      return res.json({ success: true });
    }
    try {
      // First clear references in orders
      await supabase
        .from('orders')
        .update({ catalogItemId: null })
        .eq('catalogItemId', id);

      // Then delete from catalog
      const { error } = await supabase
        .from('catalog')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.warn("[SERVER] Supabase catalog delete failed, falling back to local storage:", error.message);
        currentCatalog = currentCatalog.filter(i => i.id !== id);
        return res.json({ success: true });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("[SERVER] Error deleting catalog item:", err?.message || err);
      currentCatalog = currentCatalog.filter(i => i.id !== id);
      res.json({ success: true });
    }
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[SERVER] Unhandled error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err?.message || String(err),
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
