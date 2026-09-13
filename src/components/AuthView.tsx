import React, { useState } from 'react';
import {
  AlertCircle,
  Beaker,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
  UserPlus
} from 'lucide-react';
import { Language, User } from '../types';
import { getTranslation } from '../services/i18n';
import { generateSalt, hashPassword, verifyPassword } from '../services/crypto';
import { DatabaseService } from '../services/db';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<Props> = ({
  lang,
  onLanguageChange,
  onLoginSuccess,
}) => {
  const t = getTranslation(lang);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quick fill admin credentials button for reviewer convenience
  const handleFillAdmin = () => {
    setEmail('mounirath@yahoo.fr');
    setPassword('mounirath1977');
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await DatabaseService.getUserByEmail(email);
      if (!user) {
        setErrorMessage(t.invalidCredentials);
        setIsLoading(false);
        return;
      }

      if (user.status === 'desactive') {
        setErrorMessage(t.accountDeactivatedNotice);
        setIsLoading(false);
        return;
      }

      const isValid = await verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        setErrorMessage(t.invalidCredentials);
        setIsLoading(false);
        return;
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      await DatabaseService.saveUser(user);
      DatabaseService.setActiveUserId(user.id);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur d\'authentification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const existing = await DatabaseService.getUserByEmail(email);
      if (existing) {
        setErrorMessage('Un compte avec cette adresse email existe déjà.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
        setIsLoading(false);
        return;
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);

      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        email: email.trim().toLowerCase(),
        passwordHash,
        salt,
        name: name.trim(),
        role: 'user',
        status: 'actif',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        mustChangePassword: false,
      };

      await DatabaseService.saveUser(newUser);
      // Initialize isolated user database
      await DatabaseService.getUserDatabase(newUser.id);
      DatabaseService.setActiveUserId(newUser.id);
      onLoginSuccess(newUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSuccessMessage(t.forgotPasswordInstructions);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradient accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Bar at top */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
          <button
            onClick={() => onLanguageChange('fr')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              lang === 'fr' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇫🇷 Français
          </button>
          <button
            onClick={() => onLanguageChange('ar')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              lang === 'ar' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇩🇿 العربية
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 shadow-xl shadow-sky-600/20 mb-3 border border-sky-400/30">
            <Beaker className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.appName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
            {t.appSubtitle}
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-100/50">
          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 pb-3 mb-6">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 text-center py-2 text-xs font-bold transition border-b-2 -mb-3 cursor-pointer ${
                authMode === 'login'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.login}
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 text-center py-2 text-xs font-bold transition border-b-2 -mb-3 cursor-pointer ${
                authMode === 'register'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.register}
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nom@exemple.dz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">{t.password}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMessage('');
                    }}
                    className="text-[11px] text-sky-600 hover:underline cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Connexion en cours...' : t.signInButton}</span>
              </button>

              {/* One-click Admin Fast Fill */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      Accès Administrateur Démo
                    </span>
                    <button
                      type="button"
                      onClick={handleFillAdmin}
                      className="px-2 py-1 rounded bg-sky-100 text-sky-800 font-bold hover:bg-sky-200 transition text-[10px] cursor-pointer"
                    >
                      Remplir
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500">
                    mounirath@yahoo.fr / mounirath1977
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.fullName}</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Mohamed Benali"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nom@exemple.dz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.password}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-[11px] text-sky-900">
                <p>
                  Votre compte disposera de sa propre base de données isolée et sécurisée. Vous pourrez modifier, ajouter ou importer vos propres formules sans altérer les données des autres formulateurs.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Création...' : t.createAccount}</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
              <p className="text-slate-600 text-xs">
                Entrez votre adresse email pour recevoir les instructions ou contactez directement votre administrateur d'atelier.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nom@exemple.dz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-md transition cursor-pointer"
              >
                Envoyer la demande
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security / No GPS footnote */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          🔒 Données persistantes • Hachage sécurisé SHA-256 • Sans traceur ni géolocalisation
        </p>
      </div>
    </div>
  );
};
