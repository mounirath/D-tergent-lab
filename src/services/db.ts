import { AccountStatus, Formula, RawMaterial, StockMovement, Supplier, User, UserDatabase } from '../types';
import { generateSalt, hashPassword } from './crypto';
import { SEED_FORMULAS, SEED_RAW_MATERIALS, SEED_SUPPLIERS } from '../data/seedData';

const USERS_STORAGE_KEY = 'formulpro_users';
const OFFICIAL_DATA_KEY = 'formulpro_official_data';
const USER_DATA_PREFIX = 'formulpro_userdata_';
const SESSION_KEY = 'formulpro_active_session_id';

// Initial admin constants (Used ONLY for first-time automated setup)
const DEFAULT_ADMIN_EMAIL = 'mounirath@yahoo.fr';
const DEFAULT_ADMIN_PASS = 'mounirath1977';

export class DatabaseService {
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (this.initialized) return;

    // 1. Initialize Users list if not existing
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let users: User[] = rawUsers ? JSON.parse(rawUsers) : [];

    // Ensure default admin account exists
    const hasAdmin = users.some(u => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase());
    if (!hasAdmin) {
      const salt = generateSalt();
      const passwordHash = await hashPassword(DEFAULT_ADMIN_PASS, salt);

      const adminUser: User = {
        id: 'admin-master-id',
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        salt,
        name: 'Administrateur Principal',
        role: 'admin',
        status: 'actif',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLogin: new Date().toISOString(),
        contactInfo: 'Responsable Laboratoire & Production',
        mustChangePassword: true, // Propose de changer le mot de passe initial
      };

      users.push(adminUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    // 2. Initialize official reference database if not existing
    const rawOfficial = localStorage.getItem(OFFICIAL_DATA_KEY);
    if (!rawOfficial) {
      const officialData: UserDatabase = {
        formulas: SEED_FORMULAS,
        rawMaterials: SEED_RAW_MATERIALS,
        suppliers: SEED_SUPPLIERS,
        stockMovements: [
          {
            id: 'mov-1',
            userId: 'official',
            rawMaterialId: 'mat-1',
            rawMaterialName: 'SLES 70%',
            type: 'entree',
            quantity: 500,
            unit: 'kg',
            previousStock: 0,
            newStock: 500,
            date: '2026-03-01T10:00:00Z',
            notes: 'Réception lot fournisseur ACMP-2026-01',
          },
          {
            id: 'mov-2',
            userId: 'official',
            rawMaterialId: 'mat-5',
            rawMaterialName: 'Soude Caustique NaOH',
            type: 'sortie',
            quantity: 35,
            unit: 'kg',
            previousStock: 50,
            newStock: 15,
            date: '2026-03-08T14:30:00Z',
            notes: 'Production Lot Détergent Vaisselle 1000 kg',
          }
        ],
      };
      localStorage.setItem(OFFICIAL_DATA_KEY, JSON.stringify(officialData));
    }

    this.initialized = true;
  }

  // --- Session Management ---
  public static getActiveUserId(): string | null {
    return localStorage.getItem(SESSION_KEY);
  }

  public static setActiveUserId(userId: string | null): void {
    if (userId) {
      localStorage.setItem(SESSION_KEY, userId);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  // --- User Accounts Management ---
  public static async getUsers(): Promise<User[]> {
    await this.initialize();
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public static async getUserById(userId: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === userId) || null;
  }

  public static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  public static async saveUser(user: User): Promise<void> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  public static async deleteUser(userId: string): Promise<boolean> {
    let users = await this.getUsers();
    // Do not delete last admin
    const target = users.find(u => u.id === userId);
    if (target?.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Impossible de supprimer le dernier compte administrateur.');
      }
    }

    users = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    // Also remove their personal data
    localStorage.removeItem(USER_DATA_PREFIX + userId);
    return true;
  }

  public static async updateUserStatus(userId: string, status: AccountStatus): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.status = status;
      await this.saveUser(user);
    }
  }

