import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertStorageLocationSchema, insertIngredientSchema,
  insertRecipeSchema, insertRecipeIngredientSchema, insertProductionSchema,
  insertOrderSchema, insertOrderItemSchema, insertDeliverySchema,
  insertProductStockSchema, insertLabelSchema, insertMeasurementCategorySchema,
  insertMeasurementUnitSchema, insertArticleCategorySchema, insertArticleSchema, insertPriceListSchema,
  insertPriceRuleSchema, insertTaxSchema, insertCurrencySchema, insertDeliveryMethodSchema,
  insertAccountingJournalSchema, insertAccountingAccountSchema, insertStorageZoneSchema,
  insertWorkStationSchema, insertSupplierSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Storage locations routes
  app.get("/api/storage-locations", async (req, res) => {
    try {
      const locations = await storage.getAllStorageLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage locations" });
    }
  });

  app.post("/api/storage-locations", async (req, res) => {
    try {
      const locationData = insertStorageLocationSchema.parse(req.body);
      const location = await storage.createStorageLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: "Invalid storage location data" });
    }
  });

  // Ingredients routes
  app.get("/api/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getAllIngredients();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/ingredients/low-stock", async (req, res) => {
    try {
      const ingredients = await storage.getLowStockIngredients();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(ingredientData);
      res.status(201).json(ingredient);
    } catch (error) {
      res.status(400).json({ message: "Invalid ingredient data" });
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredientData = req.body;
      const ingredient = await storage.updateIngredient(id, ingredientData);
      
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }

      res.json(ingredient);
    } catch (error) {
      res.status(400).json({ message: "Failed to update ingredient" });
    }
  });

  app.put("/api/ingredients/:id/stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const ingredient = await storage.updateIngredientStock(id, quantity);
      
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }

      res.json(ingredient);
    } catch (error) {
      res.status(400).json({ message: "Failed to update ingredient stock" });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteIngredient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Ingredient not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  // Recipes routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getAllRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/active", async (req, res) => {
    try {
      const recipes = await storage.getActiveRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active recipes" });
    }
  });

  app.get("/api/recipes/:id/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipeIngredients = await storage.getRecipeIngredients(recipeId);
      
      // Get full ingredient details
      const ingredientsWithDetails = await Promise.all(
        recipeIngredients.map(async (ri) => {
          const ingredient = await storage.getIngredient(ri.ingredientId!);
          return {
            ...ri,
            ingredient
          };
        })
      );

      res.json(ingredientsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const recipeData = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(recipeData);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ message: "Invalid recipe data" });
    }
  });

  app.post("/api/recipes/:id/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const ingredientData = insertRecipeIngredientSchema.parse({
        ...req.body,
        recipeId
      });
      const recipeIngredient = await storage.createRecipeIngredient(ingredientData);
      res.status(201).json(recipeIngredient);
    } catch (error) {
      res.status(400).json({ message: "Invalid recipe ingredient data" });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipeData = req.body;
      const recipe = await storage.updateRecipe(id, recipeData);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json(recipe);
    } catch (error) {
      res.status(400).json({ message: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Delete recipe ingredients first
      await storage.deleteRecipeIngredientsByRecipe(id);
      
      const deleted = await storage.deleteRecipe(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Productions routes
  app.get("/api/productions", async (req, res) => {
    try {
      const productions = await storage.getAllProductions();
      
      // Get full details for each production
      const productionsWithDetails = await Promise.all(
        productions.map(async (production) => {
          const recipe = await storage.getRecipe(production.recipeId!);
          const preparer = await storage.getUser(production.preparerId!);
          return {
            ...production,
            recipe,
            preparer: preparer ? { id: preparer.id, firstName: preparer.firstName, lastName: preparer.lastName } : null
          };
        })
      );

      res.json(productionsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch productions" });
    }
  });

  app.get("/api/productions/today", async (req, res) => {
    try {
      const productions = await storage.getTodayProductions();
      res.json(productions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's productions" });
    }
  });

  app.post("/api/productions", async (req, res) => {
    try {
      console.log("Production creation request:", req.body);
      
      // Don't convert dates anymore since schema uses string mode
      const productionData = insertProductionSchema.parse(req.body);
      const production = await storage.createProduction(productionData);
      res.status(201).json(production);
    } catch (error) {
      console.error("Production creation error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ message: "Invalid production data", error: error.message });
    }
  });

  app.patch("/api/productions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const updateData: any = { status };
      
      // Add timestamps based on status transitions
      if (status === "en_production") {
        updateData.startTime = new Date().toISOString();
      } else if (status === "termine") {
        updateData.endTime = new Date().toISOString();
        
        // Update ingredient stocks when completed
        const production = await storage.getProduction(id);
        if (production) {
          const recipeIngredients = await storage.getRecipeIngredients(production.recipeId!);
          for (const ri of recipeIngredients) {
            const quantityUsed = parseFloat(ri.quantity) * production.quantity;
            await storage.updateIngredientStock(ri.ingredientId!, -quantityUsed);
          }
        }
      }
      
      const production = await storage.updateProduction(id, updateData);
      
      if (!production) {
        return res.status(404).json({ message: "Production not found" });
      }

      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Failed to update production status" });
    }
  });

  app.put("/api/productions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productionData = req.body;
      const production = await storage.updateProduction(id, productionData);
      
      if (!production) {
        return res.status(404).json({ message: "Production not found" });
      }

      res.json(production);
    } catch (error) {
      console.error("Production update error:", error);
      res.status(400).json({ message: "Failed to update production", error: error.message });
    }
  });

  app.delete("/api/productions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduction(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Production not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete production" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      if (customerId) {
        // Get orders for specific customer
        const orders = await storage.getOrdersByCustomer(customerId);
        res.json(orders);
      } else {
        // Get all orders
        const orders = await storage.getAllOrders();
        res.json(orders);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const orderItems = await storage.getOrderItems(orderId);
      
      // Get full recipe details
      const itemsWithDetails = await Promise.all(
        orderItems.map(async (item) => {
          const recipe = await storage.getRecipe(item.recipeId!);
          return {
            ...item,
            recipe
          };
        })
      );

      res.json(itemsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post("/api/order-items", async (req, res) => {
    try {
      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);
      res.status(201).json(orderItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid order item data" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      
      // Convert string dates to Date objects if needed
      const processedOrderData = { ...orderData };
      if (processedOrderData.deliveryDate && typeof processedOrderData.deliveryDate === 'string') {
        processedOrderData.deliveryDate = new Date(processedOrderData.deliveryDate);
      }
      
      // Don't send createdAt and updatedAt from client - let database handle them
      delete processedOrderData.createdAt;
      delete processedOrderData.updatedAt;
      
      // Create the order first
      const order = await storage.createOrder(processedOrderData);
      
      // Create order items if provided
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            recipeId: item.recipeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          });
        }
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = req.body;
      
      // Don't update createdAt from client
      delete orderData.createdAt;
      
      const order = await storage.updateOrder(id, orderData);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order" });
    }
  });

  // Deliveries routes
  app.get("/api/deliveries", async (req, res) => {
    try {
      const delivererId = req.query.delivererId ? parseInt(req.query.delivererId as string) : undefined;
      const available = req.query.available === 'true';
      const status = req.query.status as string;
      
      let deliveries;
      
      if (delivererId) {
        deliveries = await storage.getDeliveriesByDeliverer(delivererId);
      } else if (available && status === 'assigned') {
        deliveries = await storage.getAvailableDeliveries();
      } else {
        deliveries = await storage.getAllDeliveries();
      }
      
      // Get full order details for each delivery
      const deliveriesWithDetails = await Promise.all(
        deliveries.map(async (delivery: any) => {
          const order = await storage.getOrder(delivery.orderId!);
          return {
            ...delivery,
            order
          };
        })
      );

      res.json(deliveriesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error) {
      res.status(400).json({ message: "Invalid delivery data" });
    }
  });

  app.patch("/api/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveryData = req.body;
      const delivery = await storage.updateDelivery(id, deliveryData);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      res.json(delivery);
    } catch (error) {
      res.status(400).json({ message: "Failed to update delivery" });
    }
  });

  // Product Stock routes
  app.get("/api/product-stock", async (req, res) => {
    try {
      const productStock = await storage.getAllProductStock();
      res.json(productStock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product stock" });
    }
  });

  app.get("/api/product-stock/order/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const productStock = await storage.getProductStockByOrder(orderId);
      res.json(productStock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product stock for order" });
    }
  });

  app.post("/api/product-stock", async (req, res) => {
    try {
      // Generate unique barcode
      const barcode = `PST${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      
      const productStockData = {
        ...req.body,
        barcode
      };
      
      const productStock = await storage.createProductStock(productStockData);
      res.status(201).json(productStock);
    } catch (error) {
      res.status(400).json({ message: "Invalid product stock data" });
    }
  });

  // Labels routes
  app.get("/api/labels", async (req, res) => {
    try {
      const labels = await storage.getAllLabels();
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labels" });
    }
  });

  app.get("/api/labels/unprinted", async (req, res) => {
    try {
      const labels = await storage.getUnprintedLabels();
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unprinted labels" });
    }
  });

  app.post("/api/labels", async (req, res) => {
    try {
      // Generate unique barcode if not provided
      const barcode = req.body.barcode || `LBL${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      
      const labelData = {
        ...req.body,
        barcode
      };
      
      const label = await storage.createLabel(labelData);
      res.status(201).json(label);
    } catch (error) {
      res.status(400).json({ message: "Invalid label data" });
    }
  });

  app.patch("/api/labels/:id/print", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const label = await storage.markLabelAsPrinted(id);
      
      if (!label) {
        return res.status(404).json({ message: "Label not found" });
      }

      res.json(label);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark label as printed" });
    }
  });

  // Complete production with storage and labeling
  app.post("/api/productions/:id/complete-with-storage", async (req, res) => {
    try {
      const productionId = parseInt(req.params.id);
      const { storageLocationId, expirationDate, customerName, orderId } = req.body;

      // Get production details
      const production = await storage.getProduction(productionId);
      if (!production) {
        return res.status(404).json({ message: "Production not found" });
      }

      // Get recipe details
      const recipe = await storage.getRecipe(production.recipeId!);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Get preparer details
      const preparer = await storage.getUser(production.preparerId!);

      // Complete the production
      await storage.updateProduction(productionId, { 
        status: "termine", 
        endTime: new Date() 
      });

      // Create product stock entry
      const productStock = await storage.createProductStock({
        productionId,
        recipeId: production.recipeId!,
        orderId: orderId || null,
        customerName: customerName || "Stock général",
        quantity: production.quantity,
        storageLocationId,
        expirationDate: new Date(expirationDate),
        preparerId: production.preparerId!,
        status: "available"
      });

      // Create label for the product
      const label = await storage.createLabel({
        productStockId: productStock.id,
        barcode: productStock.barcode!,
        productName: recipe.name,
        customerName: customerName || "Stock général",
        productionDate: new Date(),
        expirationDate: new Date(expirationDate),
        preparerName: preparer ? `${preparer.firstName} ${preparer.lastName}` : "Inconnu",
        quantity: production.quantity
      });

      // Update ingredient stocks
      const recipeIngredients = await storage.getRecipeIngredients(production.recipeId!);
      for (const ri of recipeIngredients) {
        const quantityUsed = parseFloat(ri.quantity) * production.quantity;
        await storage.updateIngredientStock(ri.ingredientId!, -quantityUsed);
      }

      res.json({
        production,
        productStock,
        label,
        message: "Production completed and stored successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete production with storage" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const lowStockIngredients = await storage.getLowStockIngredients();
      const activeOrders = await storage.getOrdersByStatus("preparation");
      const todayProductions = await storage.getTodayProductions();
      
      // Calculate daily revenue (mock calculation)
      const todayOrders = await storage.getRecentOrders(50);
      const todayDelivered = todayOrders.filter(order => 
        order.status === "delivered" && 
        new Date(order.createdAt!).toDateString() === new Date().toDateString()
      );
      const dailyRevenue = todayDelivered.reduce((sum, order) => 
        sum + parseFloat(order.totalAmount), 0
      );

      res.json({
        lowStockCount: lowStockIngredients.length,
        activeOrdersCount: activeOrders.length,
        todayProductionCount: todayProductions.length,
        dailyRevenue: dailyRevenue.toFixed(2)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Measurement Categories routes
  app.get("/api/measurement-categories", async (req, res) => {
    try {
      const categories = await storage.getAllMeasurementCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurement categories" });
    }
  });

  app.get("/api/measurement-categories/active", async (req, res) => {
    try {
      const categories = await storage.getActiveMeasurementCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active measurement categories" });
    }
  });

  app.get("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getMeasurementCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Measurement category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurement category" });
    }
  });

  app.post("/api/measurement-categories", async (req, res) => {
    try {
      const categoryData = insertMeasurementCategorySchema.parse(req.body);
      const category = await storage.createMeasurementCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid measurement category data" });
    }
  });

  app.put("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      const category = await storage.updateMeasurementCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Measurement category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update measurement category" });
    }
  });

  app.delete("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMeasurementCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Measurement category not found" });
      }

      res.json({ message: "Measurement category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete measurement category" });
    }
  });

  // Measurement Units routes
  app.get("/api/measurement-units", async (req, res) => {
    try {
      const units = await storage.getAllMeasurementUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurement units" });
    }
  });

  app.get("/api/measurement-units/active", async (req, res) => {
    try {
      const units = await storage.getActiveMeasurementUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active measurement units" });
    }
  });

  app.get("/api/measurement-units/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const units = await storage.getMeasurementUnitsByCategory(categoryId);
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurement units by category" });
    }
  });

  app.get("/api/measurement-units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await storage.getMeasurementUnit(id);
      
      if (!unit) {
        return res.status(404).json({ message: "Measurement unit not found" });
      }

      res.json(unit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurement unit" });
    }
  });

  app.post("/api/measurement-units", async (req, res) => {
    try {
      const unitData = insertMeasurementUnitSchema.parse(req.body);
      const unit = await storage.createMeasurementUnit(unitData);
      res.status(201).json(unit);
    } catch (error) {
      res.status(400).json({ message: "Invalid measurement unit data" });
    }
  });

  app.put("/api/measurement-units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const unitData = req.body;
      const unit = await storage.updateMeasurementUnit(id, unitData);
      
      if (!unit) {
        return res.status(404).json({ message: "Measurement unit not found" });
      }

      res.json(unit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update measurement unit" });
    }
  });

  app.delete("/api/measurement-units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMeasurementUnit(id);
      
      if (!success) {
        return res.status(404).json({ message: "Measurement unit not found" });
      }

      res.json({ message: "Measurement unit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete measurement unit" });
    }
  });

  // Article Categories routes
  app.get("/api/article-categories", async (req, res) => {
    try {
      const categories = await storage.getAllArticleCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article categories" });
    }
  });

  // Articles routes (unified products, ingredients, services)
  app.get("/api/articles", async (req, res) => {
    try {
      const { type, categoryId, active } = req.query;
      let articles;
      
      if (type) {
        articles = await storage.getArticlesByType(type as string);
      } else if (categoryId) {
        articles = await storage.getArticlesByCategory(parseInt(categoryId as string));
      } else if (active === "true") {
        articles = await storage.getActiveArticles();
      } else {
        articles = await storage.getAllArticles();
      }
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Route spécifique pour les ingrédients (articles de type "ingredient")
  app.get("/api/articles/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getArticlesByType("ingredient");
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const article = await storage.updateArticle(id, updateData);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      res.status(400).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArticle(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  app.get("/api/article-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getArticleCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Article category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article category" });
    }
  });

  app.get("/api/article-categories/parent/:parentId", async (req, res) => {
    try {
      const parentId = req.params.parentId === 'null' ? null : parseInt(req.params.parentId);
      const categories = await storage.getArticleCategoriesByParent(parentId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article categories by parent" });
    }
  });

  app.post("/api/article-categories", async (req, res) => {
    try {
      const categoryData = insertArticleCategorySchema.parse(req.body);
      const category = await storage.createArticleCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid article category data" });
    }
  });

  app.put("/api/article-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      const category = await storage.updateArticleCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Article category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update article category" });
    }
  });

  app.delete("/api/article-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArticleCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article category not found" });
      }

      res.json({ message: "Article category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article category" });
    }
  });

  // Price Lists routes
  app.get("/api/price-lists", async (req, res) => {
    try {
      const priceLists = await storage.getAllPriceLists();
      res.json(priceLists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price lists" });
    }
  });

  app.get("/api/price-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const priceList = await storage.getPriceList(id);
      
      if (!priceList) {
        return res.status(404).json({ message: "Price list not found" });
      }

      res.json(priceList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price list" });
    }
  });

  app.post("/api/price-lists", async (req, res) => {
    try {
      const validatedData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.createPriceList(validatedData);
      res.status(201).json(priceList);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/price-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPriceListSchema.partial().parse(req.body);
      const priceList = await storage.updatePriceList(id, validatedData);
      
      if (!priceList) {
        return res.status(404).json({ message: "Price list not found" });
      }

      res.json(priceList);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/price-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePriceList(id);
      
      if (!success) {
        return res.status(404).json({ message: "Price list not found" });
      }

      res.json({ message: "Price list deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price list" });
    }
  });

  // Price Rules routes
  app.get("/api/price-rules", async (req, res) => {
    try {
      const priceRules = await storage.getAllPriceRules();
      res.json(priceRules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rules" });
    }
  });

  app.get("/api/price-rules/by-list/:priceListId", async (req, res) => {
    try {
      const priceListId = parseInt(req.params.priceListId);
      const priceRules = await storage.getPriceRulesByPriceList(priceListId);
      res.json(priceRules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rules" });
    }
  });

  app.get("/api/price-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const priceRule = await storage.getPriceRule(id);
      
      if (!priceRule) {
        return res.status(404).json({ message: "Price rule not found" });
      }

      res.json(priceRule);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rule" });
    }
  });

  app.post("/api/price-rules", async (req, res) => {
    try {
      const validatedData = insertPriceRuleSchema.parse(req.body);
      const priceRule = await storage.createPriceRule(validatedData);
      res.status(201).json(priceRule);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/price-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPriceRuleSchema.partial().parse(req.body);
      const priceRule = await storage.updatePriceRule(id, validatedData);
      
      if (!priceRule) {
        return res.status(404).json({ message: "Price rule not found" });
      }

      res.json(priceRule);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/price-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePriceRule(id);
      
      if (!success) {
        return res.status(404).json({ message: "Price rule not found" });
      }

      res.json({ message: "Price rule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price rule" });
    }
  });

  // ===== TAXES ROUTES =====
  app.get("/api/taxes", async (req, res) => {
    try {
      const taxes = await storage.getAllTaxes();
      res.json(taxes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch taxes" });
    }
  });

  app.post("/api/taxes", async (req, res) => {
    try {
      console.log("Tax data received:", req.body);
      const taxData = insertTaxSchema.parse(req.body);
      console.log("Tax data parsed:", taxData);
      const tax = await storage.createTax(taxData);
      res.status(201).json(tax);
    } catch (error) {
      console.error("Tax creation error:", error);
      res.status(400).json({ message: "Invalid tax data", error: error.message });
    }
  });

  app.put("/api/taxes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taxData = req.body;
      const tax = await storage.updateTax(id, taxData);
      if (!tax) {
        return res.status(404).json({ message: "Tax not found" });
      }
      res.json(tax);
    } catch (error) {
      res.status(400).json({ message: "Failed to update tax" });
    }
  });

  app.delete("/api/taxes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTax(id);
      if (!success) {
        return res.status(404).json({ message: "Tax not found" });
      }
      res.json({ message: "Tax deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tax" });
    }
  });

  // ===== CURRENCIES ROUTES =====
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });

  app.post("/api/currencies", async (req, res) => {
    try {
      const currencyData = insertCurrencySchema.parse(req.body);
      const currency = await storage.createCurrency(currencyData);
      res.status(201).json(currency);
    } catch (error) {
      res.status(400).json({ message: "Invalid currency data" });
    }
  });

  app.put("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currencyData = req.body;
      const currency = await storage.updateCurrency(id, currencyData);
      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: "Failed to update currency" });
    }
  });

  app.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCurrency(id);
      if (!success) {
        return res.status(404).json({ message: "Currency not found" });
      }
      res.json({ message: "Currency deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete currency" });
    }
  });

  // ===== DELIVERY METHODS ROUTES =====
  app.get("/api/delivery-methods", async (req, res) => {
    try {
      const methods = await storage.getAllDeliveryMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery methods" });
    }
  });

  app.post("/api/delivery-methods", async (req, res) => {
    try {
      const methodData = insertDeliveryMethodSchema.parse(req.body);
      const method = await storage.createDeliveryMethod(methodData);
      res.status(201).json(method);
    } catch (error) {
      res.status(400).json({ message: "Invalid delivery method data" });
    }
  });

  app.put("/api/delivery-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const methodData = req.body;
      const method = await storage.updateDeliveryMethod(id, methodData);
      if (!method) {
        return res.status(404).json({ message: "Delivery method not found" });
      }
      res.json(method);
    } catch (error) {
      res.status(400).json({ message: "Failed to update delivery method" });
    }
  });

  app.delete("/api/delivery-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeliveryMethod(id);
      if (!success) {
        return res.status(404).json({ message: "Delivery method not found" });
      }
      res.json({ message: "Delivery method deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete delivery method" });
    }
  });

  // ===== ACCOUNTING JOURNALS ROUTES =====
  app.get("/api/accounting-journals", async (req, res) => {
    try {
      const journals = await storage.getAllAccountingJournals();
      res.json(journals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounting journals" });
    }
  });

  app.post("/api/accounting-journals", async (req, res) => {
    try {
      const journalData = insertAccountingJournalSchema.parse(req.body);
      const journal = await storage.createAccountingJournal(journalData);
      res.status(201).json(journal);
    } catch (error) {
      res.status(400).json({ message: "Invalid accounting journal data" });
    }
  });

  app.put("/api/accounting-journals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const journalData = req.body;
      const journal = await storage.updateAccountingJournal(id, journalData);
      if (!journal) {
        return res.status(404).json({ message: "Accounting journal not found" });
      }
      res.json(journal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update accounting journal" });
    }
  });

  app.delete("/api/accounting-journals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccountingJournal(id);
      if (!success) {
        return res.status(404).json({ message: "Accounting journal not found" });
      }
      res.json({ message: "Accounting journal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accounting journal" });
    }
  });

  // ===== ACCOUNTING ACCOUNTS ROUTES =====
  app.get("/api/accounting-accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllAccountingAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounting accounts" });
    }
  });

  app.post("/api/accounting-accounts", async (req, res) => {
    try {
      console.log("Account data received:", req.body);
      const accountData = insertAccountingAccountSchema.parse(req.body);
      console.log("Account data parsed:", accountData);
      const account = await storage.createAccountingAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Account creation error:", error);
      res.status(400).json({ message: "Invalid accounting account data", error: error.message });
    }
  });

  app.put("/api/accounting-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = req.body;
      const account = await storage.updateAccountingAccount(id, accountData);
      if (!account) {
        return res.status(404).json({ message: "Accounting account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to update accounting account" });
    }
  });

  app.delete("/api/accounting-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccountingAccount(id);
      if (!success) {
        return res.status(404).json({ message: "Accounting account not found" });
      }
      res.json({ message: "Accounting account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accounting account" });
    }
  });

  // ===== STORAGE ZONES ROUTES =====
  app.get("/api/storage-zones", async (req, res) => {
    try {
      const zones = await storage.getAllStorageZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage zones" });
    }
  });

  app.post("/api/storage-zones", async (req, res) => {
    try {
      console.log("Storage zone data received:", req.body);
      const zoneData = insertStorageZoneSchema.parse(req.body);
      console.log("Storage zone data parsed:", zoneData);
      const zone = await storage.createStorageZone(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      console.error("Storage zone creation error:", error);
      res.status(400).json({ message: "Invalid storage zone data", error: error.message });
    }
  });

  app.put("/api/storage-zones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const zoneData = req.body;
      const zone = await storage.updateStorageZone(id, zoneData);
      if (!zone) {
        return res.status(404).json({ message: "Storage zone not found" });
      }
      res.json(zone);
    } catch (error) {
      res.status(400).json({ message: "Failed to update storage zone" });
    }
  });

  app.delete("/api/storage-zones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStorageZone(id);
      if (!success) {
        return res.status(404).json({ message: "Storage zone not found" });
      }
      res.json({ message: "Storage zone deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete storage zone" });
    }
  });

  // ===== WORK STATIONS ROUTES =====
  app.get("/api/work-stations", async (req, res) => {
    try {
      const stations = await storage.getAllWorkStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work stations" });
    }
  });

  app.post("/api/work-stations", async (req, res) => {
    try {
      const stationData = insertWorkStationSchema.parse(req.body);
      const station = await storage.createWorkStation(stationData);
      res.status(201).json(station);
    } catch (error) {
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  app.put("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stationData = req.body;
      const station = await storage.updateWorkStation(id, stationData);
      if (!station) {
        return res.status(404).json({ message: "Work station not found" });
      }
      res.json(station);
    } catch (error) {
      res.status(400).json({ message: "Failed to update work station" });
    }
  });

  app.delete("/api/work-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkStation(id);
      if (!success) {
        return res.status(404).json({ message: "Work station not found" });
      }
      res.json({ message: "Work station deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work station" });
    }
  });

  // ===== EMAIL ROUTES =====
  // Test de configuration email
  app.post("/api/email/test", async (req, res) => {
    try {
      const { emailService } = await import('./email/service');
      const result = await emailService.testEmailConfiguration();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors du test de configuration' 
      });
    }
  });

  // Statut de la queue d'emails
  app.get("/api/email/queue/status", async (req, res) => {
    try {
      const { emailService } = await import('./email/service');
      const status = emailService.getQueueStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération du statut' });
    }
  });

  // Envoi d'email de test
  app.post("/api/email/send-test", async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ 
          message: 'Les champs to, subject et message sont requis' 
        });
      }

      const { emailService } = await import('./email/service');
      const success = await emailService.sendEmail({
        to,
        subject,
        html: `<h3>${subject}</h3><p>${message}</p>`,
        text: `${subject}\n\n${message}`
      });

      res.json({ success, message: success ? 'Email envoyé' : 'Échec d\'envoi' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
    }
  });

  // Notification de commande confirmée
  app.post("/api/email/notify/order-confirmed", async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: 'orderId est requis' });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      const customer = await storage.getUser(order.customerId);
      if (!customer || !customer.email) {
        return res.status(404).json({ message: 'Client non trouvé ou email manquant' });
      }

      const { emailService } = await import('./email/service');
      const success = await emailService.sendOrderConfirmation(order, customer);
      res.json({ success, message: success ? 'Notification envoyée' : 'Échec d\'envoi' });
    } catch (error) {
      console.error('Erreur notification commande:', error);
      res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification' });
    }
  });

  // Alerte stock faible
  app.post("/api/email/notify/low-stock", async (req, res) => {
    try {
      const lowStockIngredients = await storage.getLowStockIngredients();
      
      if (lowStockIngredients.length === 0) {
        return res.json({ success: true, message: 'Aucun stock faible détecté' });
      }

      // Récupérer les gérants et admins
      const allUsers = await storage.getAllUsers();
      const recipients = allUsers.filter(user => 
        (user.role === 'gerant' || user.role === 'admin') && user.email
      );

      if (recipients.length === 0) {
        return res.status(404).json({ message: 'Aucun gestionnaire avec email trouvé' });
      }

      const { emailService } = await import('./email/service');
      const success = await emailService.sendLowStockAlert(lowStockIngredients, recipients);
      res.json({ 
        success, 
        message: success ? `Alerte envoyée à ${recipients.length} destinataires` : 'Échec d\'envoi',
        ingredientsCount: lowStockIngredients.length
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'alerte' });
    }
  });

  // Notification système personnalisée
  app.post("/api/email/notify/system", async (req, res) => {
    try {
      const { title, message, type, roles } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: 'title et message sont requis' });
      }

      const allUsers = await storage.getAllUsers();
      let recipients = [];
      
      if (roles && Array.isArray(roles)) {
        recipients = allUsers.filter(user => 
          roles.includes(user.role) && user.email
        );
      } else {
        // Par défaut, envoyer aux admins et gérants
        recipients = allUsers.filter(user => 
          (user.role === 'admin' || user.role === 'gerant') && user.email
        );
      }

      if (recipients.length === 0) {
        return res.status(404).json({ message: 'Aucun destinataire trouvé' });
      }

      const { emailService } = await import('./email/service');
      const success = await emailService.sendSystemNotification(
        { title, message, type: type || 'info' },
        recipients
      );

      res.json({ 
        success, 
        message: success ? `Notification envoyée à ${recipients.length} destinataires` : 'Échec d\'envoi',
        recipientsCount: recipients.length
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification' });
    }
  });

  // ===== SUPPLIERS ROUTES =====
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/active", async (req, res) => {
    try {
      const suppliers = await storage.getActiveSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.parse(req.body);
      console.log("Updating supplier:", id, supplierData);
      const supplier = await storage.updateSupplier(id, supplierData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      console.log("Updated supplier:", supplier);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(400).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSupplier(id);
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
