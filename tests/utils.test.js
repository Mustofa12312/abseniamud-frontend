import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_ROLES,
  ACADEMIC_ADMIN_ROLES,
  PORTAL_ROLES,
  resolveUserRole,
  isAdminRole,
  isAcademicAdmin,
  isPortalRole,
  hasRoleAccess,
  getDefaultRouteForUser,
  getRoleDisplayLabel,
} from "../src/utils/rbac.js";
import {
  getStorageBaseUrl,
  resolveLeaveDocument,
  shouldRedirectOnUnauthorized,
  formatDateId,
  parseCsvPreview,
  assertNotJsonBlob,
} from "../src/utils/format.js";

describe("rbac utilities", () => {
  it("resolves explicit role string and legacy numeric role_id fallbacks", () => {
    assert.equal(resolveUserRole({ role: " admin_keuangan " }), "admin_keuangan");
    assert.equal(resolveUserRole({ role_id: 1 }), "super_admin");
    assert.equal(resolveUserRole({ role_id: 2 }), "admin_akademik");
    assert.equal(resolveUserRole({ role_id: 3 }), "dosen");
    assert.equal(resolveUserRole({ role_id: 4 }), "admin_keuangan");
    assert.equal(resolveUserRole({ role_id: 99 }), null);
    assert.equal(resolveUserRole(null), null);
  });

  it("classifies admin, academic admin, and portal roles accurately", () => {
    assert.equal(isAdminRole({ role: "admin_keuangan" }), true);
    assert.equal(isAcademicAdmin({ role: "admin_keuangan" }), false);
    assert.equal(isAcademicAdmin({ role: "admin_akademik" }), true);
    assert.equal(isPortalRole({ role: "tendik" }), true);
    assert.equal(isPortalRole({ role: "super_admin" }), false);
  });

  it("evaluates route access across role groups including tendik portal access", () => {
    assert.equal(hasRoleAccess({ role: "admin_keuangan" }, ADMIN_ROLES), true);
    assert.equal(hasRoleAccess({ role: "admin_keuangan" }, ACADEMIC_ADMIN_ROLES), false);
    assert.equal(hasRoleAccess({ role: "tendik" }, PORTAL_ROLES), true);
    assert.equal(hasRoleAccess({ role: "tendik" }, ["dosen"]), true);
    assert.equal(hasRoleAccess({ role: "dosen" }, ADMIN_ROLES), false);
    assert.equal(hasRoleAccess(null, ADMIN_ROLES), false);
  });

  it("computes default landing route and human-readable Indonesian labels", () => {
    assert.equal(getDefaultRouteForUser({ role: "admin_keuangan" }), "/admin");
    assert.equal(getDefaultRouteForUser({ role: "tendik" }), "/lecturer");
    assert.equal(getDefaultRouteForUser(null), "/login");

    assert.equal(
      getRoleDisplayLabel({ role: "dosen", lecturer: { id: 1 }, staff_profile: { id: 2 } }),
      "Dosen & Tendik"
    );
    assert.equal(getRoleDisplayLabel({ role: "tendik" }), "Tenaga Kependidikan");
    assert.equal(getRoleDisplayLabel({ role: "admin_keuangan" }), "Admin Keuangan");
    assert.equal(getRoleDisplayLabel(null), "Pengguna");
  });
});

describe("format utilities", () => {
  it("normalizes storage base URL from API base URL", () => {
    assert.equal(getStorageBaseUrl("https://absensi.iaimu.ac.id/api"), "https://absensi.iaimu.ac.id");
    assert.equal(getStorageBaseUrl("http://localhost:8000/api/"), "http://localhost:8000");
    assert.equal(getStorageBaseUrl(undefined), "http://localhost:8000");
  });

  it("resolves leave documents safely between URLs, storage files, and plain text references", () => {
    assert.equal(resolveLeaveDocument(null, "http://localhost:8000/api"), null);
    assert.equal(resolveLeaveDocument("   ", "http://localhost:8000/api"), null);

    assert.deepEqual(
      resolveLeaveDocument("https://drive.google.com/file/123", "http://localhost:8000/api"),
      {
        type: "url",
        href: "https://drive.google.com/file/123",
        label: "Buka Tautan Dokumen",
      }
    );

    assert.deepEqual(
      resolveLeaveDocument("/storage/leaves/surat.pdf", "https://api.iaimu.ac.id/api"),
      {
        type: "url",
        href: "https://api.iaimu.ac.id/storage/leaves/surat.pdf",
        label: "Lihat Lampiran",
      }
    );

    assert.deepEqual(
      resolveLeaveDocument("leaves/izin-01.jpg", "https://api.iaimu.ac.id/api"),
      {
        type: "url",
        href: "https://api.iaimu.ac.id/storage/leaves/izin-01.jpg",
        label: "Lihat Lampiran",
      }
    );

    assert.deepEqual(
      resolveLeaveDocument("Surat Tugas No. 14/REK/2026", "https://api.iaimu.ac.id/api"),
      {
        type: "reference",
        text: "Surat Tugas No. 14/REK/2026",
      }
    );
  });

  it("guards 401 redirect against login reload loops and formats dates", () => {
    assert.equal(shouldRedirectOnUnauthorized("/login"), false);
    assert.equal(shouldRedirectOnUnauthorized(""), false);
    assert.equal(shouldRedirectOnUnauthorized("/admin/users"), true);

    assert.equal(formatDateId(""), "-");
    assert.equal(formatDateId("not-a-date"), "not-a-date");
    assert.match(formatDateId("2026-08-17"), /2026/);
  });

  it("parses CSV previews with semicolon or comma delimiters and strips BOM", () => {
    assert.equal(parseCsvPreview(""), null);

    const semi = parseCsvPreview(
      '\uFEFF"Nama Ruangan";Kapasitas;Deskripsi\nRuang 101;40;Gedung A\nLab Komputer;30;Lt 2\nAula;200;Rektorat',
      2
    );
    assert.equal(semi.delimiter, ";");
    assert.deepEqual(semi.headers, ["Nama Ruangan", "Kapasitas", "Deskripsi"]);
    assert.equal(semi.totalRows, 3);
    assert.equal(semi.rows.length, 2);
    assert.deepEqual(semi.rows[0], ["Ruang 101", "40", "Gedung A"]);

    const comma = parseCsvPreview("Name,Code\nTarbiyah,TAR\nSyariah,SYA", 5);
    assert.equal(comma.delimiter, ",");
    assert.deepEqual(comma.headers, ["Name", "Code"]);
    assert.equal(comma.totalRows, 2);
  });

  it("extracts JSON error messages from accidental Blob error responses", async () => {
    const jsonBlob = {
      type: "application/json",
      text: async () => JSON.stringify({ message: "Ekspor gagal karena tidak ada data" }),
    };
    await assert.rejects(() => assertNotJsonBlob(jsonBlob), /Ekspor gagal karena tidak ada data/);

    const csvBlob = {
      type: "text/csv",
      text: async () => "ok",
    };
    await assert.doesNotReject(() => assertNotJsonBlob(csvBlob));
  });
});

