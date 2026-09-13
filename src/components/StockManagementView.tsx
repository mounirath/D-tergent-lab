import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  History,
  Package,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import { Language, RawMaterial, StockMovement } from '../types';
import { getTranslation } from '../services/i18n';

interface Props {
  rawMaterials: RawMaterial[];
  stockMovements: StockMovement[];
  lang: Language;
  onRecordMovement: (
    rawMaterialId: string,
    type: 'entree' | 'sortie' | 'ajustement',
    quantity: number,
    notes: string
  ) => void;
}

export const StockManagementView: React.FC<Props> = ({
  rawMaterials,
  stockMovements,
  lang,
  onRecordMovement,
}) => {
  const t = getTranslation(lang);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(rawMaterials[0]?.id || '');
  const [movementType, setMovementType] = useState<'entree' | 'sortie' | 'ajustement'>('entree');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterAlertOnly, setFilterAlertOnly] = useState<boolean>(false);

  const lowStockCount = rawMaterials.filter(m => m.stockQuantity <= m.minStock).length;
  const totalStockValueDZD = rawMaterials.reduce(
    (sum, m) => sum + m.stockQuantity * m.estimatedPricePerKg,
    0
  );

  const filteredMaterials = rawMaterials.filter(m => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery = m.nameFr.toLowerCase().includes(q) || m.nameAr.includes(q);
    const matchesFilter = filterAlertOnly ? m.stockQuantity <= m.minStock : true;
    return matchesQuery && matchesFilter;
  });

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!selectedMaterialId || isNaN(qty) || qty <= 0) return;

    onRecordMovement(selectedMaterialId, movementType, qty, notes);
    setQuantity('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Package className="w-4 h-4 text-sky-600" />
            <span>Matières Référencées</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{rawMaterials.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total des matières premières actives</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{t.lowStockAlerts}</span>
          </div>
          <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {lowStockCount > 0 ? 'Matières en dessous du stock minimum' : 'Aucune rupture de stock'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Valeur Estimée du Stock</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {totalStockValueDZD.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-slate-500">DZD</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Valorisation au prix d'achat moyen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stock Inventory Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher matière..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setFilterAlertOnly(!filterAlertOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  filterAlertOnly
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Alertes ({lowStockCount})</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-2.5 px-3">Matière Première</th>
                    <th className="py-2.5 px-3 text-right">{t.currentStock}</th>
                    <th className="py-2.5 px-3 text-right">{t.minStock}</th>
                    <th className="py-2.5 px-3 text-right">Valeur</th>
                    <th className="py-2.5 px-3 text-center">{t.stockStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(mat => {
                    const isLow = mat.stockQuantity <= mat.minStock;
                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {lang === 'fr' ? mat.nameFr : mat.nameAr}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {mat.commercialName || mat.chemicalName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {mat.stockQuantity} {mat.stockUnit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {mat.minStock} {mat.stockUnit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {(mat.stockQuantity * mat.estimatedPricePerKg).toLocaleString()} DZD
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Rupture imminente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Movement History Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-600" />
              <span>{t.movementHistory}</span>
            </h3>

            {stockMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucun mouvement enregistré.</p>
            ) : (
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Matière</th>
                      <th className="py-2 px-2.5">Type</th>
                      <th className="py-2 px-2.5 text-right">Quantité</th>
                      <th className="py-2 px-2.5">Avant → Après</th>
                      <th className="py-2 px-2.5">Motif / Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {stockMovements.slice(0, 20).map(mov => {
                      const isPositive = mov.type === 'entree';
                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                            {new Date(mov.date).toLocaleDateString()} {new Date(mov.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-slate-900">{mov.rawMaterialName}</td>
                          <td className="py-2 px-2.5">
                            <span
                              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isPositive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isPositive ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {mov.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold">
                            {isPositive ? '+' : '-'}{mov.quantity} {mov.unit}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-slate-500 text-[11px]">
                            {mov.previousStock} → {mov.newStock}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 truncate max-w-xs">
                            {mov.notes || mov.batchFormulaName || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Record Stock Movement Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-600" />
            <span>{t.recordMovement}</span>
          </h3>

          <form onSubmit={handleSubmitMovement} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.rawMaterial}</label>
              <select
                value={selectedMaterialId}
                onChange={e => setSelectedMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {rawMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nameFr} ({m.stockQuantity} {m.stockUnit} disponibles)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.movementType}</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMovementType('entree')}
                  className={`py-2 px-2 rounded-lg font-bold text-center transition cursor-pointer ${
                    movementType === 'entree'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.entry} (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('sortie')}
                  className={`py-2 px-2 rounded-lg font-bold text-center transition cursor-pointer ${
                    movementType === 'sortie'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.exit} (-)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('ajustement')}
                  className={`py-2 px-2 rounded-lg font-bold text-center transition cursor-pointer ${
                    movementType === 'ajustement'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.adjustment}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.quantity} (kg)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ex: 25"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.notes} (optionnel)</label>
              <textarea
                rows={2}
                placeholder="Ex: Réception livraison lot N° 8493"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-xs transition active:scale-95 cursor-pointer"
            >
              Enregistrer le Mouvement
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
