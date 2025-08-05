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
  insertSupplierSchema, insertClientSchema, insertRecipeSchema, insertRecipeIngredientSchema, 
  insertRecipeOperationSchema, insertOrderSchema, insertOrderItemSchema, 
  insertInventoryOperationSchema, insertInventoryOperationItemSchema, insertDeliverySchema, 
  insertInvoiceSchema, insertInvoiceItemSchema
} from "@shared/schema";
import { z } from "zod";

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

  app.patch("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("PATCH /api/ingredients/:id called with:", { id, body: req.body });
      const updatedIngredient = await storage.updateIngredient(id, req.body);
      if (!updatedIngredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      console.log("Updated ingredient:", updatedIngredient);
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

  // Articles routes (unified for products, ingredients, services)
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      console.log("🔥 CREATE ARTICLE - Request body:", JSON.stringify(req.body, null, 2));
      const articleData = insertArticleSchema.parse(req.body);
      
      // Generate automatic code based on type
      let code = "";
      if (articleData.type === "product") {
        const existingProducts = await storage.getAllArticles();
        const productCount = existingProducts.filter(a => a.type === "product").length;
        code = `PRD-${String(productCount + 1).padStart(6, '0')}`;
      } else if (articleData.type === "ingredient") {
        const existingIngredients = await storage.getAllArticles();
        const ingredientCount = existingIngredients.filter(a => a.type === "ingredient").length;
        code = `ING-${String(ingredientCount + 1).padStart(6, '0')}`;
      } else if (articleData.type === "service") {
        const existingServices = await storage.getAllArticles();
        const serviceCount = existingServices.filter(a => a.type === "service").length;
        code = `SRV-${String(serviceCount + 1).padStart(6, '0')}`;
      }
      
      const articleWithCode = { ...articleData, code };
      const article = await storage.createArticle(articleWithCode);
      console.log("✅ CREATE ARTICLE - Success:", JSON.stringify(article, null, 2));
      res.status(201).json(article);
    } catch (error) {
      console.error("❌ CREATE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("🔥 UPDATE ARTICLE - ID:", id, "Data:", JSON.stringify(req.body, null, 2));
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.updateArticle(id, articleData);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      console.log("✅ UPDATE ARTICLE - Success:", JSON.stringify(article, null, 2));
      res.json(article);
    } catch (error) {
      console.error("❌ UPDATE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("🔥 DELETE ARTICLE - ID:", id);
      const deleted = await storage.deleteArticle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      console.log("✅ DELETE ARTICLE - Success");
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("❌ DELETE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Recipes routes (attached to articles with type="product")
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getAllRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.get("/api/articles/:articleId/recipe", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const recipe = await storage.getRecipeByArticleId(articleId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found for this article" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe by article:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      console.log("🔥 CREATE RECIPE - Request body:", JSON.stringify(req.body, null, 2));
      const newRecipe = await storage.createRecipe(req.body);
      console.log("✅ CREATE RECIPE - Success:", JSON.stringify(newRecipe, null, 2));
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error("❌ CREATE RECIPE - Error:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedRecipe = await storage.updateRecipe(id, req.body);
      if (!updatedRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(updatedRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipe(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Recipe Ingredients routes
  app.get("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const ingredients = await storage.getRecipeIngredients(recipeId);
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching recipe ingredients:", error);
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const ingredientData = { 
        ...req.body, 
        recipeId 
      };
      const ingredient = await storage.createRecipeIngredient(ingredientData);
      res.status(201).json(ingredient);
    } catch (error) {
      console.error("Error creating recipe ingredient:", error);
      res.status(500).json({ message: "Failed to create recipe ingredient" });
    }
  });

  app.put("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const ingredient = await storage.updateRecipeIngredient(id, updateData);
      if (!ingredient) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      console.error("Error updating recipe ingredient:", error);
      res.status(500).json({ message: "Failed to update recipe ingredient" });
    }
  });

  app.delete("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipeIngredient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      res.json({ message: "Recipe ingredient deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe ingredient:", error);
      res.status(500).json({ message: "Failed to delete recipe ingredient" });
    }
  });

  // Recipe Operations routes
  app.get("/api/recipes/:recipeId/operations", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const operations = await storage.getRecipeOperations(recipeId);
      res.json(operations);
    } catch (error) {
      console.error("Error fetching recipe operations:", error);
      res.status(500).json({ message: "Failed to fetch recipe operations" });
    }
  });

  app.post("/api/recipes/:recipeId/operations", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const operationData = { 
        ...req.body, 
        recipeId 
      };
      const operation = await storage.createRecipeOperation(operationData);
      res.status(201).json(operation);
    } catch (error) {
      console.error("Error creating recipe operation:", error);
      res.status(500).json({ message: "Failed to create recipe operation" });
    }
  });

  app.put("/api/recipe-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const operation = await storage.updateRecipeOperation(id, updateData);
      if (!operation) {
        return res.status(404).json({ message: "Recipe operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Error updating recipe operation:", error);
      res.status(500).json({ message: "Failed to update recipe operation" });
    }
  });

  app.delete("/api/recipe-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipeOperation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe operation not found" });
      }
      res.json({ message: "Recipe operation deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe operation:", error);
      res.status(500).json({ message: "Failed to delete recipe operation" });
    }
  });

  // ============ COMMANDES & DEVIS ROUTES ============
  
  // Orders/Quotes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (order) {
        res.json(order);
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, updateData);
      if (order) {
        res.json(order);
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      if (success) {
        res.json({ message: "Order deleted successfully" });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Order Items
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const items = await storage.getOrderItems(orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const itemData = insertOrderItemSchema.parse({
        ...req.body,
        orderId,
      });
      const item = await storage.createOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  // ============ OPERATIONS D'INVENTAIRE ROUTES ============
  
  app.get("/api/inventory-operations", async (req, res) => {
    try {
      const { type } = req.query;
      let operations;
      if (type) {
        operations = await storage.getInventoryOperationsByType(type as string);
      } else {
        operations = await storage.getAllInventoryOperations();
      }
      res.json(operations);
    } catch (error) {
      console.error("Error fetching inventory operations:", error);
      res.status(500).json({ message: "Failed to fetch inventory operations" });
    }
  });

  app.post("/api/inventory-operations", async (req, res) => {
    try {
      const operationData = insertInventoryOperationSchema.parse(req.body);
      const operation = await storage.createInventoryOperation(operationData);
      res.status(201).json(operation);
    } catch (error) {
      console.error("Error creating inventory operation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid operation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create inventory operation" });
      }
    }
  });

  // ============ LIVRAISONS ROUTES ============
  
  app.get("/api/deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getAllDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  // ============ FACTURATION ROUTES ============
  
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}