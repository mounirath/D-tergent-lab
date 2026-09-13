import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Upload,
  X
} from 'lucide-react';
import { Language, UserDatabase } from '../types';
import { getTranslation } from '../services/i18n';
import { ExcelImportPreview, ExcelService } from '../services/excel';

interface Props {
  db: UserDatabase;
  userName: string;
  userId: string;
  lang: Language;
  onImportComplete: (importedDb: UserDatabase, mode: 'add' | 'merge' | 'replace') => void;
}

export const ImportExportCenter: React.FC<Props> = ({
  db,
  userName,
  userId,
  lang,
  onImportComplete,
}) => {
  const t = getTranslation(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importStage, setImportStage] = useState<'idle' | 'parsing' | 'preview' | 'success'>('idle');
  const [previewData, setPreviewData] = useState<ExcelImportPreview | null>(null);
  const [importMode, setImportMode] = useState<'add' | 'merge' | 'replace'>('add');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleExportFullExcel = () => {
    ExcelService.exportFullDatabase(db, userName, lang);
  };

  const handleExportCategory = (cat: 'formulas' | 'rawMaterials' | 'suppliers' | 'stock') => {
    ExcelService.exportSingleCategory(cat, db, lang);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `FormulPro_Sauvegarde_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
  };

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStage('parsing');
    try {
      const preview = await ExcelService.parseExcelFile(file, userId, db);
      setPreviewData(preview);
      setImportStage('preview');
    } catch (err: any) {
      alert('Erreur lors de la lecture du fichier Excel : ' + err.message);
      setImportStage('idle');
    }
  };

  const handleConfirmImport = () => {
    if (!previewData) return;

    const newFormulas = [...(importMode === 'replace' ? [] : db.formulas)];
    const newMaterials = [...(importMode === 'replace' ? [] : db.rawMaterials)];
    const newSuppliers = [...(importMode === 'replace' ? [] : db.suppliers)];

    // Add or merge formulas
    for (const f of previewData.formulas.valid) {
      const idx = newFormulas.findIndex(item => item.nameFr.toLowerCase() === f.nameFr.toLowerCase());
      if (idx >= 0 && (importMode === 'merge' || importMode === 'replace')) {
        newFormulas[idx] = f;
      } else {
        newFormulas.push(f);
      }
    }

    // Add or merge raw materials
    for (const m of previewData.rawMaterials.valid) {
      const idx = newMaterials.findIndex(item => item.nameFr.toLowerCase() === m.nameFr.toLowerCase());
      if (idx >= 0 && (importMode === 'merge' || importMode === 'replace')) {
        newMaterials[idx] = m;
      } else {
        newMaterials.push(m);
      }
    }

    // Add or merge suppliers
    for (const s of previewData.suppliers.valid) {
      const idx = newSuppliers.findIndex(item => item.name.toLowerCase() === s.name.toLowerCase());
      if (idx >= 0 && (importMode === 'merge' || importMode === 'replace')) {
        newSuppliers[idx] = s;
      } else {
        newSuppliers.push(s);
      }
    }

    const updatedDb: UserDatabase = {
      formulas: newFormulas,
      rawMaterials: newMaterials,
      suppliers: newSuppliers,
      stockMovements: db.stockMovements,
    };

    onImportComplete(updatedDb, importMode);
    setImportStage('success');
    setStatusMessage('Importation effectuée avec succès dans votre base personnelle.');
  };

  return (
    <div className="space-y-8">
      {/* 1. EXPORT SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-bold text-slate-900">{t.exportData}</h3>
        </div>
        <p className="text-xs text-slate-600 mb-6">
          Téléchargez vos formules, matières premières, stocks et fournisseurs sous format Excel (.xlsx) normalisé ou sauvegarde JSON intégrale.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Full Workbook */}
          <div className="p-5 rounded-xl border-2 border-sky-200 bg-sky-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-900 font-bold text-sm mb-1">
                <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                <span>Base Complète (5 feuilles)</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Génère un classeur .xlsx contenant : Formules, Matières premières, Fournisseurs, Stock & Mouvements.
              </p>
            </div>
            <button
              onClick={handleExportFullExcel}
              className="w-full py-2 px-3 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportFullDatabaseExcel}</span>
            </button>
          </div>

          {/* Export Specific Category */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <Layers className="w-4 h-4 text-slate-700" />
                <span>{t.exportCategory}</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Exportez une seule catégorie de votre base vers une feuille Excel dédiée :
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-medium mb-3">
                <button
                  onClick={() => handleExportCategory('formulas')}
                  className="p-1.5 rounded bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-700 transition cursor-pointer"
                >
                  {t.myFormulas}
                </button>
                <button
                  onClick={() => handleExportCategory('rawMaterials')}
                  className="p-1.5 rounded bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-700 transition cursor-pointer"
                >
                  {t.myRawMaterials}
                </button>
                <button
                  onClick={() => handleExportCategory('suppliers')}
                  className="p-1.5 rounded bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-700 transition cursor-pointer"
                >
                  {t.mySuppliers}
                </button>
                <button
                  onClick={() => handleExportCategory('stock')}
                  className="p-1.5 rounded bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-700 transition cursor-pointer"
                >
                  {t.myStock}
                </button>
              </div>
            </div>
          </div>

          {/* Full JSON Snapshot */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                <Database className="w-4 h-4 text-slate-700" />
                <span>Sauvegarde JSON Intégrale</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Instantané complet de toutes vos données locales prêt à être importé ou restauré à tout moment.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger Sauvegarde JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. IMPORT WORKFLOW (9 STEPS SPEC) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-bold text-slate-900">{t.importData}</h3>
        </div>
        <p className="text-xs text-slate-600 mb-6">
          Importez vos fichiers Excel (.xlsx). L'application effectue une vérification rigoureuse des colonnes, détecte les doublons et demande confirmation avant modification de votre base.
        </p>

        {importStage === 'idle' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-10 text-center bg-slate-50 hover:bg-sky-50/30 transition cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleSelectFile}
              className="hidden"
            />
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">{t.selectExcelFile}</p>
            <p className="text-xs text-slate-500 mt-1">
              Cliquez ici pour sélectionner votre fichier Excel (.xlsx)
            </p>
          </div>
        )}

        {importStage === 'parsing' && (
          <div className="p-10 text-center">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">{t.parsingFile}</p>
          </div>
        )}

        {/* STEP 3 - 8: PREVIEW, VALIDATION, DUPLICATES & CONFIRMATION */}
        {importStage === 'preview' && previewData && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Fichier sélectionné</span>
                <span className="font-bold text-slate-900 text-sm">{previewData.fileName}</span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Feuilles détectées : {previewData.totalSheetsFound.join(', ')}
                </span>
              </div>
              <button
                onClick={() => setImportStage('idle')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block">Formules trouvées</span>
                <span className="text-2xl font-black text-sky-600">{previewData.formulas.valid.length}</span>
                {previewData.formulas.duplicates.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    {previewData.formulas.duplicates.length} doublon(s) détecté(s)
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block">Matières premières</span>
                <span className="text-2xl font-black text-emerald-600">{previewData.rawMaterials.valid.length}</span>
                {previewData.rawMaterials.duplicates.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    {previewData.rawMaterials.duplicates.length} doublon(s) détecté(s)
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block">Fournisseurs</span>
                <span className="text-2xl font-black text-purple-600">{previewData.suppliers.valid.length}</span>
                {previewData.suppliers.duplicates.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    {previewData.suppliers.duplicates.length} doublon(s) détecté(s)
                  </p>
                )}
              </div>
            </div>

            {/* Duplicates notice if any */}
            {(previewData.formulas.duplicates.length > 0 ||
              previewData.rawMaterials.duplicates.length > 0 ||
              previewData.suppliers.duplicates.length > 0) && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">{t.duplicatesFoundNotice}</h4>
                  <p className="mt-1">
                    Certains éléments portent le même nom que des données déjà existantes dans votre compte. Choisissez le mode d'importation adapté ci-dessous.
                  </p>
                </div>
              </div>
            )}

            {/* Import Mode Selection */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Mode d'intégration :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 ${importMode === 'add' ? 'border-sky-500 bg-white ring-2 ring-sky-100' : 'border-slate-200 bg-white'}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="add"
                    checked={importMode === 'add'}
                    onChange={() => setImportMode('add')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{t.addToExisting}</span>
                    <span className="text-[11px] text-slate-500">Conserve l'existant et ajoute tous les nouveaux éléments.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 ${importMode === 'merge' ? 'border-sky-500 bg-white ring-2 ring-sky-100' : 'border-slate-200 bg-white'}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{t.mergeData}</span>
                    <span className="text-[11px] text-slate-500">Met à jour les doublons existants et ajoute les nouveaux.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 ${importMode === 'replace' ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-100' : 'border-slate-200 bg-white'}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-xs text-rose-900 block">{t.replaceData}</span>
                    <span className="text-[11px] text-rose-700">Remplace l'ensemble des données actuelles par le fichier importé.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setImportStage('idle')}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-6 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>{t.confirmImport}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 9: SUCCESS */}
        {importStage === 'success' && (
          <div className="p-8 text-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h4 className="text-base font-bold">{t.importCompleteSuccess}</h4>
            <p className="text-xs text-emerald-800 mt-1">{statusMessage}</p>
            <button
              onClick={() => setImportStage('idle')}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
