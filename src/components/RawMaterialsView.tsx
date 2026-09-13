import React, { useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  Building2,
  CheckCircle2,
  Edit2,
  Filter,
  Layers,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { Language, RawMaterial, Supplier } from '../types';
import { getTranslation } from '../services/i18n';

interface Props {
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  lang: Language;
  onSaveMaterial: (material: RawMaterial) => void;
  onDeleteMaterial: (materialId: string) => void;
}

export const RawMaterialsView: React.FC<Props> = ({
  rawMaterials,
  suppliers,
  lang,
  onSaveMaterial,
  onDeleteMaterial,
}) => {
  const t = getTranslation(lang);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<RawMaterial>>({});

  const filteredMaterials = rawMaterials.filter(m => {
    const q = searchTerm.toLowerCase().trim();
    return (
      m.nameFr.toLowerCase().includes(q) ||
      m.nameAr.includes(q) ||
      m.chemicalName.toLowerCase().includes(q) ||
      m.casNumber.toLowerCase().includes(q) ||
      m.functionFr.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditFormData({
      id: `mat-${Date.now()}`,
      userId: 'active-user',
      nameFr: '',
      nameAr: '',
      chemicalName: '',
      commercialName: '',
      casNumber: 'Information à vérifier',
      functionFr: '',
      functionAr: '',
      descriptionFr: '',
      descriptionAr: '',
      typicalDosage: '1% - 10%',
      propertiesFr: '',
      propertiesAr: '',
      compatibilitiesFr: '',
      compatibilitiesAr: '',
      incompatibilitiesFr: '',
      incompatibilitiesAr: '',
      shortageAlternativeFr: '',
      shortageAlternativeAr: '',
      alternativeDifferenceFr: '',
      alternativeDifferenceAr: '',
      stockQuantity: 100,
      stockUnit: 'kg',
      minStock: 20,
      maxStock: 500,
      estimatedPricePerKg: 250,
      supplierIds: [],
      isOfficial: false,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (mat: RawMaterial) => {
    setEditFormData({ ...mat });
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.nameFr) return;
    onSaveMaterial(editFormData as RawMaterial);
    setIsEditing(false);
    if (selectedMaterial?.id === editFormData.id) {
      setSelectedMaterial(editFormData as RawMaterial);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search & Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, CAS, fonction chimique..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newRawMaterial}</span>
        </button>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map(mat => {
          const isLowStock = mat.stockQuantity <= mat.minStock;
          return (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition p-5 flex flex-col justify-between cursor-pointer group"
              onClick={() => setSelectedMaterial(mat)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      CAS : {mat.casNumber || 'Non renseigné'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition mt-1.5 line-clamp-1">
                      {lang === 'fr' ? mat.nameFr : mat.nameAr}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 line-clamp-1">
                      {lang === 'fr' ? mat.chemicalName : mat.nameFr}
                    </p>
                  </div>

                  {/* Stock pill */}
                  <div
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                      isLowStock
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {mat.stockQuantity} {mat.stockUnit}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {lang === 'fr' ? mat.functionFr : mat.functionAr}
                </p>

                {mat.shortageAlternativeFr && (
                  <div className="mt-3 p-2 rounded-lg bg-amber-50/70 border border-amber-100 text-[11px] text-amber-800">
                    <span className="font-bold">Alternative :</span>{' '}
                    {lang === 'fr' ? mat.shortageAlternativeFr : mat.shortageAlternativeAr}
                  </div>
                )}
              </div>

              {/* Bottom Card Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {mat.estimatedPricePerKg} DZD / {mat.stockUnit}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenEdit(mat);
                    }}
                    className="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                    title={t.editUser}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm('Supprimer cette matière première de votre base ?')) {
                        onDeleteMaterial(mat.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Beaker className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">{t.noDataFound}</p>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedMaterial && !isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs text-sky-400 font-mono font-bold">CAS: {selectedMaterial.casNumber}</span>
                <h2 className="text-xl font-black mt-0.5">
                  {lang === 'fr' ? selectedMaterial.nameFr : selectedMaterial.nameAr}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.chemicalName}</span>
                  <span className="text-slate-900 font-bold">{selectedMaterial.chemicalName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.commercialName}</span>
                  <span className="text-slate-900 font-bold">{selectedMaterial.commercialName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.typicalDosage}</span>
                  <span className="text-slate-900 font-bold">{selectedMaterial.typicalDosage}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.stockAvailable}</span>
                  <span className={`font-bold ${selectedMaterial.stockQuantity <= selectedMaterial.minStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedMaterial.stockQuantity} {selectedMaterial.stockUnit}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">{t.roleOrFunction}</h4>
                <p className="p-3 rounded-lg bg-sky-50 text-sky-900 leading-relaxed">
                  {lang === 'fr' ? selectedMaterial.functionFr : selectedMaterial.functionAr}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">{t.properties}</h4>
                <p className="p-3 rounded-lg bg-slate-50 text-slate-700 leading-relaxed">
                  {lang === 'fr' ? selectedMaterial.propertiesFr : selectedMaterial.propertiesAr}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                  <h5 className="font-bold mb-1">{t.compatibilities}</h5>
                  <p>{lang === 'fr' ? selectedMaterial.compatibilitiesFr : selectedMaterial.compatibilitiesAr}</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 text-rose-900 border border-rose-100">
                  <h5 className="font-bold mb-1">{t.incompatibilities}</h5>
                  <p>{lang === 'fr' ? selectedMaterial.incompatibilitiesFr : selectedMaterial.incompatibilitiesAr}</p>
                </div>
              </div>

              {/* Alternative in case of shortage */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{t.shortageAlternative}</span>
                </h4>
                <p className="font-semibold text-amber-950">
                  {lang === 'fr' ? selectedMaterial.shortageAlternativeFr : selectedMaterial.shortageAlternativeAr}
                </p>
                <p className="mt-1 text-amber-800 text-[11px]">
                  <strong>Différence :</strong>{' '}
                  {lang === 'fr' ? selectedMaterial.alternativeDifferenceFr : selectedMaterial.alternativeDifferenceAr}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  handleOpenEdit(selectedMaterial);
                  setSelectedMaterial(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                {t.editUser}
              </button>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">
                {editFormData.nameFr ? 'Modifier la matière première' : t.newRawMaterial}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom Français *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nameFr || ''}
                    onChange={e => setEditFormData({ ...editFormData, nameFr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom Arabe</label>
                  <input
                    type="text"
                    value={editFormData.nameAr || ''}
                    onChange={e => setEditFormData({ ...editFormData, nameAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom Chimique (INCI / IUPAC)</label>
                  <input
                    type="text"
                    value={editFormData.chemicalName || ''}
                    onChange={e => setEditFormData({ ...editFormData, chemicalName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro CAS (ou "Information à vérifier")</label>
                  <input
                    type="text"
                    value={editFormData.casNumber || ''}
                    onChange={e => setEditFormData({ ...editFormData, casNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fonction & Rôle</label>
                <input
                  type="text"
                  placeholder="Tensioactif, régulateur de pH, séquestrant..."
                  value={editFormData.functionFr || ''}
                  onChange={e => setEditFormData({ ...editFormData, functionFr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock actuel</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editFormData.stockQuantity || 0}
                    onChange={e => setEditFormData({ ...editFormData, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock minimum (Alerte)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.minStock || 10}
                    onChange={e => setEditFormData({ ...editFormData, minStock: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prix estimé (DZD / unité)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.estimatedPricePerKg || 200}
                    onChange={e => setEditFormData({ ...editFormData, estimatedPricePerKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alternative en cas de pénurie</label>
                <input
                  type="text"
                  placeholder="Ex: SLS ou LABSA neutralisé"
                  value={editFormData.shortageAlternativeFr || ''}
                  onChange={e => setEditFormData({ ...editFormData, shortageAlternativeFr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Différence avec l'alternative</label>
                <input
                  type="text"
                  placeholder="Ex: Moins soluble à froid, mousse plus dense..."
                  value={editFormData.alternativeDifferenceFr || ''}
                  onChange={e => setEditFormData({ ...editFormData, alternativeDifferenceFr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-xs cursor-pointer"
                >
                  {t.saveProfileButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
