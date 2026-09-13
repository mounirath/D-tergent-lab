import React, { useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  Layers,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { Formula, Ingredient, Language, RawMaterial } from '../types';
import { getTranslation } from '../services/i18n';

interface Props {
  formula?: Formula | null;
  rawMaterials: RawMaterial[];
  lang: Language;
  onClose: () => void;
  onSave: (formula: Formula) => void;
}

export const FormulaEditModal: React.FC<Props> = ({
  formula,
  rawMaterials,
  lang,
  onClose,
  onSave,
}) => {
  const t = getTranslation(lang);

  const [nameFr, setNameFr] = useState<string>(formula?.nameFr || '');
  const [nameAr, setNameAr] = useState<string>(formula?.nameAr || '');
  const [type, setType] = useState<'maison' | 'automobile'>(formula?.type || 'maison');
  const [category, setCategory] = useState<'industrielle' | 'artisanale'>(formula?.category || 'artisanale');
  const [descriptionFr, setDescriptionFr] = useState<string>(formula?.descriptionFr || '');
  const [descriptionAr, setDescriptionAr] = useState<string>(formula?.descriptionAr || '');
  const [targetPH, setTargetPH] = useState<string>(formula?.targetPH || '7.0 - 7.5');
  const [temperature, setTemperature] = useState<string>(formula?.temperature || '20°C - 25°C');
  const [mixingTime, setMixingTime] = useState<string>(formula?.mixingTime || '30 minutes');
  const [manufacturingMethodFr, setManufacturingMethodFr] = useState<string>(formula?.manufacturingMethodFr || '');
  const [manufacturingMethodAr, setManufacturingMethodAr] = useState<string>(formula?.manufacturingMethodAr || '');
  const [incorporationOrderFr, setIncorporationOrderFr] = useState<string>(formula?.incorporationOrderFr || '');
  const [incorporationOrderAr, setIncorporationOrderAr] = useState<string>(formula?.incorporationOrderAr || '');
  const [qualityControlFr, setQualityControlFr] = useState<string>(formula?.qualityControlFr || '');
  const [qualityControlAr, setQualityControlAr] = useState<string>(formula?.qualityControlAr || '');
  const [packagingFr, setPackagingFr] = useState<string>(formula?.packagingFr || '');
  const [packagingAr, setPackagingAr] = useState<string>(formula?.packagingAr || '');
  const [storageFr, setStorageFr] = useState<string>(formula?.storageFr || '');
  const [storageAr, setStorageAr] = useState<string>(formula?.storageAr || '');
  const [safetyFr, setSafetyFr] = useState<string>(formula?.safetyFr || '');
  const [safetyAr, setSafetyAr] = useState<string>(formula?.safetyAr || '');

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    formula?.ingredients || [
      { nameFr: 'Eau déminéralisée', nameAr: 'ماء منزوع الأملاح', percentage: 70, functionFr: 'Solvant porteur', functionAr: 'مذيب', order: 1 },
      { nameFr: 'SLES 70%', nameAr: 'سلفات لوريث الصوديوم 70%', percentage: 15, functionFr: 'Tensioactif moussant principal', functionAr: 'خافض توتر سطحي رغوي', order: 2 },
      { nameFr: 'LABSA 96%', nameAr: 'حمض السلفونيك 96%', percentage: 5, functionFr: 'Agent dégraissant', functionAr: 'مزيل دهون', order: 3 },
      { nameFr: 'Chlorure de sodium (Sel)', nameAr: 'كلوريد الصوديوم (ملح)', percentage: 2, functionFr: 'Épaississant de viscosité', functionAr: 'مكثف لزوجة', order: 4 },
      { nameFr: 'Conservateur', nameAr: 'مادة حافظة', percentage: 0.2, functionFr: 'Protection microbiologique', functionAr: 'حفظ من البكتيريا', order: 5 },
      { nameFr: 'Parfum', nameAr: 'عطر زيتي', percentage: 0.5, functionFr: 'Odorisation', functionAr: 'تعطير', order: 6 },
    ]
  );

  const totalPercentage = Math.round(ingredients.reduce((sum, i) => sum + i.percentage, 0) * 100) / 100;
  const is100Percent = Math.abs(totalPercentage - 100) < 0.05;

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        nameFr: 'Nouvel Ingrédient',
        nameAr: 'مكون جديد',
        percentage: 1,
        functionFr: 'Actif détergent',
        functionAr: 'مادة فعالة',
        order: ingredients.length + 1,
      },
    ]);
  };

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) {
      alert('Veuillez spécifier le nom de la formule.');
      return;
    }

    const savedFormula: Formula = {
      id: formula?.id || `form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: formula?.userId || 'active-user',
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim() || nameFr.trim(),
      type,
      category,
      descriptionFr: descriptionFr.trim() || 'Formule de détergent haute performance.',
      descriptionAr: descriptionAr.trim() || 'تركيبة منظف عالية الكفاءة.',
      ingredients,
      manufacturingMethodFr: manufacturingMethodFr.trim() || 'Mélanger sous agitation modérée.',
      manufacturingMethodAr: manufacturingMethodAr.trim() || 'خلط المكونات بالتقليب المعتدل.',
      incorporationOrderFr: incorporationOrderFr.trim() || '1. Eau -> 2. Tensioactifs -> 3. Additifs.',
      incorporationOrderAr: incorporationOrderAr.trim() || '1. ماء -> 2. خافضات التوتر -> 3. إضافات.',
      temperature: temperature.trim() || '20°C - 25°C',
      mixingTime: mixingTime.trim() || '30 min',
      targetPH: targetPH.trim() || '7.0',
      qualityControlFr: qualityControlFr.trim() || 'Viscosité et limpidité conformes.',
      qualityControlAr: qualityControlAr.trim() || 'لزوجة ونقاء متوافقان.',
      packagingFr: packagingFr.trim() || 'Bidons PEHD étanches.',
      packagingAr: packagingAr.trim() || 'عبوات بلاستيكية محكمة.',
      storageFr: storageFr.trim() || 'Conserver à l\'abri du soleil direct.',
      storageAr: storageAr.trim() || 'يحفظ بعيداً عن أشعة الشمس.',
      safetyFr: safetyFr.trim() || 'Port de gants et lunettes.',
      safetyAr: safetyAr.trim() || 'قفازات ونظارات وقاية.',
      photos: formula?.photos || [],
      youtubeVideos: formula?.youtubeVideos || [],
      isOfficial: false,
      createdAt: formula?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedFormula);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">
              {formula ? 'Modifier la Formule' : t.newFormula}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* General info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom Français *</label>
              <input
                type="text"
                required
                value={nameFr}
                onChange={e => setNameFr(e.target.value)}
                placeholder="Ex: Liquide Vaisselle Concentré"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom Arabe</label>
              <input
                type="text"
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="Ex: سائل غسيل الأواني مركز"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Type de produit</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="maison">🧪 {t.householdFormulas}</option>
                <option value="automobile">🚗 {t.automotiveFormulas}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="artisanale">Atelier / Artisanale</option>
                <option value="industrielle">Industrielle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description courte</label>
            <textarea
              rows={2}
              value={descriptionFr}
              onChange={e => setDescriptionFr(e.target.value)}
              placeholder="Description des caractéristiques, mousse, pouvoir dégraissant..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Composition & Ingredients Table */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  {t.ingredients} ({ingredients.length})
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-xs ${is100Percent ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Total : {totalPercentage}% {is100Percent ? '✓' : '(Doit faire 100%)'}
                </span>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-2.5 py-1 rounded bg-sky-600 text-white font-bold hover:bg-sky-500 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter Ingrédient</span>
                </button>
              </div>
            </div>

            {!is100Percent && (
              <div className="p-2 rounded bg-amber-100 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Attention : La somme des pourcentages est de {totalPercentage}%. Ajustez pour atteindre 100%.</span>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <span className="font-mono text-slate-400 w-5 text-center">{idx + 1}</span>

                  <input
                    type="text"
                    required
                    placeholder="Nom du composant"
                    value={ing.nameFr}
                    onChange={e => handleUpdateIngredient(idx, 'nameFr', e.target.value)}
                    className="flex-1 px-2.5 py-1 rounded border border-slate-300 font-semibold"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      required
                      placeholder="%"
                      value={ing.percentage}
                      onChange={e => handleUpdateIngredient(idx, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2.5 py-1 rounded border border-slate-300 text-right font-mono font-bold"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Rôle / Fonction"
                    value={ing.functionFr}
                    onChange={e => handleUpdateIngredient(idx, 'functionFr', e.target.value)}
                    className="flex-1 px-2.5 py-1 rounded border border-slate-300"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Technical params */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.targetPH}</label>
              <input
                type="text"
                value={targetPH}
                onChange={e => setTargetPH(e.target.value)}
                placeholder="Ex: 6.5 - 7.5"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.temperature}</label>
              <input
                type="text"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
                placeholder="Ex: 20°C - 25°C"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.mixingTime}</label>
              <input
                type="text"
                value={mixingTime}
                onChange={e => setMixingTime(e.target.value)}
                placeholder="Ex: 35 minutes"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.incorporationOrder}</label>
            <textarea
              rows={2}
              value={incorporationOrderFr}
              onChange={e => setIncorporationOrderFr(e.target.value)}
              placeholder="1. Charger l'eau -> 2. Ajouter SLES -> 3. Dissoudre complètement..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.manufacturingMethod}</label>
            <textarea
              rows={2}
              value={manufacturingMethodFr}
              onChange={e => setManufacturingMethodFr(e.target.value)}
              placeholder="Détails du brassage, vitesse d'agitation pour éviter les bulles..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.qualityControl}</label>
              <input
                type="text"
                value={qualityControlFr}
                onChange={e => setQualityControlFr(e.target.value)}
                placeholder="Aspect limpide, viscosité 1800 cPs"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.safety}</label>
              <input
                type="text"
                value={safetyFr}
                onChange={e => setSafetyFr(e.target.value)}
                placeholder="Gants en nitrile, lunettes de sécurité"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-xs cursor-pointer"
            >
              Enregistrer la formule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
