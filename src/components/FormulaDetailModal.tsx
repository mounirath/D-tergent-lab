import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Layers,
  Package,
  Plus,
  ShieldAlert,
  Thermometer,
  Video,
  X,
  Youtube
} from 'lucide-react';
import { Formula, Language, RawMaterial, YouTubeVideo } from '../types';
import { getTranslation } from '../services/i18n';
import { FormulaCalculator } from './FormulaCalculator';

interface Props {
  formula: Formula;
  rawMaterials: RawMaterial[];
  lang: Language;
  onClose: () => void;
  onAddVideo?: (formulaId: string, video: YouTubeVideo) => void;
  onDeductStock?: (formula: Formula, batchKg: number, deductions: Array<{ materialId: string; quantity: number }>) => void;
}

export const FormulaDetailModal: React.FC<Props> = ({
  formula,
  rawMaterials,
  lang,
  onClose,
  onAddVideo,
  onDeductStock,
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'calculator' | 'method' | 'safety' | 'media'>('calculator');
  const [showAddVideoModal, setShowAddVideoModal] = useState<boolean>(false);
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [newVideoTitle, setNewVideoTitle] = useState<string>('');
  const [newVideoDesc, setNewVideoDesc] = useState<string>('');

  // Extract YouTube embed ID helper
  const getEmbedUrl = (url: string): string | null => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}`
        : null;
    } catch {
      return null;
    }
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) return;

    const video: YouTubeVideo = {
      id: `vid-${Date.now()}`,
      url: newVideoUrl.trim(),
      title: newVideoTitle.trim(),
      description: newVideoDesc.trim(),
    };

    if (onAddVideo) {
      onAddVideo(formula.id, video);
    }
    setShowAddVideoModal(false);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
              {formula.category === 'industrielle' ? t.industrialCategory : t.artisanalCategory}
            </span>
            <span className="text-xs text-slate-400">
              {formula.type === 'maison' ? '🧪 ' + t.householdFormulas : '🚗 ' + t.automotiveFormulas}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header & Title */}
        <div className="p-6 pb-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {lang === 'fr' ? formula.nameFr : formula.nameAr}
              </h2>
              <h3 className="text-sm font-semibold text-slate-500 mt-0.5">
                {lang === 'fr' ? formula.nameAr : formula.nameFr}
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
                {lang === 'fr' ? formula.descriptionFr : formula.descriptionAr}
              </p>
            </div>

            {/* Quality badge / Notice */}
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shrink-0 max-w-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>DONNÉES D'EXEMPLE</span>
              </div>
              <p className="text-[11px] leading-tight text-amber-800/90">
                Formule de référence. Des essais de stabilité et contrôle qualité sont indispensables avant production industrielle.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto no-print">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'calculator'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.calculator}</span>
            </button>
            <button
              onClick={() => setActiveTab('method')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'method'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{t.manufacturingMethod}</span>
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'safety'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.safety} & {t.qualityControl}</span>
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'media'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{t.photosAndMedia} ({formula.photos.length + formula.youtubeVideos.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: CALCULATOR */}
          {activeTab === 'calculator' && (
            <FormulaCalculator
              formula={formula}
              rawMaterials={rawMaterials}
              lang={lang}
              onDeductStock={onDeductStock}
            />
          )}

          {/* TAB 2: METHOD & INCORPORATION */}
          {activeTab === 'method' && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">{t.temperature}</span>
                    <span className="font-bold text-slate-900">{formula.temperature}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">{t.mixingTime}</span>
                    <span className="font-bold text-slate-900">{formula.mixingTime}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">{t.targetPH}</span>
                    <span className="font-bold text-slate-900">{formula.targetPH}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-sky-50/50 border border-sky-100">
                <h4 className="font-bold text-sky-900 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-700" />
                  <span>{t.incorporationOrder}</span>
                </h4>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed text-xs">
                  {lang === 'fr' ? formula.incorporationOrderFr : formula.incorporationOrderAr}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-slate-700" />
                  <span>{t.manufacturingMethod}</span>
                </h4>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed text-xs">
                  {lang === 'fr' ? formula.manufacturingMethodFr : formula.manufacturingMethodAr}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY & QC */}
          {activeTab === 'safety' && (
            <div className="space-y-6 text-sm">
              <div className="p-5 rounded-xl bg-rose-50 border border-rose-200">
                <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>{t.safety}</span>
                </h4>
                <p className="text-rose-900/90 whitespace-pre-line leading-relaxed text-xs">
                  {lang === 'fr' ? formula.safetyFr : formula.safetyAr}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t.qualityControl}</span>
                  </h4>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed text-xs">
                    {lang === 'fr' ? formula.qualityControlFr : formula.qualityControlAr}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-700" />
                    <span>{t.packaging} & {t.storage}</span>
                  </h4>
                  <div className="text-slate-700 text-xs space-y-2">
                    <p>
                      <strong>{t.packaging} :</strong> {lang === 'fr' ? formula.packagingFr : formula.packagingAr}
                    </p>
                    <p>
                      <strong>{t.storage} :</strong> {lang === 'fr' ? formula.storageFr : formula.storageAr}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PHOTOS & YOUTUBE VIDEOS */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* YouTube Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <span>{t.youtubeVideos}</span>
                  </h4>
                  <button
                    onClick={() => setShowAddVideoModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addVideo}</span>
                  </button>
                </div>

                {formula.youtubeVideos.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs">
                    <Video className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p>Aucune vidéo YouTube enregistrée pour cette formule.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formula.youtubeVideos.map(vid => {
                      const embed = getEmbedUrl(vid.url);
                      return (
                        <div key={vid.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                          {embed ? (
                            <div className="aspect-video w-full">
                              <iframe
                                src={embed}
                                title={vid.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-100 text-xs text-slate-600">
                              <a href={vid.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                                {vid.url}
                              </a>
                            </div>
                          )}
                          <div className="p-3">
                            <h5 className="font-bold text-xs text-slate-900">{vid.title}</h5>
                            {vid.description && (
                              <p className="text-[11px] text-slate-500 mt-1">{vid.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Photos Section */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-700" />
                  <span>{t.photosAndMedia}</span>
                </h4>
                {formula.photos.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs">
                    <p>Aucune photo illustrative associée.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formula.photos.map((photo, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative">
                        <img
                          src={photo}
                          alt={formula.nameFr}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            ID: <code className="font-mono">{formula.id}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Add Video Mini-Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              <span>{t.addVideo}</span>
            </h3>
            <form onSubmit={handleSaveVideo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.videoTitle}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Démonstration du moussage"
                  value={newVideoTitle}
                  onChange={e => setNewVideoTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.videoUrl}</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.videoDescription}</label>
                <textarea
                  rows={2}
                  placeholder="Courte explication du procédé filmé..."
                  value={newVideoDesc}
                  onChange={e => setNewVideoDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 transition cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
