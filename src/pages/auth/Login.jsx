import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { useAuth } from "../../contexts/AuthContext";
import { getDefaultRouteForUser } from "../../utils/rbac";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await login(email, password);
      if (response.success && response.data?.user) {
        navigate(getDefaultRouteForUser(response.data.user));
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        setError(firstError || "Data masuk tidak valid.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Koneksi ke server gagal.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="text-center mb-7">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mx-auto inline-flex items-center justify-center mb-4 p-3 rounded-3xl bg-white dark:bg-slate-900 border border-[#E5E5EA] dark:border-slate-800 shadow-[0_6px_24px_rgb(0,0,0,0.06)]"
        >
          <img src="/iaimulogo.png" alt="Logo IAIMU" className="h-20 w-auto object-contain" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mb-1.5">
          Selamat Datang
        </h1>
        <p className="text-sm text-[#86868B] dark:text-slate-400">
          Sistem Presensi Geofencing IAIMU
        </p>
      </div>

      <Card className="relative overflow-hidden shadow-[0_12px_36px_rgb(0,0,0,0.06)] dark:shadow-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardHeader className="space-y-1 pb-4 pt-7">
          <CardTitle className="text-xl font-semibold">Masuk Akun</CardTitle>
          <CardDescription>Silakan masukkan email dan kata sandi Anda</CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 pt-0 pb-7">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Email / Identitas Akun
              </label>
              <Input
                type="text"
                placeholder="nama@iaimu.ac.id"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Kata Sandi
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              {!isLoading && <LogIn size={17} />}
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center mt-7 text-[#86868B] dark:text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} Institut Agama Islam Miftahul Ulum
      </p>
    </motion.div>
  );
}
