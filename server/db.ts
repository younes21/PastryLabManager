import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Utilisation temporaire de SQLite en attendant la résolution du problème PostgreSQL
const sqlite = new Database(':memory:');
export const db = drizzle(sqlite, { schema });

// Création des tables SQLite
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'preparateur',
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS storage_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    capacity REAL,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS measurement_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS measurement_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    label TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'reference',
    conversion_factor REAL DEFAULT 1.0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS article_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    managed_in_stock INTEGER DEFAULT 1,
    storage_location_id INTEGER,
    category_id INTEGER,
    unit TEXT,
    allow_sale INTEGER DEFAULT 0,
    sale_category_id INTEGER,
    sale_unit TEXT,
    sale_price REAL,
    tax_id INTEGER,
    cost_per_unit REAL DEFAULT 0,
    current_stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    photo TEXT,
    is_perishable INTEGER DEFAULT 0,
    shelf_life INTEGER,
    storage_conditions TEXT,
    temperature_unit TEXT DEFAULT '°C',
    preparation_time INTEGER,
    difficulty TEXT,
    servings INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS storage_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    storage_location_id INTEGER,
    description TEXT,
    capacity REAL,
    unit TEXT,
    temperature REAL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    rate REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'tva',
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    type TEXT NOT NULL DEFAULT 'particulier',
    raison_sociale TEXT,
    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    wilaya TEXT,
    commune TEXT,
    code_postal TEXT,
    rc TEXT,
    na TEXT,
    mf TEXT,
    nis TEXT,
    tarif_special REAL,
    prix_list_id INTEGER,
    user_id INTEGER,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS price_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'standard',
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delivery_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    cost REAL DEFAULT 0,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS work_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    symbol TEXT NOT NULL,
    exchange_rate REAL DEFAULT 1.0,
    is_default INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insertion des données de test
sqlite.exec(`
  INSERT OR IGNORE INTO users (id, username, email, password, role, first_name, last_name) VALUES 
    (1, 'admin', 'admin@bakery.com', 'admin123', 'admin', 'Administrateur', 'Principal');

  INSERT OR IGNORE INTO storage_locations (id, name, temperature, description, active) VALUES 
    (1, 'Frigo A', 4.0, 'Réfrigérateur principal', 1);

  INSERT OR IGNORE INTO measurement_categories (id, designation, code, description, active) VALUES 
    (1, 'Poids', 'PDS', 'Unités de mesure de poids', 1),
    (2, 'Volume', 'VOL', 'Unités de mesure de volume', 1);

  INSERT OR IGNORE INTO measurement_units (id, category_id, label, abbreviation, type, conversion_factor, active) VALUES 
    (1, 1, 'Gramme', 'g', 'reference', 1.0, 1),
    (2, 1, 'Kilogramme', 'kg', 'larger', 1000.0, 1),
    (3, 2, 'Litre', 'l', 'reference', 1.0, 1),
    (4, 1, 'Pièce', 'pièce', 'reference', 1.0, 1);

  INSERT OR IGNORE INTO article_categories (id, designation, description, active) VALUES 
    (1, 'Pâtisseries', 'Produits de pâtisserie', 1),
    (2, 'Viennoiseries', 'Viennoiseries et pains spéciaux', 1),
    (3, 'Ingrédients', 'Ingrédients de base', 1);

  INSERT OR IGNORE INTO storage_zones (id, designation, code, storage_location_id, description, active) VALUES 
    (1, 'Zone Froide', 'ZON-000001', 1, 'Zone de stockage réfrigérée', 1),
    (2, 'Zone Sèche', 'ZON-000002', null, 'Zone de stockage à température ambiante', 1);

  INSERT OR IGNORE INTO taxes (id, designation, code, rate, type, description, active) VALUES 
    (1, 'TVA Standard', 'TVA-19', 19.0, 'tva', 'TVA à 19% pour produits alimentaires', 1),
    (2, 'TVA Réduite', 'TVA-09', 9.0, 'tva', 'TVA réduite à 9%', 1),
    (3, 'Exonéré', 'EXO-00', 0.0, 'exonere', 'Produits exonérés de TVA', 1);

  INSERT OR IGNORE INTO sale_categories (id, designation, description, active) VALUES 
    (1, 'Vente au détail', 'Vente directe aux particuliers', 1),
    (2, 'Vente en gros', 'Vente aux professionnels et revendeurs', 1),
    (3, 'Commandes spéciales', 'Commandes personnalisées et événements', 1);

  INSERT OR IGNORE INTO articles (id, code, name, type, description, category_id, unit, cost_per_unit, current_stock, min_stock, max_stock, is_perishable, shelf_life, storage_conditions, price, active) VALUES 
    (1, 'ING-000001', 'Farine T55', 'ingredient', 'Farine de blé type 55 pour pâtisserie', 3, 'kg', 1.20, 50.00, 10.00, 100.00, 0, null, null, 0.00, 1),
    (2, 'PRD-000001', 'Tarte au citron', 'product', 'Tarte au citron meringuée', 1, 'pièce', 8.20, 0.00, 0.00, 0.00, 1, 3, 'froid -18°', 18.50, 1),
    (3, 'PRD-000002', 'Croissant', 'product', 'Croissant au beurre artisanal', 2, 'pièce', 0.45, 0.00, 0.00, 0.00, 0, null, null, 1.20, 1),
    (4, 'ING-000002', 'Beurre AOP', 'ingredient', 'Beurre doux AOP Normandie', 3, 'kg', 8.50, 15.00, 5.00, 50.00, 1, 21, 'froid +4°', 0.00, 1),
    (5, 'ING-000003', 'Œufs fermiers', 'ingredient', 'Œufs frais de poules élevées au sol', 3, 'douzaine', 3.80, 20.00, 10.00, 40.00, 1, 28, 'froid +4°', 0.00, 1),
    (6, 'PRD-000003', 'Pain de mie complet', 'product', 'Pain de mie aux céréales complètes', 2, 'pièce', 2.10, 0.00, 5.00, 20.00, 1, 5, 'température ambiante', 4.50, 1),
    (7, 'PRD-000004', 'Éclair au chocolat', 'product', 'Éclair garni de crème pâtissière au chocolat', 1, 'pièce', 1.80, 0.00, 0.00, 0.00, 1, 2, 'froid +4°', 4.20, 1),
    (8, 'ING-000004', 'Chocolat noir 70%', 'ingredient', 'Chocolat de couverture noir 70% cacao', 3, 'kg', 12.30, 8.00, 3.00, 25.00, 0, null, 'sec température ambiante', 0.00, 1),
    (9, 'PRD-000005', 'Millefeuille vanille', 'product', 'Millefeuille traditionnel à la crème vanille', 1, 'pièce', 3.50, 0.00, 0.00, 0.00, 1, 1, 'froid +4°', 7.80, 1),
    (10, 'SRV-000001', 'Décoration gâteau', 'service', 'Service de décoration personnalisée pour gâteaux', 3, 'heure', 0.00, 0.00, 0.00, 0.00, 0, null, null, 45.00, 1);
`);