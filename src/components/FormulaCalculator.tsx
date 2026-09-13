import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, Download, PackageCheck, Printer, Scale } from 'lucide-react';
import { CalculationSummary, Formula, Language, RawMaterial } from '../types';
import { getTranslation } from '../services/i18n';
import { ExcelService } from '../services/excel';

interface Props {
  formula: Formula;
  rawMaterials: RawMaterial[];
  lang: Language;
  onDeductStock?: (formula: Formula, batchKg: number, deductions: Array<{ materialId: string; quantity: number }>) => void;
}

const PRESET_BATCH_SIZES = [1, 5, 10, 20, 50, 100, 250, 500, 1000];

export const FormulaCalculator: React.FC<Props> = ({ formula, rawMaterials, lang, onDeductStock }) => {
  const t = getTranslation(lang);
  const [selectedPreset, setSelectedPreset] = useState<number>(20);
  const [customKg, setCustomKg] = useState<string>('20');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [deductedSuccess, setDeductedSuccess] = useState<boolean>(false);

  const activeBatchKg = useMemo(() => {
    if (useCustom) {
      const val = parseFloat(customKg);
      return isNaN(val) || val <= 0 ? 1 : val;
    }
    return selectedPreset;
  }, [useCustom, customKg, selectedPreset]);

  // Calculation logic
  const calculation: CalculationSummary = useMemo(() => {
    let totalPct = 0;
    let totalBatchCost = 0;
    let hasStockShortage = false;

    const items = formula.ingredients.map(ing => {
      totalPct += ing.percentage;
      const calculatedKg = (ing.percentage / 100) * activeBatchKg;
      const calculatedGrams = calculatedKg * 1000;

      // Find in user's raw materials inventory
      const matchedMat = rawMaterials.find(
        m => m.nameFr.toLowerCase().trim() === ing.nameFr.toLowerCase().trim() ||
             (ing.rawMaterialId && m.id === ing.rawMaterialId)
      );

      const unitPriceKg = matchedMat ? matchedMat.estimatedPricePerKg : 250;
      const availableStock = matchedMat ? matchedMat.stockQuantity : 0;
      const isStockSufficient = matchedMat ? matchedMat.stockQuantity >= calculatedKg : true;
      if (!isStockSufficient) hasStockShortage = true;

      const lineCost = calculatedKg * unitPriceKg;
      totalBatchCost += lineCost;

      return {
        nameFr: ing.nameFr,
        nameAr: ing.nameAr,
        percentage: ing.percentage,
        calculatedKg: Math.round(calculatedKg * 1000) / 1000,
        calculatedGrams: Math.round(calculatedGrams * 10) / 10,
        functionFr: ing.functionFr,
        functionAr: ing.functionAr,
        order: ing.order,
        unitPriceKg,
        totalCost: Math.round(lineCost * 100) / 100,
        availableStock,
        isStockSufficient,
      };
    });

    const isFormulaValid100 = Math.abs(totalPct - 100) < 0.05;
    const costPerKg = activeBatchKg > 0 ? totalBatchCost / activeBatchKg : 0;

    return {
      batchSizeKg: activeBatchKg,
      totalPercentage: Math.round(totalPct * 100) / 100,
      isFormulaValid100,
      totalBatchCost: Math.round(totalBatchCost * 100) / 100,
      costPerKg: Math.round(costPerKg * 100) / 100,
      hasStockShortage,
      items,
    };
  }, [formula, rawMaterials, activeBatchKg]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    ExcelService.exportBatchCalculation(
      lang === 'fr' ? formula.nameFr : formula.nameAr,
      calculation.batchSizeKg,
      calculation.items,
      calculation.totalBatchCost,
      calculation.costPerKg
    );
  };

  const handleDeduct = () => {
    if (!onDeductStock) return;
    const deductions = calculation.items
      .map(item => {
        const mat = rawMaterials.find(m => m.nameFr.toLowerCase().trim() === item.nameFr.toLowerCase().trim());
        return mat ? { materialId: mat.id, quantity: item.calculatedKg } : null;
      })
      .filter((d): d is { materialId: string; quantity: number } => d !== null);

    onDeductStock(formula, calculation.batchSizeKg, deductions);
    setDeductedSuccess(true);
    setTimeout(() => setDeductedSuccess(false), 4000);
  };

  return (
    <div id={`calculator-${formula.id}`} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-sky-700 font-bold text-sm tracking-wide mb-1">
            <Scale className="w-4 h-4" />
            <span>{t.calculator}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {lang === 'fr' ? formula.nameFr : formula.nameAr}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.targetPH} : <span className="font-semibold text-slate-800">{formula.targetPH}</span> • {t.temperature} : <span className="font-semibold text-slate-800">{formula.temperature}</span>
          </p>
        </div>

        {/* Action buttons (Print / Export Excel) */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            title={t.exportExcelFormula}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportExcelFormula}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            title={t.printFabricationSheet}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printFabricationSheet}</span>
          </button>
        </div>
      </div>

      {/* Selector: Batch Size Presets (1kg - 1000kg) */}
      <div className="my-5 no-print">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          {t.batchSize}
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_BATCH_SIZES.map(kg => (
            <button
              key={kg}
              onClick={() => {
                setSelectedPreset(kg);
                setUseCustom(false);
                setCustomKg(kg.toString());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                !useCustom && selectedPreset === kg
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {kg} kg
            </button>
          ))}

          {/* Custom batch size */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-400">|</span>
            <input
              type="number"
              min="0.1"
              step="0.5"
              placeholder={t.customBatchSize}
              value={customKg}
              onChange={e => {
                setCustomKg(e.target.value);
                setUseCustom(true);
              }}
              className={`w-24 px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none ${
                useCustom
                  ? 'border-sky-500 ring-2 ring-sky-100 bg-white text-slate-900'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            />
            <span className="text-xs font-semibold text-slate-500">kg</span>
          </div>
        </div>
      </div>

      {/* 100% Validation Alert */}
      {!calculation.isFormulaValid100 && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">{t.formulaSumError}</p>
            <p className="mt-0.5">
              {t.formula100Check} : <strong>{calculation.totalPercentage}%</strong>
            </p>
          </div>
        </div>
      )}

      {/* Stock shortage alert */}
      {calculation.hasStockShortage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs no-print">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">{t.insufficientStockNotice}</p>
            <p className="mt-0.5 text-rose-700">
              Certaines matières premières ont un stock inférieur à la quantité requise pour ce lot de {calculation.batchSizeKg} kg.
            </p>
          </div>
        </div>
      )}

      {/* Ingredients & Quantities Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">{t.ingredientName}</th>
              <th className="py-2.5 px-3 text-right">{t.percentage}</th>
              <th className="py-2.5 px-3 text-right">{t.quantity} (kg)</th>
              <th className="py-2.5 px-3 text-right">{t.quantity} (g)</th>
              <th className="py-2.5 px-3">{t.roleOrFunction}</th>
              <th className="py-2.5 px-3 text-right no-print">{t.unitPrice}</th>
              <th className="py-2.5 px-3 text-right no-print">{t.ingredientCost}</th>
              <th className="py-2.5 px-3 text-center no-print">{t.stockStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {calculation.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition">
                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{item.order || idx + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {lang === 'fr' ? item.nameFr : item.nameAr}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-sky-700">
                  {item.percentage}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {item.calculatedKg} kg
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                  {item.calculatedGrams.toLocaleString()} g
                </td>
                <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                  {lang === 'fr' ? item.functionFr : item.functionAr}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600 no-print">
                  {item.unitPriceKg} DZD
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 no-print">
                  {item.totalCost.toLocaleString()} DZD
                </td>
                <td className="py-2.5 px-3 text-center no-print">
                  {item.isStockSufficient ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.sufficient}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md" title={`Disponible: ${item.availableStock} kg`}>
                      <AlertTriangle className="w-3 h-3" />
                      {t.deficit} ({item.availableStock} kg)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
              <td className="py-3 px-3" colSpan={2}>
                TOTAL ({calculation.batchSizeKg} kg)
              </td>
              <td className={`py-3 px-3 text-right font-mono ${calculation.isFormulaValid100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {calculation.totalPercentage}%
              </td>
              <td className="py-3 px-3 text-right font-mono text-sky-800">
                {calculation.batchSizeKg} kg
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-600">
                {(calculation.batchSizeKg * 1000).toLocaleString()} g
              </td>
              <td className="py-3 px-3 text-slate-500">-</td>
              <td className="py-3 px-3 text-right font-mono text-slate-600 no-print">
                {calculation.costPerKg.toLocaleString()} DZD/kg
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm no-print">
                {calculation.totalBatchCost.toLocaleString()} DZD
              </td>
              <td className="py-3 px-3 text-center no-print">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Production Cost & Deduction Summary Card */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-sky-600" />
            <span>{t.totalCost}</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {calculation.totalBatchCost.toLocaleString()} <span className="text-xs font-semibold text-slate-500">DZD</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pour {calculation.batchSizeKg} kg de produit fini</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.costPerKg}</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-700">
            {calculation.costPerKg.toLocaleString()} <span className="text-xs font-semibold text-slate-500">DZD/kg</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Coût unitaire de fabrication estimé</p>
        </div>

        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-800 font-semibold mb-1">
              <PackageCheck className="w-3.5 h-3.5 text-sky-700" />
              <span>{t.stock}</span>
            </div>
            <p className="text-xs text-sky-900">
              {deductedSuccess ? t.batchDeductionSuccess : 'Enregistrer la fabrication et déduire les matières du stock.'}
            </p>
          </div>
          {onDeductStock && (
            <button
              onClick={handleDeduct}
              disabled={deductedSuccess}
              className={`mt-2.5 w-full py-2 px-3 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer ${
                deductedSuccess
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-sky-600 text-white hover:bg-sky-500'
              }`}
            >
              {deductedSuccess ? t.batchDeductionSuccess : t.executeBatchDeduction}
            </button>
          )}
        </div>
      </div>

      {/* Printable Instructions Section */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-xs space-y-3">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          {t.manufacturingMethod} & {t.incorporationOrder}
        </h4>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
          <p className="font-semibold text-slate-900 mb-1">{t.incorporationOrder} :</p>
          <p className="mb-2">{lang === 'fr' ? formula.incorporationOrderFr : formula.incorporationOrderAr}</p>
          <p className="font-semibold text-slate-900 mb-1">{t.manufacturingMethod} :</p>
          <p>{lang === 'fr' ? formula.manufacturingMethodFr : formula.manufacturingMethodAr}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-slate-600 text-[11px]">
          <span>{t.mixingTime} : <strong>{formula.mixingTime}</strong></span>
          <span>{t.temperature} : <strong>{formula.temperature}</strong></span>
          <span>{t.qualityControl} : <strong>{lang === 'fr' ? formula.qualityControlFr : formula.qualityControlAr}</strong></span>
        </div>
      </div>
    </div>
  );
};