  // --- Personal User Data Management (Strict Isolation) ---
  public static async getUserDatabase(userId: string): Promise<UserDatabase> {
    await this.initialize();

    // If official admin base requested
    if (userId === 'official') {
      const raw = localStorage.getItem(OFFICIAL_DATA_KEY);
      return raw ? JSON.parse(raw) : { formulas: [], rawMaterials: [], suppliers: [], stockMovements: [] };
    }

    const key = USER_DATA_PREFIX + userId;
    const raw = localStorage.getItem(key);

    if (raw) {
      return JSON.parse(raw);
    }

    // If new user with no database, clone official starter template with isolated user IDs
    const official = await this.getOfficialDatabase();
    const initialUserDb: UserDatabase = {
      formulas: official.formulas.map(f => ({ ...f, id: `user-form-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, userId, isOfficial: false })),
      rawMaterials: official.rawMaterials.map(m => ({ ...m, id: `user-mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, userId, isOfficial: false })),
      suppliers: official.suppliers.map(s => ({ ...s, id: `user-sup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, userId, isOfficial: false })),
      stockMovements: [],
    };

    localStorage.setItem(key, JSON.stringify(initialUserDb));
    return initialUserDb;
  }

  public static async saveUserDatabase(userId: string, data: UserDatabase): Promise<void> {
    if (userId === 'official') {
      localStorage.setItem(OFFICIAL_DATA_KEY, JSON.stringify(data));
      return;
    }
    const key = USER_DATA_PREFIX + userId;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Official Reference Database ---
  public static async getOfficialDatabase(): Promise<UserDatabase> {
    await this.initialize();
    const raw = localStorage.getItem(OFFICIAL_DATA_KEY);
    return raw ? JSON.parse(raw) : { formulas: [], rawMaterials: [], suppliers: [], stockMovements: [] };
  }

  public static async saveOfficialDatabase(data: UserDatabase): Promise<void> {
    localStorage.setItem(OFFICIAL_DATA_KEY, JSON.stringify(data));
  }

  // --- Specific CRUD operations on active user's personal database ---
  // Formula CRUD
  public static async saveFormula(userId: string, formula: Formula): Promise<void> {
    const db = await this.getUserDatabase(userId);
    const index = db.formulas.findIndex(f => f.id === formula.id);
    if (index >= 0) {
      db.formulas[index] = { ...formula, updatedAt: new Date().toISOString() };
    } else {
      db.formulas.unshift({ ...formula, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await this.saveUserDatabase(userId, db);
  }

  public static async deleteFormula(userId: string, formulaId: string): Promise<void> {
    const db = await this.getUserDatabase(userId);
    db.formulas = db.formulas.filter(f => f.id !== formulaId);
    await this.saveUserDatabase(userId, db);
  }

  // Raw Material CRUD
  public static async saveRawMaterial(userId: string, material: RawMaterial): Promise<void> {
    const db = await this.getUserDatabase(userId);
    const index = db.rawMaterials.findIndex(m => m.id === material.id);
    if (index >= 0) {
      db.rawMaterials[index] = material;
    } else {
      db.rawMaterials.unshift(material);
    }
    await this.saveUserDatabase(userId, db);
  }

  public static async deleteRawMaterial(userId: string, materialId: string): Promise<void> {
    const db = await this.getUserDatabase(userId);
    db.rawMaterials = db.rawMaterials.filter(m => m.id !== materialId);
    await this.saveUserDatabase(userId, db);
  }

  // Supplier CRUD (WITHOUT ANY GPS)
  public static async saveSupplier(userId: string, supplier: Supplier): Promise<void> {
    const db = await this.getUserDatabase(userId);
    const index = db.suppliers.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      db.suppliers[index] = supplier;
    } else {
      db.suppliers.unshift(supplier);
    }
    await this.saveUserDatabase(userId, db);
  }

  public static async deleteSupplier(userId: string, supplierId: string): Promise<void> {
    const db = await this.getUserDatabase(userId);
    db.suppliers = db.suppliers.filter(s => s.id !== supplierId);
    await this.saveUserDatabase(userId, db);
  }

  // Stock Movement & Adjustment
  public static async recordStockMovement(
    userId: string,
    rawMaterialId: string,
    type: 'entree' | 'sortie' | 'ajustement' | 'production',
    quantity: number,
    notes: string,
    batchFormulaName?: string
  ): Promise<void> {
    const db = await this.getUserDatabase(userId);
    const material = db.rawMaterials.find(m => m.id === rawMaterialId);
    if (!material) throw new Error('Matière première introuvable');

    const prev = material.stockQuantity;
    let next = prev;

    if (type === 'entree') {
      next = prev + Math.abs(quantity);
    } else if (type === 'sortie' || type === 'production') {
      next = Math.max(0, prev - Math.abs(quantity));
    } else if (type === 'ajustement') {
      next = Math.max(0, quantity);
    }

    material.stockQuantity = Math.round(next * 1000) / 1000;

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      rawMaterialId,
      rawMaterialName: material.nameFr,
      type,
      quantity: Math.abs(quantity),
      unit: material.stockUnit,
      previousStock: prev,
      newStock: material.stockQuantity,
      date: new Date().toISOString(),
      notes,
      batchFormulaName,
    };

    db.stockMovements.unshift(movement);
    await this.saveUserDatabase(userId, db);
  }
}
