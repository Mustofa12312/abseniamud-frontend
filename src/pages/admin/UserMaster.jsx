import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { Users, Plus, Pencil, Trash2, Search, UserCheck } from "lucide-react"
import { adminService } from "../../services/admin"
import { useToast } from "../../contexts/ToastContext"

export default function UserMaster() {
  const { success, error } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'dosen'
  })

  const fetchUsers = async () => {
    try {
      const res = await adminService.getUsers()
      if (res.success) {
        setUsers(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const res = await adminService.updateUser(editingUser.id, formData)
        if (res.success) {
          setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u))
          success("Pengguna berhasil diperbarui.")
        }
      } else {
        const res = await adminService.createUser(formData)
        if (res.success) {
          setUsers([...users, { ...res.data, created_at: new Date().toISOString().split('T')[0] }])
          success("Pengguna berhasil ditambahkan.")
        }
      }
      setIsModalOpen(false)
    } catch (err) {
      error(err.response?.data?.message || "Terjadi kesalahan, periksa form Anda.")
    }
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setIsModalOpen(true)
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'dosen' })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        const res = await adminService.deleteUser(id)
        if (res.success) {
          setUsers(users.filter(u => u.id !== id))
          success("Pengguna berhasil dihapus.")
        }
      } catch (err) {
        error(err.response?.data?.message || "Gagal menghapus.")
      }
    }
  }

  const getRoleBadge = (role) => {
    switch(role) {
      case 'super_admin': return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Super Admin</Badge>
      case 'admin_akademik': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Akademik</Badge>
      case 'admin_keuangan': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Keuangan</Badge>
      case 'dosen': return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Dosen</Badge>
      default: return <Badge>{role}</Badge>
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Pengguna</h2>
          <p className="text-slate-500 mt-1">Kelola data login, kata sandi, dan hak akses seluruh civitas.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Tambah Akun
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck size={18} className="text-brand-600" /> Daftar Pengguna
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama atau email..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama Pengguna</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Hak Akses (Role)</th>
                  <th className="px-6 py-4 font-medium">Tgl Dibuat</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 animate-pulse">Memuat data...</td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-slate-500">{user.created_at}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(user)} className="h-8 px-2 text-slate-600">
                          <Pencil size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)} className="h-8 px-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Tidak ada data ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</CardTitle>
              <CardDescription>
                {editingUser ? 'Perbarui data atau kosongkan sandi jika tidak ingin mengubah.' : 'Isi formulir untuk membuat akun baru.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Alamat Email</label>
                  <Input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Kata Sandi {editingUser && '(Opsional)'}</label>
                  <Input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required={!editingUser}
                    placeholder={editingUser ? 'Kosongkan jika tidak ingin diubah' : 'Minimal 6 karakter'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Hak Akses</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="dosen">Dosen</option>
                    <option value="admin_akademik">Admin Akademik</option>
                    <option value="admin_keuangan">Admin Keuangan</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="w-full">
                    {editingUser ? 'Simpan' : 'Buat Akun'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
