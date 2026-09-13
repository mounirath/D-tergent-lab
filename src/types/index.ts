export type Language = 'fr' | 'ar';

export type UserRole = 'admin' | 'user';
export type Role = UserRole;

export type AccountStatus = 'actif' | 'desactive';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastLogin: string;
  contactInfo?: string;
  mustChangePassword?: boolean;
}

export type FormulaType = 'maison' | 'automobile';

export type FormulaCategory = 'industrielle' | 'artisanale' | string;

export interface FormulaIngredient {
  rawMaterialId?: string;
  nameFr: string;
  nameAr: string;
  percentage: number; // e.g. 15 for 15%
  functionFr: string;
  functionAr: string;
  order: number;
}

export type Ingredient = FormulaIngredient;

export interface YouTubeVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
}

export interface Formula {
  id: string;
  userId: string;
  nameFr: string;
  nameAr: string;
  type: FormulaType;
  category: FormulaCategory;
  subcategoryFr?: string;
  subcategoryAr?: string;
  descriptionFr: string;
  descriptionAr: string;
  ingredients: FormulaIngredient[];
  manufacturingMethodFr: string;
  manufacturingMethodAr: string;
  incorporationOrderFr: string;
  incorporationOrderAr: string;
  temperature: string;
  mixingTime: string;
  targetPH: string;
  qualityControlFr: string;
  qualityControlAr: string;
  packagingFr: string;
  packagingAr: string;
  storageFr: string;
  storageAr: string;
  safetyFr: string;
  safetyAr: string;
  photos: string[];
  youtubeVideos: YouTubeVideo[];
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawMaterial {
  id: string;
  userId: string;
  nameFr: string;
  nameAr: string;
  chemicalName: string;
  commercialName: string;
  casNumber: string; // CAS or "Information à vérifier"
  functionFr: string;
  functionAr: string;
  descriptionFr: string;
  descriptionAr: string;
  typicalDosage: string;
  propertiesFr: string;
  propertiesAr: string;
  compatibilitiesFr: string;
  compatibilitiesAr: string;
  incompatibilitiesFr: string;
  incompatibilitiesAr: string;
  shortageAlternativeFr: string;
  shortageAlternativeAr: string;
  alternativeDifferenceFr: string;
  alternativeDifferenceAr: string;
  stockQuantity: number;
  stockUnit: string;
  minStock: number;
  maxStock: number;
  estimatedPricePerKg: number;
  supplierIds: string[];
  isOfficial: boolean;
  photoUrl?: string;
}

export interface Supplier {
  id: string;
  userId: string;
  name: string;
  wilaya: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  availableProducts: string;
  availableRawMaterials: string[];
  verificationStatus: 'verifie' | 'a_verifier';
  lastVerificationDate: string;
  isOfficial: boolean;
}

export interface StockMovement {
  id: string;
  userId: string;
  rawMaterialId: string;
  rawMaterialName: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'production';
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  date: string;
  notes: string;
  batchFormulaName?: string;
}

export interface UserDatabase {
  formulas: Formula[];
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
}

export interface CalculationResultItem {
  nameFr: string;
  nameAr: string;
  percentage: number;
  calculatedKg: number;
  calculatedGrams: number;
  functionFr: string;
  functionAr: string;
  order: number;
  unitPriceKg: number;
  totalCost: number;
  availableStock: number;
  isStockSufficient: boolean;
}

export interface CalculationSummary {
  batchSizeKg: number;
  totalPercentage: number;
  isFormulaValid100: boolean;
  totalBatchCost: number;
  costPerKg: number;
  hasStockShortage: boolean;
  items: CalculationResultItem[];
}
