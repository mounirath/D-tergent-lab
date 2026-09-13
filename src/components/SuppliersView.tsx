import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { Language, Supplier } from '../types';
import { getTranslation } from '../services/i18n';

interface Props {
  suppliers: Supplier[];
  lang: Language;
  onSaveSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

export const SuppliersView: React.FC<Props> = ({
  suppliers,
  lang,
  onSaveSupplier,
  onDeleteSupplier,
}) => {
  const t = getTranslation(lang);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<Supplier>>({});

  const wilayas = Array.from(new Set(suppliers.map(s => s.wilaya))).filter(Boolean).sort();

  const filteredSuppliers = suppliers.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.wilaya.toLowerCase().includes(q) ||
      s.availableProducts.toLowerCase().includes(q) ||
      s.availableRawMaterials.some(m => m.toLowerCase().includes(q));

    const matchesWilaya = selectedWilaya === 'all' || s.wilaya === selectedWilaya;
    return matchesSearch && matchesWilaya;
  });

  const handleOpenAdd = () => {
    setEditFormData({
      id: `sup-${Date.now()}`,
      userId: 'active-user',
      name: '',
      wilaya: 'Alger',
      address: '',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      availableProducts: '',
      availableRawMaterials: [],
      verificationStatus: 'a_verifier',
      lastVerificationDate: new Date().toISOString().split('T')[0],
      isOfficial: false,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditFormData({ ...s });
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name) return;
    onSaveSupplier(editFormData as Supplier);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher fournisseur, produit, matière..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedWilaya}
            onChange={e => setSelectedWilaya(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Toutes les wilayas</option>
            {wilayas.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newSupplier}</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => {
          const isVerified = supplier.verificationStatus === 'verifie';

          return (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Wilaya : {supplier.wilaya}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {supplier.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        {t.verifiedStatus}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        {t.toVerifyStatus}
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3">
                  {supplier.address}
                </p>

                {/* Available raw materials / products */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    {t.availableRawMaterials} :
                  </span>
                  <p className="text-slate-800 leading-snug">
                    {supplier.availableProducts}
                  </p>
                </div>
              </div>

              {/* Contact Actions (Call, WhatsApp, Email, Web) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  {supplier.phone && (
                    <a
                      href={`tel:${supplier.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                    >
                      <Phone className="w-3 h-3 text-sky-600" />
                      <span>{supplier.phone}</span>
                    </a>
                  )}

                  {supplier.whatsapp && (
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {supplier.email && (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold transition"
                    >
                      <Mail className="w-3 h-3 text-sky-600" />
                      <span>Email</span>
                    </a>
                  )}

                  {supplier.website && (
                    <a
                      href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                    >
                      <Globe className="w-3 h-3 text-slate-600" />
                      <span>Site web</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>Dernière vérif. : {supplier.lastVerificationDate}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(supplier)}
                      className="text-sky-600 hover:underline font-semibold cursor-pointer"
                    >
                      Modifier
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le fournisseur ${supplier.name} ?`)) {
                          onDeleteSupplier(supplier.id);
                        }
                      }}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">{t.noDataFound}</p>
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">
                {editFormData.name ? 'Modifier le fournisseur' : t.newSupplier}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilaya *</label>
                  <input
                    type="text"
                    required
                    placeholder="Alger, Blida, Sétif, Oran..."
                    value={editFormData.wilaya || ''}
                    onChange={e => setEditFormData({ ...editFormData, wilaya: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse complète</label>
                <input
                  type="text"
                  placeholder="Zone Industrielle, Rue, Ville..."
                  value={editFormData.address || ''}
                  onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+213 ..."
                    value={editFormData.phone || ''}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+213 ..."
                    value={editFormData.whatsapp || ''}
                    onChange={e => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@fournisseur.dz"
                    value={editFormData.email || ''}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Web</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editFormData.website || ''}
                    onChange={e => setEditFormData({ ...editFormData, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Matières premières & Produits fournis</label>
                <textarea
                  rows={2}
                  placeholder="SLES, LABSA, soude caustique, colorants, parfums..."
                  value={editFormData.availableProducts || ''}
                  onChange={e => setEditFormData({ ...editFormData, availableProducts: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut de vérification</label>
                  <select
                    value={editFormData.verificationStatus || 'a_verifier'}
                    onChange={e => setEditFormData({ ...editFormData, verificationStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="verifie">Vérifié</option>
                    <option value="a_verifier">À vérifier</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de vérification</label>
                  <input
                    type="date"
                    value={editFormData.lastVerificationDate || ''}
                    onChange={e => setEditFormData({ ...editFormData, lastVerificationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
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
