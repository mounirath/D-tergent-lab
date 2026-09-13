import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Edit2,
  Key,
  Lock,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X
} from 'lucide-react';
import { AccountStatus, Language, Role, User, UserDatabase } from '../types';
import { getTranslation } from '../services/i18n';
import { generateSalt, hashPassword } from '../services/crypto';

interface Props {
  currentUser: User;
  users: User[];
  officialDb: UserDatabase;
  lang: Language;
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateAdminProfile: (updatedAdmin: User) => Promise<void>;
  onUpdateOfficialDb: (newOfficialDb: UserDatabase) => Promise<void>;
}

export const AdminDashboard: React.FC<Props> = ({
  currentUser,
  users,
  officialDb,
  lang,
  onSaveUser,
  onDeleteUser,
  onUpdateAdminProfile,
  onUpdateOfficialDb,
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'users' | 'adminSettings' | 'officialDb'>('users');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create / Edit User Modal
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<Role>('user');
  const [formStatus, setFormStatus] = useState<AccountStatus>('actif');
  const [formContact, setFormContact] = useState<string>('');

  // Password reset modal
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<string>('');

  // Admin Profile settings state
  const [adminName, setAdminName] = useState<string>(currentUser.name);
  const [adminEmail, setAdminEmail] = useState<string>(currentUser.email);
  const [adminContact, setAdminContact] = useState<string>(currentUser.contactInfo || '');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState<string>('');
  const [adminSavedMessage, setAdminSavedMessage] = useState<string>('');

  // Filtering users
  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormStatus('actif');
    setFormContact('');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormContact(u.contactInfo || '');
    setShowUserModal(true);
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !formName.trim()) return;

    if (editingUser) {
      // Edit existing user
      let updated: User = {
        ...editingUser,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
        contactInfo: formContact.trim(),
      };

      if (formPassword.trim()) {
        const salt = generateSalt();
        const passwordHash = await hashPassword(formPassword.trim(), salt);
        updated.passwordHash = passwordHash;
        updated.salt = salt;
        updated.mustChangePassword = true;
      }

      await onSaveUser(updated);
    } else {
      // Create new user
      if (!formPassword.trim()) {
        alert('Veuillez définir un mot de passe initial pour ce compte.');
        return;
      }
      const salt = generateSalt();
      const passwordHash = await hashPassword(formPassword.trim(), salt);

      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        email: formEmail.trim(),
        passwordHash,
        salt,
        role: formRole,
        status: formStatus,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        contactInfo: formContact.trim(),
        mustChangePassword: true,
      };

      await onSaveUser(newUser);
    }

    setShowUserModal(false);
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: AccountStatus = user.status === 'actif' ? 'desactive' : 'actif';
    await onSaveUser({ ...user, status: nextStatus });
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newTempPassword.trim()) return;

    const salt = generateSalt();
    const passwordHash = await hashPassword(newTempPassword.trim(), salt);

    await onSaveUser({
      ...resetTargetUser,
      passwordHash,
      salt,
      mustChangePassword: true,
    });

    setResetTargetUser(null);
    setNewTempPassword('');
    alert(`Mot de passe réinitialisé avec succès pour ${resetTargetUser.email}. L'utilisateur devra le changer à sa prochaine connexion.`);
  };

  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminName.trim()) return;

    let updated: User = {
      ...currentUser,
      name: adminName.trim(),
      email: adminEmail.trim(),
      contactInfo: adminContact.trim(),
    };

    if (newAdminPassword.trim()) {
      if (newAdminPassword !== confirmAdminPassword) {
        alert('Les deux mots de passe ne correspondent pas.');
        return;
      }
      const salt = generateSalt();
      const passwordHash = await hashPassword(newAdminPassword.trim(), salt);
      updated.passwordHash = passwordHash;
      updated.salt = salt;
      updated.mustChangePassword = false;
    }

    await onUpdateAdminProfile(updated);
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setAdminSavedMessage('Paramètres administrateur mis à jour avec succès.');
    setTimeout(() => setAdminSavedMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.adminDashboard}</span>
          </div>
          <h2 className="text-2xl font-black">{t.adminControls}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestion globale des utilisateurs, droits d'accès, sécurité et paramétrage du compte administrateur.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.userAccounts} ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('adminSettings')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'adminSettings' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.adminSettings}</span>
          </button>
          <button
            onClick={() => setActiveTab('officialDb')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'officialDb' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{t.officialDatabase}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">{t.activeStatus}</option>
                <option value="desactive">{t.deactivatedStatus}</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.createUser}</span>
            </button>
          </div>

          {/* Users List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">{t.userRole}</th>
                    <th className="py-3 px-4">{t.accountStatus}</th>
                    <th className="py-3 px-4">Créé le</th>
                    <th className="py-3 px-4">Dernière Connexion</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map(user => {
                    const isAdmin = user.role === 'admin';
                    const isSelf = user.id === currentUser.id;
                    const isActive = user.status === 'actif';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {user.name} {isSelf && <span className="text-[10px] text-sky-600 font-normal">(Vous)</span>}
                              </span>
                              <span className="text-slate-500 text-[11px] block">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              isAdmin ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isAdmin ? <Shield className="w-3 h-3" /> : null}
                            {isAdmin ? t.roleAdmin : t.roleUser}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {isActive ? t.activeStatus : t.deactivatedStatus}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Jamais'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle active / deactive */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  isActive
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isActive ? t.deactivateAccount : t.reactivateAccount}
                              >
                                {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Reset password */}
                            <button
                              onClick={() => {
                                setResetTargetUser(user);
                                setNewTempPassword('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              title={t.resetPassword}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title={t.editUser}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            {!isSelf && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Supprimer définitivement le compte de ${user.name} (${user.email}) ainsi que toutes ses données ?`)) {
                                    try {
                                      await onDeleteUser(user.id);
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={t.deleteAccount}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN SETTINGS (Edit admin email, password, contact) */}
      {activeTab === 'adminSettings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">{t.adminSettings}</h3>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            Modifiez l'adresse email de connexion administrateur, le nom, les coordonnées ou définissez un nouveau mot de passe sécurisé (chiffré en SHA-256).
          </p>

          {adminSavedMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{adminSavedMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveAdminSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom complet administrateur</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Administrateur (Identifiant de connexion)</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                L'adresse email initiale par défaut est <code>mounirath@yahoo.fr</code>. Vous pouvez la modifier à tout moment.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Coordonnées / Poste</label>
              <input
                type="text"
                value={adminContact}
                onChange={e => setAdminContact(e.target.value)}
                placeholder="Ex: Laboratoire Central - Alger"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 mb-3">Changer le mot de passe administrateur</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour ne pas modifier"
                    value={newAdminPassword}
                    onChange={e => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="Confirmer"
                    value={confirmAdminPassword}
                    onChange={e => setConfirmAdminPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 transition shadow-xs cursor-pointer"
              >
                {t.saveProfileButton}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: OFFICIAL DATABASE REFERENCE */}
      {activeTab === 'officialDb' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">{t.officialDatabase}</h3>
          </div>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Cette base contient les formules de référence, matières premières et fournisseurs officiels qui sont dupliqués et isolés dans la base personnelle de chaque nouvel utilisateur inscrit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">Formules Officielles</span>
              <span className="text-2xl font-black text-sky-600">{officialDb.formulas.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">Matières Premières</span>
              <span className="text-2xl font-black text-emerald-600">{officialDb.rawMaterials.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">Fournisseurs Référencés</span>
              <span className="text-2xl font-black text-purple-600">{officialDb.suppliers.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 text-xs text-slate-700 flex items-center justify-between">
            <span>Toute mise à jour ici est automatiquement enregistrée comme modèle pour les futurs comptes.</span>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingUser ? t.editUser : t.createUser}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.fullName} *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email} *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour garder l\'actuel)' : t.password + ' *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.userRole}</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as Role)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="user">{t.roleUser}</option>
                    <option value="admin">{t.roleAdmin}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.accountStatus}</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as AccountStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="actif">{t.activeStatus}</option>
                    <option value="desactive">{t.deactivatedStatus}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact / Notes</label>
                <input
                  type="text"
                  placeholder="Téléphone ou atelier..."
                  value={formContact}
                  onChange={e => setFormContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
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

      {/* MODAL: RESET PASSWORD */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-base text-slate-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-sky-600" />
              <span>{t.resetPassword}</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Définissez un mot de passe provisoire pour <strong>{resetTargetUser.name}</strong> ({resetTargetUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nouveau mot de passe provisoire</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caractères"
                  value={newTempPassword}
                  onChange={e => setNewTempPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-xs cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
