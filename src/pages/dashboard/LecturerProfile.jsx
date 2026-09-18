import { useState } from "react"
import { User, Mail, Hash, Phone, MapPin, LogOut, Edit2, X, Save } from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { useAuth } from "../../contexts/AuthContext"
import { authService } from "../../services/auth"
import { useToast } from "../../contexts/ToastContext"

export default function LecturerProfile() {
  const { user, logout, refreshUser } = useAuth()
  const { success, error } = useToast()
  
  // Extract lecturer details from relations if they exist
  const lecturerData = user?.lecturer || {}

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    phone: lecturerData.phone || '',
    address: lecturerData.address || '',
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validation
    if (formData.new_password && formData.new_password !== formData.new_password_confirmation) {
      error("Konfirmasi password baru tidak cocok!")
      setIsSubmitting(false)
      return
    }

    if (formData.new_password && !formData.current_password) {
      error("Masukkan password saat ini untuk mengubah password baru!")
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        phone: formData.phone,
        address: formData.address,
      }
      
      if (formData.new_password) {
        payload.current_password = formData.current_password
        payload.new_password = formData.new_password
        payload.new_password_confirmation = formData.new_password_confirmation
      }

      const res = await authService.updateProfile(payload)
      if (res.success) {
        success("Profil berhasil diperbarui!")
        setIsEditModalOpen(false)
        if (refreshUser) refreshUser() // Refresh user context if available
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        }))
      }
    } catch (err) {
      error(err.response?.data?.message || "Gagal memperbarui profil.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-400 to-teal-500 flex items-center justify-center shadow-lg border-4 border-white mb-4">
          <span className="font-bold text-white text-3xl">{user?.name?.charAt(0) || 'D'}</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name || 'Nama Dosen'}</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-600 rounded-full bg-brand-50 hover:bg-brand-100" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 size={14} />
          </Button>
        </div>
        <p className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm mt-2 font-medium">Dosen Tetap</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Email Akun</p>
                <p className="font-medium text-slate-800">{user?.email || '-'}</p>
              </div>
            </div>
            
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Hash size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">NIDN</p>
                <p className="font-medium text-slate-800">{lecturerData.nidn || '-'}</p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Hash size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">NIP</p>
                <p className="font-medium text-slate-800">{lecturerData.nip || '-'}</p>
              </div>
            </div>

              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">No. Telepon</p>
                  <p className="font-medium text-slate-800">{lecturerData.phone || '-'}</p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Alamat Lengkap</p>
                  <p className="font-medium text-slate-800">{lecturerData.address || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-14 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" /> Keluar Aplikasi
          </Button>
        </div>

        {/* Modal Edit Profil */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col my-8">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Edit Profil</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)}>
                  <X size={18} />
                </Button>
              </div>
              
              <div className="p-5 overflow-y-auto">
                <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Kontak */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Info Kontak</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Nomor Telepon</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="08123456789"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
                          placeholder="Masukkan alamat domisili..."
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Keamanan */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Ganti Password</h4>
                    <p className="text-xs text-slate-500 mb-4 pb-2">Kosongkan jika Anda tidak ingin mengubah password.</p>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Password Saat Ini</label>
                        <input
                          type="password"
                          name="current_password"
                          value={formData.current_password}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Password Baru</label>
                        <input
                          type="password"
                          name="new_password"
                          value={formData.new_password}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
                        <input
                          type="password"
                          name="new_password_confirmation"
                          value={formData.new_password_confirmation}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-slate-100 flex gap-3 mt-auto bg-slate-50 rounded-b-xl">
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" form="edit-profile-form" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : (
                    <>
                      <Save size={16} className="mr-2" /> Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
