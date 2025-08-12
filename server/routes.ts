import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertMeasurementCategorySchema,
  insertMeasurementUnitSchema,
  insertArticleCategorySchema,
  insertArticleSchema,
  insertPriceListSchema,
  insertPriceRuleSchema,
  insertTaxSchema,
  insertCurrencySchema,
  insertDeliveryMethodSchema,
  insertAccountingJournalSchema,
  insertAccountingAccountSchema,
  insertStorageZoneSchema,
  insertWorkStationSchema,
  insertSupplierSchema,
  insertClientSchema,
  insertRecipeSchema,
  insertRecipeIngredientSchema,
  insertRecipeOperationSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertInventoryOperationSchema,
  insertInventoryOperationItemSchema,
  updateInventoryOperationWithItemsSchema,
  insertInventorySchema,
  insertDeliverySchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertOrderWithItemsSchema,
  updateOrderWithItemsSchema,
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

      // get user client id if exists
      let clientId = null;
      if (user.role == "client") {
        clientId = await storage.getClientIdByUserId(user.id);
      }
      res.json({ user: userWithoutPassword, clientId: clientId });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const { role } = req.query;
      const users = await storage.getAllUsers();
      let filteredUsers = users;
      
      // Filter by role if specified
      if (role) {
        filteredUsers = users.filter(user => user.role === role);
      }
      
      const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
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

  // Storage Zones routes (replacing Storage Locations)
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

  // Routes ingrédients supprimées - utiliser /api/articles avec filtrage type="ingredient"

  // MODULES SUPPRIMÉS - À RÉIMPLÉMENTER
  // Recipes, Productions, Orders, Deliveries routes supprimées

  // Dashboard - version simplifiée sans les modules supprimés
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Articles avec stock faible (type="ingredient")
      const lowStockArticles = await storage.getAllArticles();
      const lowStockCount = lowStockArticles.filter(
        (article) =>
          article.type === "ingredient" &&
          article.managedInStock &&
          parseFloat(article.currentStock || "0") <
            parseFloat(article.minStock || "0"),
      ).length;

      res.json({
        lowStockCount,
        activeOrdersCount: 0, // À reimplémenter
        todayProductionCount: 0, // À reimplémenter
        dailyRevenue: "0.00", // À reimplémenter
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
      res
        .status(500)
        .json({ message: "Failed to fetch measurement categories" });
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
      const category = await storage.updateMeasurementCategory(
        id,
        categoryData,
      );

      if (!category) {
        return res
          .status(404)
          .json({ message: "Measurement category not found" });
      }

      res.json(category);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Failed to update measurement category" });
    }
  });

  app.delete("/api/measurement-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeasurementCategory(id);

      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Measurement category not found" });
      }

      res.json({ message: "Measurement category deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to delete measurement category" });
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
  app.put("/api/price-lists/:id", async (req, res) => {
    try {
      const priceListData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.updatePriceList(parseInt(req.params.id),priceListData);
      res.status(201).json(priceList);
    } catch (error) {
      res.status(400).json({ message: "Invalid price list data" });
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
  app.get("/api/price-rules/by-list/:priceListId", async (req, res) => {
    try {
      const priceListId = parseInt(req.params.priceListId);
      const priceRules = await storage.getPriceRulesByPriceList(priceListId);
      res.json(priceRules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price rules" });
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
      const deliveryMethod =
        await storage.createDeliveryMethod(deliveryMethodData);
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
      res
        .status(500)
        .json({ message: "Failed to fetch low stock ingredients" });
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
      console.log("PATCH /api/ingredients/:id called with:", {
        id,
        body: req.body,
      });
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
      console.log(
        "🔥 CREATE ARTICLE - Request body:",
        JSON.stringify(req.body, null, 2),
      );
      const articleData = insertArticleSchema.parse(req.body);

      // Generate automatic code based on type
      let code = "";
      if (articleData.type === "product") {
        const existingProducts = await storage.getAllArticles();
        const productCount = existingProducts.filter(
          (a) => a.type === "product",
        ).length;
        code = `PRD-${String(productCount + 1).padStart(6, "0")}`;
      } else if (articleData.type === "ingredient") {
        const existingIngredients = await storage.getAllArticles();
        const ingredientCount = existingIngredients.filter(
          (a) => a.type === "ingredient",
        ).length;
        code = `ING-${String(ingredientCount + 1).padStart(6, "0")}`;
      } else if (articleData.type === "service") {
        const existingServices = await storage.getAllArticles();
        const serviceCount = existingServices.filter(
          (a) => a.type === "service",
        ).length;
        code = `SRV-${String(serviceCount + 1).padStart(6, "0")}`;
      }

      const articleWithCode = { ...articleData, code };
      const article = await storage.createArticle(articleWithCode);
      console.log(
        "✅ CREATE ARTICLE - Success:",
        JSON.stringify(article, null, 2),
      );
      res.status(201).json(article);
    } catch (error) {
      console.error("❌ CREATE ARTICLE - Error:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(
        "🔥 UPDATE ARTICLE - ID:",
        id,
        "Data:",
        JSON.stringify(req.body, null, 2),
      );
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.updateArticle(id, articleData);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      console.log(
        "✅ UPDATE ARTICLE - Success:",
        JSON.stringify(article, null, 2),
      );
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
      const [recipes, stats] = await Promise.all([
        storage.getAllRecipes(),
        storage.getRecipeStats().catch(() => []),
      ]);
      const statsMap = new Map(stats.map((s: any) => [s.recipeId, s]));
      // Charger les ingrédients pour chaque recette
      const enriched = await Promise.all(recipes.map(async (r: any) => {
        const ingredients = await storage.getRecipeIngredients(r.id);
        return {
          ...r,
          ingredients,
          ingredientsCount: statsMap.get(r.id)?.ingredientsCount || 0,
          operationsCount: statsMap.get(r.id)?.operationsCount || 0,
          totalOperationDuration: statsMap.get(r.id)?.totalOperationDuration || 0,
        };
      }));
      res.json(enriched);
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
      const ingredients = await storage.getRecipeIngredients(recipe.id);
      res.json({ ...recipe, ingredients });
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
        return res
          .status(404)
          .json({ message: "Recipe not found for this article" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe by article:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      console.log(
        "🔥 CREATE RECIPE - Request body:",
        JSON.stringify(req.body, null, 2),
      );
      
      // Vérifier si une recette existe déjà pour cet article
      const existingRecipe = await storage.getRecipeByArticleId(req.body.articleId);
      if (existingRecipe) {
        console.log("❌ CREATE RECIPE - Recipe already exists for article:", req.body.articleId);
        return res.status(409).json({ 
          message: "Une recette existe déjà pour ce produit. Vous ne pouvez pas créer plusieurs recettes pour le même produit." 
        });
      }
      
      const newRecipe = await storage.createRecipe(req.body);
      console.log(
        "✅ CREATE RECIPE - Success:",
        JSON.stringify(newRecipe, null, 2),
      );
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
        recipeId,
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
        recipeId,
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

  app.get("/api/orders/confirmed-with-products-to-prepare", async (req, res) => {
    try {
      const orders = await storage.getConfirmedOrdersWithProductsToPrepare();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching confirmed orders with products to prepare:", error);
      res.status(500).json({ message: "Failed to fetch confirmed orders with products to prepare" });
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
        res
          .status(400)
          .json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });
  app.post("/api/ordersWithItems", async (req, res) => {
    try {
      const payload = insertOrderWithItemsSchema.parse(req.body);
      const { order, items } = payload;

      const result = await storage.createOrderWithItems(order, items);

      res.status(201).json(result);
    } catch (error) {
      console.error("Erreur création commande:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Données invalides",
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          message: "Échec de la création de la commande",
        });
      }
    }
  });
  app.put("/api/ordersWithItems/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID de commande invalide" });
      }

      const data = updateOrderWithItemsSchema.parse(req.body);
      const { order, items } = data;

      const updatedOrder = await storage.updateOrderWithItems(orderId, order, items);
      res.json({ message: "Commande mise à jour avec succès", order: updatedOrder });

    } catch (error) {
      console.error("Erreur mise à jour commande:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Données invalides",
          errors: error.errors,
        });
      }

      res.status(500).json({ message: "Échec de la mise à jour de la commande" });
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
      const { type, include_reliquat } = req.query;
      let operations;
      if (type) {
        const includeReliquat = include_reliquat === 'true';
        operations = await storage.getInventoryOperationsByType(type as string, includeReliquat);
      } else {
        operations = await storage.getAllInventoryOperations();
      }
      res.json(operations);
    } catch (error) {
      console.error("Error fetching inventory operations:", error);
      res.status(500).json({ message: "Failed to fetch inventory operations" });
    }
  });

  app.get("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      const operation = await storage.getInventoryOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Inventory operation not found" });
      }

      // Get the items for this operation
      const items = await storage.getInventoryOperationItems(id);
      
      // Return operation with items
      res.json({
        ...operation,
        items: items
      });
    } catch (error) {
      console.error("Error fetching inventory operation:", error);
      res.status(500).json({ message: "Failed to fetch inventory operation" });
    }
  });

  app.post("/api/inventory-operations", async (req, res) => {
    try {
      // Check if the request contains both operation and items
      if (req.body.operation && req.body.items) {
        // Use the new method that handles both operation and items
        const operationData = insertInventoryOperationSchema.parse(req.body.operation);
        const itemsData = req.body.items.map((item: any) => {
          const validatedItem = insertInventoryOperationItemSchema.parse(item);
          return {
            ...validatedItem,
            // Remove operationId if present, it will be set by the storage method
            operationId: undefined
          };
        });
        
        const operation = await storage.createInventoryOperationWithItems(operationData, itemsData);
        res.status(201).json(operation);
      } else {
        // Fallback to the old method for backward compatibility
        const operationData = insertInventoryOperationSchema.parse(req.body);
        const operation = await storage.createInventoryOperation(operationData);
        res.status(201).json(operation);
      }
    } catch (error) {
      console.error("Error creating inventory operation:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid operation data", errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: "Failed to create inventory operation" });
      }
    }
  });
  app.delete("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Supprimer d'abord les items liés
      const items = await storage.getInventoryOperationItems(id);
      for (const item of items) {
        await storage.deleteInventoryOperationItem(item.id);
      }
      const success = await storage.deleteInventoryOperation(id);
      if (!success) {
        return res.status(404).json({ message: "Préparation non trouvée" });
      }
      res.json({ message: "Préparation supprimée avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de la préparation:", error);
      res.status(500).json({ message: "Erreur lors de la suppression de la préparation" });
    }
  });
  app.put("/api/inventory-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }

      // Check if the request contains both operation and items
      if (req.body.operation && req.body.items) {
        // Use the new method that handles both operation and items
        const data = updateInventoryOperationWithItemsSchema.parse(req.body);
        const { operation, items } = data;
        
        const updatedOperation = await storage.updateInventoryOperationWithItems(id, operation, items);
        res.json({ message: "Inventory operation updated successfully", operation: updatedOperation });
      } else {
        // Fallback to updating just the operation header
        const updateData = insertInventoryOperationSchema.partial().parse(req.body);
        const operation = await storage.updateInventoryOperation(id, updateData);
        
        if (operation) {
          res.json(operation);
        } else {
          res.status(404).json({ message: "Inventory operation not found" });
        }
      }
    } catch (error) {
      console.error("Error updating inventory operation:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid operation data", errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: "Failed to update inventory operation" });
      }
    }
  });

  // Inventory Operation Items
  app.get("/api/inventory-operations/:operationId/items", async (req, res) => {
    try {
      const operationId = parseInt(req.params.operationId);
      if (isNaN(operationId)) {
        return res.status(400).json({ message: "Invalid operation ID" });
      }
      
      const items = await storage.getInventoryOperationItems(operationId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory operation items:", error);
      res.status(500).json({ message: "Failed to fetch inventory operation items" });
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

  // ============ ACHATS VIA INVENTORY (PAS DE purchase_*) ============

  // Liste des "bons d'achat" remplacés par opérations d'inventaire type reception + lignes
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      const { supplier_id, status } = req.query;
      // On mappe vers inventory_operations type=reception
      let ops = await storage.getInventoryOperationsByType('reception');
      if (supplier_id) {
        ops = ops.filter(op => op.supplierId === parseInt(supplier_id as string));
      }
      if (status) {
        ops = ops.filter(op => op.status === (status as string));
      }
      res.json(ops);
    } catch (error) {
      console.error("Error fetching receptions:", error);
      res.status(500).json({ message: "Failed to fetch receptions" });
    }
  });

  app.get("/api/purchase-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const op = await storage.getInventoryOperation(id);
      if (!op || op.type !== 'reception') {
        return res.status(404).json({ message: "Reception not found" });
      }
      const items = await storage.getInventoryOperationItems(id);
      res.json({ ...op, items });
    } catch (error) {
      console.error("Error fetching reception:", error);
      res.status(500).json({ message: "Failed to fetch reception" });
    }
  });

  // Création d'une réception: crée inventory_operation (header), inventory_operation_items (lignes)
  // et journal unique inventory par ligne
  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const body = req.body as any;
      // On accepte payload existant de la page, on transforme vers opération
      const op = await storage.createInventoryOperation({
        type: 'reception',
        status: body?.purchaseOrder?.status ?? 'completed',
        supplierId: body?.purchaseOrder?.supplierId,
        storageZoneId: body?.items?.[0]?.storageZoneId ?? null,
        notes: body?.purchaseOrder?.notes ?? null,
        subtotalHT: body?.purchaseOrder?.subtotalHT ?? '0',
        totalTax: body?.purchaseOrder?.totalTax ?? '0',
        totalTTC: body?.purchaseOrder?.totalTTC ?? '0',
        discount: body?.purchaseOrder?.discount ?? '0',
      } as any);

      const items: any[] = [];
      for (const it of body.items ?? []) {
        const line = await storage.createInventoryOperationItem({
          operationId: op.id,
          articleId: it.articleId,
          quantity: it.quantityOrdered,
          quantityBefore: it.currentStock,
          quantityAfter: (parseFloat(it.currentStock || '0') + parseFloat(it.quantityOrdered || '0')).toString(),
          unitCost: it.unitPrice,
          totalCost: it.totalPrice,
          taxRate: it.taxRate,
          taxAmount: it.taxAmount,
          toStorageZoneId: it.storageZoneId ?? null,
          notes: it.notes ?? null,
        } as any);
        items.push(line);
      }

      res.status(201).json({ ...op, items });
    } catch (error) {
      console.error("Error creating reception:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reception" });
      }
    }
  });

  app.patch("/api/purchase-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const op = await storage.updateInventoryOperation(id, updateData);
      if (!op || op.type !== 'reception') {
        return res.status(404).json({ message: "Reception not found" });
      }
      // Si on valide (completed), recalcul/mise à jour des stocks et journal si nécessaire
      if (updateData?.status === 'completed') {
        const lines = await storage.getInventoryOperationItems(id);
        for (const l of lines) {
          const qty = parseFloat(l.quantity as unknown as string || '0');
          await storage.adjustArticleStockAndCost(l.articleId, qty, l.unitCost || '0');
          // Si le journal n'existe pas déjà pour cette ligne, on peut écrire
          // (simple): toujours écrire une ligne supplémentaire de confirmation
          await storage.createInventoryRow({
            code: op.code,
            type: 'reception',
            status: 'completed',
            operationId: op.id,
            operationDate: new Date().toISOString(),
            supplierId: op.supplierId || null,
            operatorId: null,
            articleId: l.articleId,
            fromStorageZoneId: null,
            toStorageZoneId: l.toStorageZoneId || null,
            quantityBefore: l.quantityBefore || '0',
            quantity: l.quantity,
            quantityAfter: l.quantityAfter || '0',
            unitCost: l.unitCost || '0',
            totalCost: l.totalCost || '0',
            taxRate: l.taxRate || '0',
            taxAmount: l.taxAmount || '0',
            notes: `Validation ${op.code}`,
          } as any);
        }
      }
      res.json(op);
    } catch (error) {
      console.error("Error updating reception:", error);
      res.status(500).json({ message: "Failed to update reception" });
    }
  });

  app.delete("/api/purchase-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Supprimer d'abord les lignes
      const lines = await storage.getInventoryOperationItems(id);
      for (const l of lines) {
        await storage.deleteInventoryOperationItem(l.id);
      }
      const success = await storage.deleteInventoryOperation(id);
      if (!success) {
        return res.status(404).json({ message: "Reception not found" });
      }
      res.json({ message: "Reception deleted successfully" });
    } catch (error) {
      console.error("Error deleting reception:", error);
      res.status(500).json({ message: "Failed to delete reception" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
