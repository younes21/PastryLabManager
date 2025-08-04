import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertStorageLocationSchema, insertIngredientSchema,
  insertRecipeSchema, insertRecipeIngredientSchema, insertProductionSchema,
  insertOrderSchema, insertOrderItemSchema, insertDeliverySchema,
  insertProductStockSchema, insertLabelSchema, insertMeasurementCategorySchema,
  insertMeasurementUnitSchema, insertArticleCategorySchema, insertArticleSchema, insertPriceListSchema,
  insertPriceRuleSchema
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

  app.post("/api/articles", async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
