import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { 
  insertUserSchema, insertStorageLocationSchema,
  insertMeasurementCategorySchema, insertMeasurementUnitSchema, insertArticleCategorySchema, 
  insertArticleSchema, insertPriceListSchema, insertPriceRuleSchema, insertTaxSchema, 
  insertCurrencySchema, insertDeliveryMethodSchema, insertAccountingJournalSchema, 
  insertAccountingAccountSchema, insertStorageZoneSchema, insertWorkStationSchema, 
  insertSupplierSchema, insertClientSchema
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

  // Storage Locations routes
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

  // Routes ingrédients supprimées - utiliser /api/articles avec filtrage type="ingredient"

  // MODULES SUPPRIMÉS - À RÉIMPLÉMENTER
  // Recipes, Productions, Orders, Deliveries routes supprimées

  // Dashboard - version simplifiée sans les modules supprimés
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Articles avec stock faible (type="ingredient")
      const lowStockArticles = await storage.getAllArticles();
      const lowStockCount = lowStockArticles.filter(article => 
        article.type === "ingredient" && 
        article.managedInStock && 
        parseFloat(article.currentStock || "0") < parseFloat(article.minStock || "0")
      ).length;
      
      res.json({
        lowStockCount,
        activeOrdersCount: 0, // À reimplémenter
        todayProductionCount: 0, // À reimplémenter
        dailyRevenue: "0.00" // À reimplémenter
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
      res.status(400).json({ message: "Failed to update measurement category" });
    }
  });

  app.delete("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeasurementCategory(id);
      
      if (!deleted) {
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
      res.status(400).json({ message: "Failed to update measurement unit" });
    }
  });

  app.delete("/api/measurement-units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeasurementUnit(id);
      
      if (!deleted) {
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
      res.status(400).json({ message: "Failed to update article category" });
    }
  });

  app.delete("/api/article-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteArticleCategory(id);
      
      if (!deleted) {
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

  app.post("/api/price-lists", async (req, res) => {
    try {
      const priceListData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.createPriceList(priceListData);
      res.status(201).json(priceList);
    } catch (error) {
      res.status(400).json({ message: "Invalid price list data" });
    }
  });

  // Taxes routes
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
      const taxData = insertTaxSchema.parse(req.body);
      const tax = await storage.createTax(taxData);
      res.status(201).json(tax);
    } catch (error) {
      res.status(400).json({ message: "Invalid tax data" });
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
      const deleted = await storage.deleteTax(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Tax not found" });
      }

      res.json({ message: "Tax deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tax" });
    }
  });

  // Currencies routes
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });

  app.get("/api/currencies/base", async (req, res) => {
    try {
      const baseCurrency = await storage.getBaseCurrency();
      if (!baseCurrency) {
        return res.status(404).json({ message: "No base currency found" });
      }
      res.json(baseCurrency);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch base currency" });
    }
  });

  app.put("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currency = await storage.setBaseCurrency(id);
      
      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }

      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: "Failed to set base currency" });
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
      const deleted = await storage.deleteCurrency(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Currency not found" });
      }

      res.json({ message: "Currency deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete currency" });
    }
  });

  // Delivery Methods routes
  app.get("/api/delivery-methods", async (req, res) => {
    try {
      const deliveryMethods = await storage.getAllDeliveryMethods();
      res.json(deliveryMethods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery methods" });
    }
  });

  app.post("/api/delivery-methods", async (req, res) => {
    try {
      const deliveryMethodData = insertDeliveryMethodSchema.parse(req.body);
      const deliveryMethod = await storage.createDeliveryMethod(deliveryMethodData);
      res.status(201).json(deliveryMethod);
    } catch (error) {
      res.status(400).json({ message: "Invalid delivery method data" });
    }
  });

  // Accounting Journals routes
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

  // Accounting Accounts routes
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
      const accountData = insertAccountingAccountSchema.parse(req.body);
      const account = await storage.createAccountingAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid accounting account data" });
    }
  });

  // Storage Zones routes
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
      const zoneData = insertStorageZoneSchema.parse(req.body);
      const zone = await storage.createStorageZone(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      res.status(400).json({ message: "Invalid storage zone data" });
    }
  });

  // Work Stations routes  
  app.get("/api/work-stations", async (req, res) => {
    try {
      const workStations = await storage.getAllWorkStations();
      res.json(workStations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work stations" });
    }
  });

  app.post("/api/work-stations", async (req, res) => {
    try {
      const workStationData = insertWorkStationSchema.parse(req.body);
      const workStation = await storage.createWorkStation(workStationData);
      res.status(201).json(workStation);
    } catch (error) {
      res.status(400).json({ message: "Invalid work station data" });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
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

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = req.body;
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Ingredients routes (filtrage des articles par type="ingredient")
  app.get("/api/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getAllIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/ingredients/low-stock", async (req, res) => {
    try {
      const ingredients = await storage.getLowStockIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching low stock ingredients:", error);
      res.status(500).json({ message: "Failed to fetch low stock ingredients" });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredient = await storage.getIngredient(id);
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      console.error("Error fetching ingredient:", error);
      res.status(500).json({ message: "Failed to fetch ingredient" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const newIngredient = await storage.createIngredient(req.body);
      res.status(201).json(newIngredient);
    } catch (error) {
      console.error("Error creating ingredient:", error);
      res.status(500).json({ message: "Failed to create ingredient" });
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedIngredient = await storage.updateIngredient(id, req.body);
      if (!updatedIngredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(updatedIngredient);
    } catch (error) {
      console.error("Error updating ingredient:", error);
      res.status(500).json({ message: "Failed to update ingredient" });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteIngredient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json({ message: "Ingredient deleted successfully" });
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const newProduct = await storage.createProduct(req.body);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProduct = await storage.updateProduct(id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}