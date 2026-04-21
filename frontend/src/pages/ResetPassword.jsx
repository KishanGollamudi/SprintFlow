import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import authService from "@/services/authService";

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get("token") ?? "";

  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6)        { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)        { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err?.message || "Reset failed. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "#f0f6ff" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        style={{ border: "1.5px solid #c8daf0" }}>
        {/* Top accent */}
        <div style={{ height: 4, background: "linear-gradient(135deg,#1d6fa4,#38bdf8)" }} />

        <div className="p-8">
          {/* Logo / title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: "rgba(29,111,164,0.08)", border: "1.5px solid rgba(29,111,164,0.2)" }}>
              <Lock size={24} style={{ color: "#1d6fa4" }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your new password below.</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <CheckCircle size={48} style={{ color: "#10b981" }} />
              <p className="text-lg font-bold text-gray-900">Password Reset!</p>
              <p className="text-sm text-gray-500">Redirecting to login in 3 seconds…</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#b91c1c" }}>
                  <XCircle size={15} /> {error}
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition-all focus:bg-white"
                    onFocus={(e) => { e.target.style.borderColor = "#1d6fa4"; e.target.style.boxShadow = "0 0 0 3px rgba(29,111,164,0.15)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition-all focus:bg-white"
                    onFocus={(e) => { e.target.style.borderColor = "#1d6fa4"; e.target.style.boxShadow = "0 0 0 3px rgba(29,111,164,0.15)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !token}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg,#1d6fa4,#38bdf8)",
                  opacity: submitting || !token ? 0.7 : 1,
                  cursor: submitting || !token ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(29,111,164,0.3)",
                }}
              >
                {submitting ? "Resetting…" : "Reset Password"}
              </button>

              <p className="text-center text-xs text-gray-400 mt-2">
                Remember your password?{" "}
                <button type="button" onClick={() => navigate("/login")}
                  className="text-blue-600 hover:underline font-medium">
                  Back to Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
