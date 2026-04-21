import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Building2, Lock, Save,
  Eye, EyeOff, Pencil,
  ShieldCheck, Calendar, BadgeCheck, Send, Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

const ROLE_GRADIENT = {
  manager: 'linear-gradient(135deg,#111827,#374151)',
  hr:      'linear-gradient(135deg,#a42e43,#D45769)',
  trainer: 'linear-gradient(135deg,#0d4f4a,#14b8a6)',
};
const ROLE_LABEL = { manager: 'Manager', hr: 'HR', trainer: 'Trainer' };

// ── Reusable text field with icon ─────────────────────────────
const Field = ({ label, icon: Icon, type = 'text', value, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="relative">
      <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none ${
          disabled
            ? 'border-transparent bg-gray-50 text-gray-700 cursor-default'
            : 'border-gray-300 bg-white text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
        }`}
      />
    </div>
  </div>
);

// ── Reusable password field with show/hide toggle ─────────────
const PwdField = ({ label, value, onChange, show, onToggle }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="relative">
      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

// ── Mock mode flag ────────────────────────────────────────────
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Main component ────────────────────────────────────────────
export default function ProfilePage() {
  const { user }  = useAuth();
  const role      = user?.role ?? 'trainer';
  const gradient  = ROLE_GRADIENT[role] ?? ROLE_GRADIENT.trainer;

  /**
   * Global toast — replaces the old local inline Toast card.
   * Call showToast('success'|'error'|'warning'|'info', message)
   * and the toast appears in the top-right corner via ToastProvider.
   */
  const { toast: globalToast } = useToast();
  const showToast = (type, message) => globalToast[type]?.(message);

  // ── Profile state ─────────────────────────────────────────
  const [profile,  setProfile]  = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);

  // ── Password change state ─────────────────────────────────
  const [pwdForm,     setPwdForm]     = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving,   setPwdSaving]   = useState(false);

  // ── Mail config state (manager only) ─────────────────────
  const [mailForm,       setMailForm]       = useState({ smtpEmail: '', smtpPassword: '' });
  const [mailConfigured, setMailConfigured] = useState(false);
  const [mailSaving,     setMailSaving]     = useState(false);
  const [mailTesting,    setMailTesting]    = useState(false);
  const [showSmtpPwd,    setShowSmtpPwd]    = useState(false);

  // ── Load profile on mount ─────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) {
      // In mock mode, build profile from AuthContext user — no API call needed
      const mockProfile = {
        name: user?.name ?? '', email: user?.email ?? '',
        phone: '', department: '', status: 'Active', joinedDate: null,
      };
      setProfile(mockProfile);
      setForm({ name: mockProfile.name, email: mockProfile.email, phone: '', department: '' });
      return;
    }

    api.get('/auth/profile')
      .then((res) => {
        const data = res?.data ?? res;
        setProfile(data);
        setForm({ name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? '', department: data.department ?? '' });
      })
      .catch(() => showToast('error', 'Failed to load profile'));

    if (role === 'manager') {
      api.get('/auth/mail-config')
        .then((res) => {
          const d = res?.data ?? res;
          setMailConfigured(!!d?.configured);
          if (d?.smtpEmail) setMailForm((p) => ({ ...p, smtpEmail: d.smtpEmail }));
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ── Save profile ──────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name?.trim())  { showToast('error', 'Name is required');  return; }
    if (!form.email?.trim()) { showToast('error', 'Email is required'); return; }
    setSaving(true);
    try {
      const res  = await api.put('/auth/profile', form);
      const data = res?.data ?? res;
      const updatedUser = data?.user ?? data;
      setProfile(updatedUser);
      setEditMode(false);
      showToast('success', 'Profile updated successfully');
      if (data?.accessToken) {
        localStorage.setItem('accessToken',  data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken ?? '');
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, email: updatedUser.email, name: updatedUser.name }));
      }
    } catch (err) {
      showToast('error', err.message ?? 'Update failed');
    } finally { setSaving(false); }
  };

  // ── Save mail config ──────────────────────────────────────
  const handleSaveMailConfig = async () => {
    if (!mailForm.smtpEmail?.trim() || !mailForm.smtpPassword?.trim()) {
      showToast('error', 'SMTP email and password are required'); return;
    }
    setMailSaving(true);
    try {
      await api.put('/auth/mail-config', mailForm);
      setMailConfigured(true);
      setMailForm((p) => ({ ...p, smtpPassword: '' }));
      showToast('success', 'Mail configuration saved');
    } catch (err) {
      showToast('error', err.message ?? 'Failed to save mail config');
    } finally { setMailSaving(false); }
  };

  // ── Test mail ─────────────────────────────────────────────
  const handleTestMail = async () => {
    setMailTesting(true);
    try {
      await api.post('/auth/mail-config/test');
      showToast('success', 'Test email sent — check your inbox');
    } catch (err) {
      showToast('error', err.message ?? 'Test email failed');
    } finally { setMailTesting(false); }
  };

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword) { showToast('error', 'All fields required'); return; }
    if (pwdForm.newPassword.length < 6)               { showToast('error', 'Min 6 characters');    return; }
    if (pwdForm.newPassword !== pwdForm.confirm)       { showToast('error', 'Passwords do not match'); return; }
    setPwdSaving(true);
    try {
      await api.put('/auth/change-password', { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      setPwdForm({ oldPassword: '', newPassword: '', confirm: '' });
      showToast('success', 'Password changed successfully');
    } catch (err) {
      showToast('error', err.message ?? 'Password change failed');
    } finally { setPwdSaving(false); }
  };

  // ── Loading state ─────────────────────────────────────────
  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const initials = profile.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="min-h-full bg-gray-50 p-6"
    >
      {/* Toast is rendered globally by ToastProvider in App.jsx — no local card needed */}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ══ LEFT — Profile Info ══════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="relative">
            <div className="h-32 w-full" style={{ background: gradient }} />
            <button
              onClick={() => setEditMode((v) => !v)}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-colors"
            >
              <Pencil size={12} /> {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
            <div
              className="absolute left-6 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg rounded-2xl"
              style={{ bottom: '-40px', width: 80, height: 80, background: gradient }}
            >
              {initials}
            </div>
          </div>

          <div className="px-6 pt-14 pb-4">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                style={{ background: `${gradient.match(/#[a-f0-9]{6}/i)?.[0]}22`, color: gradient.match(/#[a-f0-9]{6}/i)?.[0] }}
              >
                {ROLE_LABEL[role] ?? role}
              </span>
              {profile.status === 'Active' && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            <Field label="Full Name"  icon={User}      type="text"  value={editMode ? form.name       : (profile.name       ?? '—')} onChange={(e) => setForm((p) => ({ ...p, name:       e.target.value }))} disabled={!editMode} />
            <Field label="Email"      icon={Mail}      type="email" value={editMode ? form.email      : (profile.email      ?? '—')} onChange={(e) => setForm((p) => ({ ...p, email:      e.target.value }))} disabled={!editMode} />
            <Field label="Phone"      icon={Phone}     type="tel"   value={editMode ? form.phone      : (profile.phone      ?? '—')} onChange={(e) => setForm((p) => ({ ...p, phone:      e.target.value }))} disabled={!editMode} />
            <Field label="Department" icon={Building2} type="text"  value={editMode ? form.department : (profile.department ?? '—')} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} disabled={!editMode} />

            <AnimatePresence>
              {editMode && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white mt-2"
                  style={{ background: gradient, opacity: saving ? 0.7 : 1 }}
                >
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ══ RIGHT — Password + Account Info ═════════════════ */}
        <div className="flex flex-col gap-6">

          {/* Account Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BadgeCheck size={16} className="text-gray-400" /> Account Info
            </h3>
            <div className="space-y-3">
              {[
                { icon: Mail,        label: 'Email',      value: profile.email      ?? '—' },
                { icon: ShieldCheck, label: 'Role',       value: ROLE_LABEL[role] ?? role  },
                { icon: Building2,   label: 'Department', value: profile.department ?? '—' },
                { icon: Calendar,    label: 'Joined',     value: profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Icon size={13} />
                    <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                  </div>
                  <span className="text-sm text-gray-800 font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Lock size={16} className="text-gray-400" /> Change Password
            </h3>
            {/* Each field has its own independent show/hide toggle */}
            <PwdField label="Current Password"    value={pwdForm.oldPassword} onChange={(e) => setPwdForm((p) => ({ ...p, oldPassword: e.target.value }))} show={showOld}     onToggle={() => setShowOld((v) => !v)} />
            <PwdField label="New Password"         value={pwdForm.newPassword} onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))} show={showNew}     onToggle={() => setShowNew((v) => !v)} />
            <PwdField label="Confirm New Password" value={pwdForm.confirm}     onChange={(e) => setPwdForm((p) => ({ ...p, confirm:     e.target.value }))} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
            <button
              onClick={handleChangePassword}
              disabled={pwdSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: gradient, opacity: pwdSaving ? 0.7 : 1 }}
            >
              <Lock size={14} />
              {pwdSaving ? 'Changing…' : 'Change Password'}
            </button>
          </div>

          {/* Mail Settings — manager only */}
          {role === 'manager' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Settings size={16} className="text-gray-400" /> Mail Settings
                </h3>
                {mailConfigured && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter your Gmail (or Outlook/Yahoo) address and an <strong>App Password</strong>.
                These credentials are used to send login credentials to new Trainers and HR users.
              </p>
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Mail size={11} /> Generate a Gmail App Password ↗
              </a>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sender Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={mailForm.smtpEmail}
                    onChange={(e) => setMailForm((p) => ({ ...p, smtpEmail: e.target.value }))}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">App Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showSmtpPwd ? 'text' : 'password'} value={mailForm.smtpPassword}
                    onChange={(e) => setMailForm((p) => ({ ...p, smtpPassword: e.target.value }))}
                    placeholder={mailConfigured ? '••••••••••••••••  (leave blank to keep)' : 'Paste 16-char App Password'}
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  <button type="button" onClick={() => setShowSmtpPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSmtpPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSaveMailConfig} disabled={mailSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: gradient, opacity: mailSaving ? 0.7 : 1 }}>
                  <Save size={14} />
                  {mailSaving ? 'Saving…' : 'Save Mail Config'}
                </button>
                {mailConfigured && (
                  <button onClick={handleTestMail} disabled={mailTesting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                    <Send size={14} />
                    {mailTesting ? 'Sending…' : 'Test'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
