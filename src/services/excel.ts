import * as XLSX from 'xlsx';
import { Formula, Language, RawMaterial, StockMovement, Supplier, UserDatabase } from '../types';

export interface ExcelImportPreview {
  fileName: string;
  totalSheetsFound: string[];
  formulas: {
    valid: Formula[];
    duplicates: string[];
    errors: string[];
  };
  rawMaterials: {
    valid: RawMaterial[];
    duplicates: string[];
    errors: string[];
  };
  suppliers: {
    valid: Supplier[];
    duplicates: string[];
    errors: string[];
  };
  stockMovements: {
    valid: StockMovement[];
    duplicates: string[];
    errors: string[];
  };
  hasCriticalErrors: boolean;
}

export class ExcelService {
  /**
   * Export the user's complete database into a 5-sheet .xlsx workbook
   */
  public static exportFullDatabase(db: UserDatabase, userName: string, lang: Language = 'fr'): void {
    const wb = XLSX.utils.book_new();

    // 1. Feuille 1: Formules
    const formulasData = db.formulas.map(f => ({
      'ID Formule': f.id,
      'Nom Français': f.nameFr,
      'Nom Arabe': f.nameAr,
      'Type': f.type === 'maison' ? 'Détergent maison' : 'Produit automobile',
      'Catégorie': f.category,
      'Description': f.descriptionFr,
      'pH Cible': f.targetPH,
      'Température': f.temperature,
      'Temps de mélange': f.mixingTime,
      'Méthode de fabrication': f.manufacturingMethodFr,
      'Ordre d\'incorporation': f.incorporationOrderFr,
      'Contrôle qualité': f.qualityControlFr,
      'Conditionnement': f.packagingFr,
      'Stockage': f.storageFr,
      'Sécurité & EPI': f.safetyFr,
      'Composition détaillée': f.ingredients.map(i => `${i.nameFr} (${i.percentage}%) [${i.functionFr}]`).join(' | '),
    }));
    const wsFormulas = XLSX.utils.json_to_sheet(formulasData);
    XLSX.utils.book_append_sheet(wb, wsFormulas, '1-Formules');

    // 2. Feuille 2: Matières Premières
    const rawMaterialsData = db.rawMaterials.map(m => ({
      'ID Matière': m.id,
      'Nom Français': m.nameFr,
      'Nom Arabe': m.nameAr,
      'Nom Chimique': m.chemicalName,
      'Nom Commercial': m.commercialName,
      'Numéro CAS': m.casNumber,
      'Fonction': m.functionFr,
      'Dosage habituel': m.typicalDosage,
      'Propriétés': m.propertiesFr,
      'Compatibilités': m.compatibilitiesFr,
      'Incompatibilités': m.incompatibilitiesFr,
      'Alternative pénurie': m.shortageAlternativeFr,
      'Différence alternative': m.alternativeDifferenceFr,
      'Stock actuel': m.stockQuantity,
      'Unité': m.stockUnit,
      'Stock minimum': m.minStock,
      'Prix est. / kg (DZD)': m.estimatedPricePerKg,
    }));
    const wsMaterials = XLSX.utils.json_to_sheet(rawMaterialsData);
    XLSX.utils.book_append_sheet(wb, wsMaterials, '2-Matières Premières');

    // 3. Feuille 3: Fournisseurs (STRICTEMENT SANS GPS)
    const suppliersData = db.suppliers.map(s => ({
      'ID Fournisseur': s.id,
      'Nom': s.name,
      'Wilaya': s.wilaya,
      'Adresse complète': s.address,
      'Téléphone': s.phone,
      'WhatsApp': s.whatsapp,
      'Email': s.email,
      'Site Web': s.website,
      'Produits disponibles': s.availableProducts,
      'Matières premières': s.availableRawMaterials.join(', '),
      'Statut vérification': s.verificationStatus === 'verifie' ? 'Vérifié' : 'À vérifier',
      'Dernière vérification': s.lastVerificationDate,
    }));
    const wsSuppliers = XLSX.utils.json_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(wb, wsSuppliers, '3-Fournisseurs');

    // 4. Feuille 4: Stock & Alertes
    const stockData = db.rawMaterials.map(m => ({
      'Matière Première': m.nameFr,
      'Stock Actuel': m.stockQuantity,
      'Unité': m.stockUnit,
      'Stock Minimum': m.minStock,
      'Stock Maximum': m.maxStock,
      'Alerte Stock Faible': m.stockQuantity <= m.minStock ? 'OUI - ALERTE' : 'NORMAL',
      'Valeur estimée en stock (DZD)': m.stockQuantity * m.estimatedPricePerKg,
    }));
    const wsStock = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, wsStock, '4-Stock & Alertes');

