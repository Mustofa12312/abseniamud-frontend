import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin, Plus, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { locationService } from "../../services/location";
import { useToast } from "../../contexts/ToastContext";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LocationMaster() {
  const { success, error } = useToast();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deletingLocation, setDeletingLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    radius: "",
    lat: "",
    lng: "",
  });

  const fetchLocations = useCallback(async () => {
    try {
      const res = await locationService.getLocations();
      if (res.success) {
        setLocations(res.data || []);
      }
    } catch {
      error("Gagal memuat daftar lokasi.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormData({ name: "", radius: "50", lat: "", lng: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name || "",
      radius: String(loc.radius || "").replace(/[^0-9]/g, ""),
      lat: String(loc.lat || ""),
      lng: String(loc.lng || ""),
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (loc) => {
    setDeletingLocation(loc);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-extract Google Maps URLs or "lat, lng" snippets pasted into lat/lng inputs
    if (
      (name === "lat" || name === "lng") &&
      (value.includes("google.com/maps") || value.includes("@") || value.includes(",") || value.includes("!3d"))
    ) {
      let match = value.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (!match) match = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (!match) match = value.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);

      if (match) {
        setFormData((prev) => ({
          ...prev,
          lat: match[1],
          lng: match[2],
        }));
        success("Koordinat berhasil diekstrak dari teks!");
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapClick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      lat: lat.toFixed(7),
      lng: lng.toFixed(7),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedData = {
        name: formData.name,
        latitude: parseFloat(formData.lat),
        longitude: parseFloat(formData.lng),
        radius: parseInt(formData.radius, 10),
        max_accuracy: 50,
        is_active: true,
      };

      const res = editingLocation
        ? await locationService.updateLocation(editingLocation.id, formattedData)
        : await locationService.createLocation(formattedData);

      if (res.success) {
        await fetchLocations();
        setIsModalOpen(false);
        success(editingLocation ? "Lokasi berhasil diperbarui." : "Lokasi berhasil ditambahkan.");
      }
    } catch (err) {
      error(err.response?.data?.message || "Pastikan koordinat dan radius valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;
    setSubmitting(true);
    try {
      const res = await locationService.deleteLocation(deletingLocation.id);
      if (res.success) {
        if (selectedLocation?.id === deletingLocation.id) {
          setSelectedLocation(null);
        }
        await fetchLocations();
        setIsDeleteModalOpen(false);
        success("Lokasi berhasil dihapus.");
      }
    } catch {
      error("Gagal menghapus lokasi.");
    } finally {
      setSubmitting(false);
    }
  };

  const modalHasValidCoords =
    formData.lat !== "" &&
    formData.lng !== "" &&
    !Number.isNaN(parseFloat(formData.lat)) &&
    !Number.isNaN(parseFloat(formData.lng));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Lokasi"
        description="Kelola titik area presensi kampus dan jangkauan radius geofencing."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus size={16} /> Tambah Lokasi
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <Card className="lg:col-span-2 overflow-hidden">
          <Table className="border-0 shadow-none rounded-none" containerClassName="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lokasi</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead>Koordinat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-[#86868B] animate-pulse">
                    Memuat data lokasi...
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState icon={MapPin} title="Belum Ada Lokasi" description="Tambahkan titik lokasi kampus pertama Anda." />
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <TableRow
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc)}
                      className={`cursor-pointer ${
                        isSelected ? "bg-emerald-50/70 dark:bg-emerald-950/30" : ""
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5 font-semibold">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            <MapPin size={15} />
                          </div>
                          <span>{loc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{loc.radius} m</TableCell>
                      <TableCell className="text-xs font-mono text-[#86868B] dark:text-slate-400">
                        {loc.lat}, {loc.lng}
                      </TableCell>
                      <TableCell>
                        <Badge variant={loc.status === "Aktif" ? "success" : "default"}>{loc.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(loc);
                            }}
                            title="Edit Lokasi"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(loc);
                            }}
                            title="Hapus Lokasi"
                            className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Map Geofence Preview */}
        <Card className="p-5 sticky top-6">
          <h3 className="font-semibold text-sm mb-3.5">Preview Peta Geofence</h3>
          <div className="aspect-square bg-[#F5F5F7] dark:bg-slate-900 rounded-2xl overflow-hidden border border-[#E5E5EA] dark:border-slate-700/60 relative mb-4 z-0">
            {selectedLocation ? (
              <MapContainer
                center={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]}
                zoom={17}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                <Marker position={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]} />
                <Circle
                  center={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]}
                  radius={parseFloat(selectedLocation.radius)}
                  pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.2 }}
                />
                <MapUpdater center={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)]} />
              </MapContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-[#86868B] dark:text-slate-400 p-4 text-center">
                <MapPin size={40} className="mb-2 opacity-40" />
                <p className="text-xs">Klik salah satu lokasi pada tabel untuk melihat peta geofence.</p>
              </div>
            )}
          </div>

          {selectedLocation && (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Nama Lokasi</span>
                  <span className="font-semibold">{selectedLocation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Radius Geofence</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedLocation.radius} meter
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.open(`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`, "_blank")
                }
              >
                <ExternalLink size={14} /> Buka di Google Maps
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? "Edit Lokasi" : "Tambah Lokasi Baru"}
        subtitle="Tempel link Google Maps ke kolom koordinat atau klik langsung pada peta."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="locationForm" isLoading={submitting}>
              {editingLocation ? "Simpan" : "Tambah"}
            </Button>
          </>
        }
      >
        <form id="locationForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold">Nama Lokasi</label>
              <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Radius (meter)</label>
              <Input type="number" name="radius" value={formData.radius} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Latitude</label>
              <Input
                type="text"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                placeholder="-7.1234567"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Longitude</label>
              <Input
                type="text"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                placeholder="113.1234567"
                required
              />
            </div>
          </div>

          <div className="h-52 bg-[#F5F5F7] dark:bg-slate-900 rounded-2xl overflow-hidden border border-[#E5E5EA] dark:border-slate-700/60 relative">
            {modalHasValidCoords ? (
              <MapContainer
                center={[parseFloat(formData.lat), parseFloat(formData.lng)]}
                zoom={17}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[parseFloat(formData.lat), parseFloat(formData.lng)]} />
                {formData.radius && !Number.isNaN(parseFloat(formData.radius)) && (
                  <Circle
                    center={[parseFloat(formData.lat), parseFloat(formData.lng)]}
                    radius={parseFloat(formData.radius)}
                    pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.2 }}
                  />
                )}
                <MapUpdater center={[parseFloat(formData.lat), parseFloat(formData.lng)]} />
                <MapClickEvents onClick={handleMapClick} />
              </MapContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-[#86868B] dark:text-slate-400 p-4 text-center">
                <MapPin size={28} className="mb-2 opacity-40" />
                <p className="text-xs">Masukkan koordinat awal atau tempel tautan Google Maps untuk melihat peta interaktif.</p>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Lokasi"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={submitting}>
              Ya, Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#86868B] dark:text-slate-300">
          Apakah Anda yakin ingin menghapus lokasi{" "}
          <strong className="text-[#1D1D1F] dark:text-white">{deletingLocation?.name}</strong>? Tindakan ini tidak dapat
          dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() > 10 ? map.getZoom() : 17);
  }, [center, map]);
  return null;
}

function MapClickEvents({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
