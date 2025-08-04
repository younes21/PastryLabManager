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

  INSERT OR IGNORE INTO articles (id, code, name, type, description, category_id, unit, cost_per_unit, current_stock, min_stock, max_stock, is_perishable, shelf_life, storage_conditions, price, active) VALUES 
    (1, 'ING-000001', 'Farine T55', 'ingredient', 'Farine de blé type 55 pour pâtisserie', 3, 'kg', 1.20, 50.00, 10.00, 100.00, 0, null, null, 0.00, 1),
    (2, 'PRD-000001', 'Tarte au citron', 'product', 'Tarte au citron meringuée', 1, 'pièce', 8.20, 0.00, 0.00, 0.00, 1, 3, 'froid -18°', 18.50, 1),
    (3, 'PRD-000002', 'Croissant', 'product', 'Croissant au beurre artisanal', 2, 'pièce', 0.45, 0.00, 0.00, 0.00, 0, null, null, 1.20, 1);
`);