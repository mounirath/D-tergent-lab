import React, { useState } from 'react';
import { KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { Language, User } from '../types';
import { getTranslation } from '../services/i18n';
import { generateSalt, hashPassword } from '../services/crypto';
import { DatabaseService } from '../services/db';

interface Props {
  user: User;
  lang: Language;
  onPasswordChanged: (updatedUser: User) => void;
}

export const MustChangePasswordModal: React.FC<Props> = ({ user, lang, onPasswordChanged }) => {
  const t = getTranslation(lang);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const salt = generateSalt();
      const passwordHash = await hashPassword(newPassword, salt);

      const updatedUser: User = {
        ...user,
        passwordHash,
        salt,
        mustChangePassword: false,
      };

      await DatabaseService.saveUser(updatedUser);
      onPasswordChanged(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900 mb-1">{t.changePasswordRequired}</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-5">
          {t.changePasswordRequiredNotice}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.newPassword}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.confirmNewPassword}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer"
          >
            {loading ? 'Mise à jour...' : t.saveProfileButton}
          </button>
        </form>
      </div>
    </div>
  );
};