    // 5. Feuille 5: Historique des mouvements
    const historyData = db.stockMovements.map(h => ({
      'ID Mouvement': h.id,
      'Date': h.date,
      'Matière': h.rawMaterialName,
      'Type': h.type.toUpperCase(),
      'Quantité': h.quantity,
      'Unité': h.unit,
      'Stock Avant': h.previousStock,
      'Stock Après': h.newStock,
      'Motif / Formule': h.notes || h.batchFormulaName || '-',
    }));
    const wsHistory = XLSX.utils.json_to_sheet(historyData.length > 0 ? historyData : [{ Message: 'Aucun mouvement enregistré' }]);
    XLSX.utils.book_append_sheet(wb, wsHistory, '5-Historique');

    const cleanName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `FormulPro_Base_${cleanName}_${dateStr}.xlsx`);
  }

  /**
   * Export single category as requested in specification
   */
  public static exportSingleCategory(
    categoryType: 'formulas' | 'rawMaterials' | 'suppliers' | 'stock',
    db: UserDatabase,
    lang: Language = 'fr'
  ): void {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split('T')[0];

    if (categoryType === 'formulas') {
      const data = db.formulas.map(f => ({
        'Nom Français': f.nameFr,
        'Nom Arabe': f.nameAr,
        'Type': f.type === 'maison' ? 'Détergent maison' : 'Produit automobile',
        'Catégorie': f.category,
        'pH Cible': f.targetPH,
        'Température': f.temperature,
        'Temps de mélange': f.mixingTime,
        'Méthode': f.manufacturingMethodFr,
        'Ordre incorporation': f.incorporationOrderFr,
        'Ingrédients': f.ingredients.map(i => `${i.nameFr}: ${i.percentage}%`).join('; '),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Mes Formules');
      XLSX.writeFile(wb, `FormulPro_Mes_Formules_${dateStr}.xlsx`);
    } else if (categoryType === 'rawMaterials') {
      const data = db.rawMaterials.map(m => ({
        'Nom Français': m.nameFr,
        'Nom Arabe': m.nameAr,
        'Nom Chimique': m.chemicalName,
        'Nom Commercial': m.commercialName,
        'CAS': m.casNumber,
        'Fonction': m.functionFr,
        'Dosage': m.typicalDosage,
        'Stock': m.stockQuantity,
        'Unité': m.stockUnit,
        'Prix DZD/kg': m.estimatedPricePerKg,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Mes Matières Premières');
      XLSX.writeFile(wb, `FormulPro_Mes_Matieres_${dateStr}.xlsx`);
    } else if (categoryType === 'suppliers') {
      const data = db.suppliers.map(s => ({
        'Nom': s.name,
        'Wilaya': s.wilaya,
        'Adresse': s.address,
        'Téléphone': s.phone,
        'WhatsApp': s.whatsapp,
        'Email': s.email,
        'Site Web': s.website,
        'Statut': s.verificationStatus === 'verifie' ? 'Vérifié' : 'À vérifier',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Mes Fournisseurs');
      XLSX.writeFile(wb, `FormulPro_Mes_Fournisseurs_${dateStr}.xlsx`);
    } else if (categoryType === 'stock') {
      const data = db.rawMaterials.map(m => ({
        'Matière': m.nameFr,
        'Stock Actuel': m.stockQuantity,
        'Unité': m.stockUnit,
        'Stock Minimum': m.minStock,
        'Statut': m.stockQuantity <= m.minStock ? 'STOCK FAIBLE' : 'SUFFISANT',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Mon Stock');
      XLSX.writeFile(wb, `FormulPro_Mon_Stock_${dateStr}.xlsx`);
    }
  }

  /**
   * Export batch calculation report to Excel
   */
  public static exportBatchCalculation(
    formulaName: string,
    batchSizeKg: number,
    items: Array<{
      nameFr: string;
      percentage: number;
      calculatedKg: number;
      calculatedGrams: number;
      unitPriceKg: number;
      totalCost: number;
      availableStock: number;
    }>,
    totalCost: number,
    costPerKg: number
  ): void {
    const wb = XLSX.utils.book_new();
    const rows = items.map(i => ({
      'Composant': i.nameFr,
      'Pourcentage (%)': i.percentage,
      'Quantité (kg)': i.calculatedKg,
      'Quantité (g)': i.calculatedGrams,
      'Prix unitaire (DZD/kg)': i.unitPriceKg,
      'Coût ligne (DZD)': i.totalCost,
      'Stock disponible (kg)': i.availableStock,
      'Disponibilité': i.availableStock >= i.calculatedKg ? 'Suffisant' : 'MANQUE EN STOCK',
    }));

    // Add summary row
    rows.push({
      'Composant': 'TOTAL DU LOT',
      'Pourcentage (%)': 100,
      'Quantité (kg)': batchSizeKg,
      'Quantité (g)': batchSizeKg * 1000,
      'Prix unitaire (DZD/kg)': costPerKg,
      'Coût ligne (DZD)': totalCost,
      'Stock disponible (kg)': 0,
      'Disponibilité': '-',
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Calcul de Production');

    const cleanFormula = formulaName.substring(0, 20).replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `Calcul_Production_${cleanFormula}_${batchSizeKg}kg.xlsx`);
  }

  /**
   * Read and parse an uploaded Excel file for preview and verification
   */
  public static async parseExcelFile(
    file: File,
    userId: string,
    existingDb: UserDatabase
  ): Promise<ExcelImportPreview> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    const result: ExcelImportPreview = {
      fileName: file.name,
      totalSheetsFound: wb.SheetNames,
      formulas: { valid: [], duplicates: [], errors: [] },
      rawMaterials: { valid: [], duplicates: [], errors: [] },
      suppliers: { valid: [], duplicates: [], errors: [] },
      stockMovements: { valid: [], duplicates: [], errors: [] },
      hasCriticalErrors: false,
    };

    // Iterate through sheets
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      const lower = sheetName.toLowerCase();

      if (lower.includes('formule')) {
        for (const row of json) {
          const nameFr = row['Nom Français'] || row['Nom'] || row['Formule'];
          if (!nameFr) {
            result.formulas.errors.push(`Ligne sans nom de formule détectée dans ${sheetName}`);
            continue;
          }
          // Duplicate check
          const isDupe = existingDb.formulas.some(f => f.nameFr.toLowerCase() === String(nameFr).trim().toLowerCase());
          if (isDupe) {
            result.formulas.duplicates.push(nameFr);
          }

          const newFormula: Formula = {
            id: `imp-form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId,
            nameFr: String(nameFr).trim(),
            nameAr: String(row['Nom Arabe'] || nameFr).trim(),
            type: String(row['Type'] || '').toLowerCase().includes('auto') ? 'automobile' : 'maison',
            category: String(row['Catégorie'] || 'artisanale'),
            descriptionFr: String(row['Description'] || 'Formule importée depuis Excel'),
            descriptionAr: String(row['Description Arabe'] || 'تركيبة مستوردة من ملف إكسيل'),
            ingredients: [
              { nameFr: 'Eau déminéralisée', nameAr: 'ماء منزوع الأملاح', percentage: 70, functionFr: 'Solvant porteur', functionAr: 'مذيب', order: 1 },
              { nameFr: 'Matières actives', nameAr: 'مواد فعالة', percentage: 30, functionFr: 'Nettoyant', functionAr: 'تنظيف', order: 2 },
            ],
            manufacturingMethodFr: String(row['Méthode de fabrication'] || row['Méthode'] || 'Mélanger sous agitation modérée.'),
            manufacturingMethodAr: 'خلط المكونات بالتقليب المعتدل.',
            incorporationOrderFr: String(row['Ordre d\'incorporation'] || '1. Eau -> 2. Ingrédients actifs.'),
            incorporationOrderAr: '1. ماء -> 2. مكونات فعالة.',
            temperature: String(row['Température'] || '20°C - 25°C'),
            mixingTime: String(row['Temps de mélange'] || '30 minutes'),
            targetPH: String(row['pH Cible'] || '7.0'),
            qualityControlFr: String(row['Contrôle qualité'] || 'Aspect limpide homogène.'),
            qualityControlAr: 'مظهر متجانس ورائق.',
            packagingFr: String(row['Conditionnement'] || 'Flacons plastiques étanches.'),
            packagingAr: 'عبوات بلاستيكية محكمة الإغلاق.',
            storageFr: String(row['Stockage'] || 'Conserver à l\'abri du gel et de la lumière.'),
            storageAr: 'يحفظ بعيداً عن أشعة الشمس والبرودة.',
            safetyFr: String(row['Sécurité & EPI'] || 'Port de gants et lunettes conseillé.'),
            safetyAr: 'ارتداء قفازات ونظارات حماية.',
            photos: [],
            youtubeVideos: [],
            isOfficial: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          result.formulas.valid.push(newFormula);
        }
      } else if (lower.includes('matière') || lower.includes('matieres') || lower.includes('raw')) {
        for (const row of json) {
          const nameFr = row['Nom Français'] || row['Nom'] || row['Matière'];
          if (!nameFr) {
            result.rawMaterials.errors.push(`Ligne sans nom de matière dans ${sheetName}`);
            continue;
          }
          const isDupe = existingDb.rawMaterials.some(m => m.nameFr.toLowerCase() === String(nameFr).trim().toLowerCase());
          if (isDupe) {
            result.rawMaterials.duplicates.push(nameFr);
          }

          const newMat: RawMaterial = {
            id: `imp-mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId,
            nameFr: String(nameFr).trim(),
            nameAr: String(row['Nom Arabe'] || nameFr).trim(),
            chemicalName: String(row['Nom Chimique'] || nameFr).trim(),
            commercialName: String(row['Nom Commercial'] || nameFr).trim(),
            casNumber: String(row['Numéro CAS'] || row['CAS'] || 'Information à vérifier').trim(),
            functionFr: String(row['Fonction'] || 'Tensioactif ou additif'),
            functionAr: 'خافض توتر أو مادة مضافة',
            descriptionFr: String(row['Description'] || 'Matière première de formulation'),
            descriptionAr: 'مادة أولية لصناعة المنظفات',
            typicalDosage: String(row['Dosage habituel'] || row['Dosage'] || '1% - 10%'),
            propertiesFr: String(row['Propriétés'] || 'Standard'),
            propertiesAr: 'قياسية',
            compatibilitiesFr: String(row['Compatibilités'] || 'Compatible en milieu aqueux'),
            compatibilitiesAr: 'متوافقة في الأوساط المائية',
            incompatibilitiesFr: String(row['Incompatibilités'] || 'Information à vérifier'),
            incompatibilitiesAr: 'معلومة تحتاج للتأكيد',
            shortageAlternativeFr: String(row['Alternative pénurie'] || 'Information à vérifier'),
            shortageAlternativeAr: 'معلومة تحتاج للتأكيد',
            alternativeDifferenceFr: String(row['Différence alternative'] || 'Information à vérifier'),
            alternativeDifferenceAr: 'معلومة تحتاج للتأكيد',
            stockQuantity: Number(row['Stock actuel'] || row['Stock'] || 0),
            stockUnit: String(row['Unité'] || 'kg'),
            minStock: Number(row['Stock minimum'] || 20),
            maxStock: Number(row['Stock maximum'] || 500),
            estimatedPricePerKg: Number(row['Prix est. / kg (DZD)'] || row['Prix'] || 250),
            supplierIds: [],
            isOfficial: false,
          };
          result.rawMaterials.valid.push(newMat);
        }
      } else if (lower.includes('fournisseur') || lower.includes('supplier')) {
        for (const row of json) {
          const name = row['Nom'] || row['Fournisseur'] || row['Entreprise'];
          if (!name) {
            result.suppliers.errors.push(`Ligne sans nom de fournisseur dans ${sheetName}`);
            continue;
          }
          const isDupe = existingDb.suppliers.some(s => s.name.toLowerCase() === String(name).trim().toLowerCase());
          if (isDupe) {
            result.suppliers.duplicates.push(name);
          }

          const newSup: Supplier = {
            id: `imp-sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId,
            name: String(name).trim(),
            wilaya: String(row['Wilaya'] || 'Alger').trim(),
            address: String(row['Adresse complète'] || row['Adresse'] || 'Zone Industrielle').trim(),
            phone: String(row['Téléphone'] || row['Tel'] || 'Information à vérifier').trim(),
            whatsapp: String(row['WhatsApp'] || '').trim(),
            email: String(row['Email'] || '').trim(),
            website: String(row['Site Web'] || '').trim(),
            availableProducts: String(row['Produits disponibles'] || 'Matières premières détergence'),
            availableRawMaterials: [],
            verificationStatus: 'a_verifier',
            lastVerificationDate: new Date().toISOString().split('T')[0],
            isOfficial: false,
          };
          result.suppliers.valid.push(newSup);
        }
      }
    }

    if (
      result.formulas.valid.length === 0 &&
      result.rawMaterials.valid.length === 0 &&
      result.suppliers.valid.length === 0
    ) {
      result.hasCriticalErrors = true;
    }

    return result;
  }
}
