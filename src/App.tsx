import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  Car,
  ChevronDown,
  Database,
  FileSpreadsheet,
  Home,
  Layers,
  LogOut,
  Package,
  Plus,
  Scale,
  Search,
  Shield,
  Truck,
  User as UserIcon,
  X
} from 'lucide-react';
import { Formula, Language, RawMaterial, Supplier, User, UserDatabase, YouTubeVideo } from './types';
import { getTranslation } from './services/i18n';
import { DatabaseService } from './services/db';
import { AuthView } from './components/AuthView';
import { FormulaDetailModal } from './components/FormulaDetailModal';
import { FormulaEditModal } from './components/FormulaEditModal';
import { RawMaterialsView } from './components/RawMaterialsView';
import { SuppliersView } from './components/SuppliersView';
import { StockManagementView } from './components/StockManagementView';
import { ImportExportCenter } from './components/ImportExportCenter';
import { AdminDashboard } from './components/AdminDashboard';
import { MustChangePasswordModal } from './components/MustChangePasswordModal';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const t = getTranslation(lang);

  // Active user session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // User's isolated database
  const [userDb, setUserDb] = useState<UserDatabase>({
    formulas: [],
    rawMaterials: [],
    suppliers: [],
    stockMovements: [],
  });

  // Global admin data (only needed if admin)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [officialDb, setOfficialDb] = useState<UserDatabase>({
    formulas: [],
    rawMaterials: [],
    suppliers: [],
    stockMovements: [],
  });

  // Navigation views
  type ViewType = 'formulas_all' | 'formulas_home' | 'formulas_auto' | 'raw_materials' | 'suppliers' | 'stock' | 'import_export' | 'admin';
  const [activeView, setActiveView] = useState<ViewType>('formulas_all');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'industrielle' | 'artisanale'>('all');

  // Modals
  const [selectedFormulaForDetail, setSelectedFormulaForDetail] = useState<Formula | null>(null);
  const [showFormulaEditModal, setShowFormulaEditModal] = useState<boolean>(false);
  const [formulaToEdit, setFormulaToEdit] = useState<Formula | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Profile edit fields
  const [profileName, setProfileName] = useState<string>('');
  const [profileContact, setProfileContact] = useState<string>('');

  // 1. Initial boot: check session and load database
  useEffect(() => {
    async function boot() {
      try {
        await DatabaseService.initialize();
        const activeId = DatabaseService.getActiveUserId();
        if (activeId) {
          const user = await DatabaseService.getUserById(activeId);
          if (user && user.status === 'actif') {
            setCurrentUser(user);
            const db = await DatabaseService.getUserDatabase(user.id);
            setUserDb(db);

            if (user.role === 'admin') {
              const usersList = await DatabaseService.getUsers();
              setAllUsers(usersList);
              const offDb = await DatabaseService.getOfficialDatabase();
              setOfficialDb(offDb);
            }
          } else {
            DatabaseService.setActiveUserId(null);
          }
        }
      } catch (err) {
        console.error('Boot error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    boot();
  }, []);

  // Update HTML title & RTL when language changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'fr'
      ? 'FormulPro Détergents — Formulation & Gestion de Production'
      : 'فورمول برو للمنظفات — تركيب وإدارة إنتاج مواد التنظيف';
  }, [lang]);

  // Load user data on login
  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setProfileName(user.name);
    setProfileContact(user.contactInfo || '');
    const db = await DatabaseService.getUserDatabase(user.id);
    setUserDb(db);

    if (user.role === 'admin') {
      const usersList = await DatabaseService.getUsers();
      setAllUsers(usersList);
      const offDb = await DatabaseService.getOfficialDatabase();
      setOfficialDb(offDb);
    }
  };

  const handleLogout = () => {
    DatabaseService.setActiveUserId(null);
    setCurrentUser(null);
    setUserDb({ formulas: [], rawMaterials: [], suppliers: [], stockMovements: [] });
  };

  // --- CRUD Handlers for Current User's isolated data ---
  const handleSaveFormula = async (formula: Formula) => {
    if (!currentUser) return;
    await DatabaseService.saveFormula(currentUser.id, formula);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
    if (selectedFormulaForDetail?.id === formula.id) {
      setSelectedFormulaForDetail(formula);
    }
  };

  const handleDeleteFormula = async (formulaId: string) => {
    if (!currentUser) return;
    await DatabaseService.deleteFormula(currentUser.id, formulaId);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
    if (selectedFormulaForDetail?.id === formulaId) {
      setSelectedFormulaForDetail(null);
    }
  };

  const handleAddVideo = async (formulaId: string, video: YouTubeVideo) => {
    if (!currentUser) return;
    const formula = userDb.formulas.find(f => f.id === formulaId);
    if (!formula) return;

    const updated: Formula = {
      ...formula,
      youtubeVideos: [...formula.youtubeVideos, video],
    };
    await handleSaveFormula(updated);
  };

  const handleDeductStock = async (
    formula: Formula,
    batchKg: number,
    deductions: Array<{ materialId: string; quantity: number }>
  ) => {
    if (!currentUser) return;
    for (const d of deductions) {
      await DatabaseService.recordStockMovement(
        currentUser.id,
        d.materialId,
        'production',
        d.quantity,
        `Production lot de ${batchKg} kg : ${formula.nameFr}`,
        formula.nameFr
      );
    }
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
  };

  const handleSaveMaterial = async (material: RawMaterial) => {
    if (!currentUser) return;
    await DatabaseService.saveRawMaterial(currentUser.id, material);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!currentUser) return;
    await DatabaseService.deleteRawMaterial(currentUser.id, materialId);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
  };

  const handleSaveSupplier = async (supplier: Supplier) => {
    if (!currentUser) return;
    await DatabaseService.saveSupplier(currentUser.id, supplier);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!currentUser) return;
    await DatabaseService.deleteSupplier(currentUser.id, supplierId);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
  };

  const handleRecordStockMovement = async (
    rawMaterialId: string,
    type: 'entree' | 'sortie' | 'ajustement',
    quantity: number,
    notes: string
  ) => {
    if (!currentUser) return;
    await DatabaseService.recordStockMovement(currentUser.id, rawMaterialId, type, quantity, notes);
    const refreshed = await DatabaseService.getUserDatabase(currentUser.id);
    setUserDb(refreshed);
  };

  const handleImportComplete = async (importedDb: UserDatabase) => {
    if (!currentUser) return;
    await DatabaseService.saveUserDatabase(currentUser.id, importedDb);
    setUserDb(importedDb);
  };

  // --- Admin Handlers ---
  const handleAdminSaveUser = async (user: User) => {
    await DatabaseService.saveUser(user);
    const refreshedUsers = await DatabaseService.getUsers();
    setAllUsers(refreshedUsers);
  };

  const handleAdminDeleteUser = async (userId: string) => {
    await DatabaseService.deleteUser(userId);
    const refreshedUsers = await DatabaseService.getUsers();
    setAllUsers(refreshedUsers);
  };

  const handleUpdateAdminProfile = async (updatedAdmin: User) => {
    await DatabaseService.saveUser(updatedAdmin);
    setCurrentUser(updatedAdmin);
    const refreshedUsers = await DatabaseService.getUsers();
    setAllUsers(refreshedUsers);
  };

  const handleUpdateOfficialDb = async (newOfficialDb: UserDatabase) => {
    await DatabaseService.saveOfficialDatabase(newOfficialDb);
    setOfficialDb(newOfficialDb);
  };

  const handleSavePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      name: profileName.trim(),
      contactInfo: profileContact.trim(),
    };
    await DatabaseService.saveUser(updated);
    setCurrentUser(updated);
    setShowProfileModal(false);
  };

  // Filtered Formulas
  const filteredFormulas = userDb.formulas.filter(f => {
    // Type view filter
    if (activeView === 'formulas_home' && f.type !== 'maison') return false;
    if (activeView === 'formulas_auto' && f.type !== 'automobile') return false;

    // Category filter
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;

    // Search query
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      f.nameFr.toLowerCase().includes(q) ||
      f.nameAr.includes(q) ||
      f.descriptionFr.toLowerCase().includes(q) ||
      f.ingredients.some(i => i.nameFr.toLowerCase().includes(q) || i.functionFr.toLowerCase().includes(q))
    );
  });

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 animate-pulse mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Chargement de FormulPro...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the Auth view
  if (!currentUser) {
    return (
      <AuthView
        lang={lang}
        onLanguageChange={setLang}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const lowStockCount = userDb.rawMaterials.filter(m => m.stockQuantity <= m.minStock).length;

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col font-sans ${lang === 'ar' ? 'font-arabic' : ''}`}>
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
                <Beaker className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  {t.appName}
                </h1>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                  {t.appSubtitle}
                </span>
              </div>
            </div>

            {/* Middle Quick Actions */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveView('formulas_all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'formulas_all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.allFormulas} ({userDb.formulas.length})</span>
              </button>

              <button
                onClick={() => setActiveView('formulas_home')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'formulas_home' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.householdFormulas}</span>
              </button>

              <button
                onClick={() => setActiveView('formulas_auto')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'formulas_auto' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{t.automotiveFormulas}</span>
              </button>

              <button
                onClick={() => setActiveView('raw_materials')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'raw_materials' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Beaker className="w-3.5 h-3.5" />
                <span>{t.rawMaterials}</span>
              </button>

              <button
                onClick={() => setActiveView('suppliers')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'suppliers' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t.suppliers}</span>
              </button>

              <button
                onClick={() => setActiveView('stock')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'stock' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{t.stock}</span>
                {lowStockCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveView('import_export')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'import_export' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t.importExport}</span>
              </button>
            </div>

            {/* Right Controls: PWA, Lang, Profile, Admin */}
            <div className="flex items-center gap-2">
              <PWAInstallButton lang={lang} />

              {/* Language Switch */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setLang('fr')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    lang === 'fr' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => setLang('ar')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    lang === 'ar' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  عربي
                </button>
              </div>

              {/* Admin Button if user is admin */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveView('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeView === 'admin'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.adminDashboard}</span>
                </button>
              )}

              {/* User Avatar & Menu */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer"
                title="Modifier mon profil"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    {currentUser.role === 'admin' ? t.roleAdmin : t.roleUser}
                  </span>
                </div>
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="lg:hidden border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs font-bold bg-slate-50">
          <button
            onClick={() => setActiveView('formulas_all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'formulas_all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.allFormulas}
          </button>
          <button
            onClick={() => setActiveView('formulas_home')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'formulas_home' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.householdFormulas}
          </button>
          <button
            onClick={() => setActiveView('formulas_auto')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'formulas_auto' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.automotiveFormulas}
          </button>
          <button
            onClick={() => setActiveView('raw_materials')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'raw_materials' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.rawMaterials}
          </button>
          <button
            onClick={() => setActiveView('suppliers')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'suppliers' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.suppliers}
          </button>
          <button
            onClick={() => setActiveView('stock')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'stock' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.stock} {lowStockCount > 0 ? `(${lowStockCount})` : ''}
          </button>
          <button
            onClick={() => setActiveView('import_export')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeView === 'import_export' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            {t.importExport}
          </button>
        </div>
      </header>

      {/* 2. DEMO DATA COMPLIANCE BANNER */}
      <div className="bg-amber-500/10 border-b border-amber-200/80 px-4 py-2 text-center text-xs text-amber-900 font-medium no-print">
        <span className="font-bold">⚠️ {t.sampleDataNoticeTitle} :</span> {t.sampleDataNoticeSubtitle}
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* VIEW 1: FORMULAS LIST (ALL / HOUSEHOLD / AUTOMOTIVE) */}
        {(activeView === 'formulas_all' || activeView === 'formulas_home' || activeView === 'formulas_auto') && (
          <div className="space-y-6">
            {/* Top Toolbar: Search, Filters, New Formula Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher une formule par nom, actif, description..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Filter category */}
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Toutes catégories</option>
                  <option value="artisanale">Atelier / Artisanale</option>
                  <option value="industrielle">Industrielle</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setFormulaToEdit(null);
                  setShowFormulaEditModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t.newFormula}</span>
              </button>
            </div>

            {/* Formulas Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFormulas.map(formula => {
                const isAuto = formula.type === 'automobile';
                const isIndustrial = formula.category === 'industrielle';

                return (
                  <div
                    key={formula.id}
                    onClick={() => setSelectedFormulaForDetail(formula)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 transition p-5 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Tags */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAuto ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {isAuto ? '🚗 Auto' : '🧪 Maison'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isIndustrial ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isIndustrial ? t.industrialCategory : t.artisanalCategory}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition line-clamp-1">
                        {lang === 'fr' ? formula.nameFr : formula.nameAr}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">
                        {lang === 'fr' ? formula.nameAr : formula.nameFr}
                      </p>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {lang === 'fr' ? formula.descriptionFr : formula.descriptionAr}
                      </p>

                      {/* Mini parameters bar */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.targetPH}</span>
                          <span className="font-bold text-slate-800">{formula.targetPH}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.temperature}</span>
                          <span className="font-bold text-slate-800">{formula.temperature}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card bottom bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">
                        {formula.ingredients.length} {t.ingredients.toLowerCase()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setFormulaToEdit(formula);
                            setShowFormulaEditModal(true);
                          }}
                          className="px-2 py-1 text-slate-500 hover:text-sky-600 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm(`Supprimer la formule ${formula.nameFr} ?`)) {
                              handleDeleteFormula(formula.id);
                            }
                          }}
                          className="px-2 py-1 text-slate-500 hover:text-rose-600 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFormulas.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
                <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">{t.noDataFound}</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: RAW MATERIALS */}
        {activeView === 'raw_materials' && (
          <RawMaterialsView
            rawMaterials={userDb.rawMaterials}
            suppliers={userDb.suppliers}
            lang={lang}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {/* VIEW 3: SUPPLIERS (NO GPS) */}
        {activeView === 'suppliers' && (
          <SuppliersView
            suppliers={userDb.suppliers}
            lang={lang}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {/* VIEW 4: STOCK & INVENTORY */}
        {activeView === 'stock' && (
          <StockManagementView
            rawMaterials={userDb.rawMaterials}
            stockMovements={userDb.stockMovements}
            lang={lang}
            onRecordMovement={handleRecordStockMovement}
          />
        )}

        {/* VIEW 5: IMPORT / EXPORT / BACKUP */}
        {activeView === 'import_export' && (
          <ImportExportCenter
            db={userDb}
            userName={currentUser.name}
            userId={currentUser.id}
            lang={lang}
            onImportComplete={handleImportComplete}
          />
        )}

        {/* VIEW 6: ADMIN DASHBOARD */}
        {activeView === 'admin' && currentUser.role === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            users={allUsers}
            officialDb={officialDb}
            lang={lang}
            onSaveUser={handleAdminSaveUser}
            onDeleteUser={handleAdminDeleteUser}
            onUpdateAdminProfile={handleUpdateAdminProfile}
            onUpdateOfficialDb={handleUpdateOfficialDb}
          />
        )}
      </main>

      {/* 4. MODALS */}

      {/* Formula Detail Modal (with embedded 1kg-1000kg calculator and YouTube videos) */}
      {selectedFormulaForDetail && (
        <FormulaDetailModal
          formula={selectedFormulaForDetail}
          rawMaterials={userDb.rawMaterials}
          lang={lang}
          onClose={() => setSelectedFormulaForDetail(null)}
          onAddVideo={handleAddVideo}
          onDeductStock={handleDeductStock}
        />
      )}

      {/* Formula Create/Edit Modal */}
      {showFormulaEditModal && (
        <FormulaEditModal
          formula={formulaToEdit}
          rawMaterials={userDb.rawMaterials}
          lang={lang}
          onClose={() => {
            setShowFormulaEditModal(false);
            setFormulaToEdit(null);
          }}
          onSave={handleSaveFormula}
        />
      )}

      {/* First-time / Reset Must Change Password Modal */}
      {currentUser.mustChangePassword && (
        <MustChangePasswordModal
          user={currentUser}
          lang={lang}
          onPasswordChanged={updated => setCurrentUser(updated)}
        />
      )}

      {/* Personal Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">{t.profile}</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersonalProfile} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.fullName}</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email}</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.userRole}</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.role === 'admin' ? t.roleAdmin : t.roleUser}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Coordonnées / Notes</label>
                <input
                  type="text"
                  value={profileContact}
                  onChange={e => setProfileContact(e.target.value)}
                  placeholder="Ex: Responsable atelier Blida"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-xs cursor-pointer"
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
}
