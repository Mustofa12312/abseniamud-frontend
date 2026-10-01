import { useState, useEffect } from "react"
import { Bell, Plus, Edit2, Trash2, Loader2, Megaphone } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import api from "../../services/api"
import { useToast } from "../../contexts/ToastContext"

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const { success, error } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '', is_active: true, is_important: false })
  const [editingId, setEditingId] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/announcements')
      if (res.data.success) {
        setAnnouncements(res.data.data)
      }
    } catch (err) {
      error("Gagal memuat pengumuman")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitLoading(true)
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, formData)
        success("Pengumuman berhasil diubah")
      } else {
        await api.post('/admin/announcements', formData)
        success("Pengumuman berhasil dibuat")
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ title: '', content: '', is_active: true, is_important: false })
      fetchAnnouncements()
    } catch (err) {
      error("Gagal menyimpan pengumuman")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      content: item.content,
      is_active: item.is_active,
      is_important: item.is_important
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/announcements/${id}`)
      success("Pengumuman berhasil dihapus")
      setDeleteConfirmId(null)
      fetchAnnouncements()
    } catch (err) {
      error("Gagal menghapus pengumuman")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengumuman Kampus</h1>
          <p className="text-sm text-slate-500">Kelola informasi dan pengumuman untuk seluruh dosen dan tendik.</p>
        </div>
        <Button onClick={() => {
          setShowForm(true)
          setEditingId(null)
          setFormData({ title: '', content: '', is_active: true, is_important: false })
        }} className="flex items-center gap-2">
          <Plus size={16} /> Buat Pengumuman
        </Button>
      </div>

      {showForm && (
        <Card className="border-brand-100 shadow-md">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Pengumuman</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Misal: Libur Nasional..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Isi Pengumuman</label>
                <textarea 
                  required 
                  rows={4} 
                  className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                ></textarea>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-brand-600 focus:ring-brand-500" />
                  Aktif (Tampil)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={formData.is_important} onChange={e => setFormData({...formData, is_important: e.target.checked})} className="rounded text-red-600 focus:ring-red-500" />
                  Penting (Tandai Merah)
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Pengumuman</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Memuat data...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-slate-500">Belum ada pengumuman.</td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {item.title}
                            {item.is_important && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Penting</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">{item.content}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Hapus Pengumuman?</h3>
              <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  Ya, Hapus
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
