"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Search, Download, Pencil, QrCode, Copy, Save } from "lucide-react";

interface DocumentValue {
  field: { id: number; fieldLabel: string; fieldType: string };
  value: string;
}

interface Document {
  id: number;
  documentNumber: string;
  verificationToken: string;
  qrCode: string;
  isActive: boolean;
  createdAt: string;
  documentType: { name: string };
  values: DocumentValue[];
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [qrDialog, setQrDialog] = useState<Document | null>(null);
  const [editDialog, setEditDialog] = useState<Document | null>(null);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [page, limit, search]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus dokumen ini?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      fetchDocuments();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  const handleExport = async () => {
    const res = await fetch("/api/documents/export");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents-export-${Date.now()}.xlsx`;
    a.click();
  };

  const copyVerificationLink = (token: string) => {
    const url = `${window.location.origin}/verify/${token}`;
    navigator.clipboard.writeText(url);
  };

  const openEdit = (doc: Document) => {
    setEditDialog(doc);
    const vals: Record<number, string> = {};
    doc.values.forEach((v) => {
      vals[v.field.id] = v.value;
    });
    setEditValues(vals);
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    setEditSaving(true);
    try {
      const values = Object.entries(editValues).map(([fieldId, value]) => ({
        fieldId: parseInt(fieldId),
        value,
      }));
      const res = await fetch(`/api/documents/${editDialog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      if (res.ok) {
        setEditDialog(null);
        fetchDocuments();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan");
      }
    } catch {
      alert("Terjadi kesalahan");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dokumen</h1>
            <p className="text-muted-foreground">Kelola semua dokumen yang terdaftar ({total} total)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export Excel
            </Button>
            <Link href="/admin/documents/new">
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Tambah Dokumen
              </Button>
            </Link>
          </div>
        </div>

        {/* Search + Per-page selector */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nomor dokumen..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
            <span className="text-sm text-muted-foreground">per halaman</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Dokumen</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {doc.documentNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.documentType.name}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {doc.values.slice(0, 2).map((v) => v.value).join(", ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.isActive ? "success" : "outline"}>
                          {doc.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(doc)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQrDialog(doc)}
                          title="QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyVerificationLink(doc.verificationToken)}
                          title="Salin Link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          className="text-destructive"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada dokumen
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        )}

        {/* QR Dialog */}
        <Dialog open={!!qrDialog} onOpenChange={() => setQrDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code - {qrDialog?.documentNumber}</DialogTitle>
            </DialogHeader>
            <QrDialogContent doc={qrDialog} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Dokumen - {editDialog?.documentNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editDialog?.values.map((v) => (
                <div key={v.field.id} className="space-y-1">
                  <Label className="text-sm">{v.field.fieldLabel}</Label>
                  {v.field.fieldType === "textarea" ? (
                    <textarea
                      value={editValues[v.field.id] || ""}
                      onChange={(e) => setEditValues({ ...editValues, [v.field.id]: e.target.value })}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    />
                  ) : (
                    <Input
                      type={v.field.fieldType === "number" ? "number" : "text"}
                      value={editValues[v.field.id] || ""}
                      onChange={(e) => setEditValues({ ...editValues, [v.field.id]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(null)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}

function QrDialogContent({ doc }: { doc: Document | null }) {
  const [qrSrc, setQrSrc] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!doc) return;
    if (doc.qrCode) {
      setQrSrc(doc.qrCode);
    } else {
      setGenerating(true);
      const url = `${window.location.origin}/verify/${doc.verificationToken}`;
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(url, { width: 300, margin: 2 }).then((dataUrl: string) => {
          setQrSrc(dataUrl);
          setGenerating(false);
        });
      }).catch(() => setGenerating(false));
    }
  }, [doc]);

  if (!doc) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {generating ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : qrSrc ? (
        <img src={qrSrc} alt="QR Code" className="w-64 h-64" />
      ) : (
        <p className="text-sm text-muted-foreground">Gagal generate QR</p>
      )}
      <p className="text-sm text-muted-foreground font-mono">
        {doc.verificationToken}
      </p>
      <p className="text-xs text-muted-foreground">
        {`${window.location.origin}/verify/${doc.verificationToken}`}
      </p>
      {qrSrc && (
        <Button
          variant="outline"
          onClick={() => {
            const a = document.createElement("a");
            a.href = qrSrc;
            a.download = `qr-${doc.documentNumber.replace(/\//g, "-")}.png`;
            a.click();
          }}
        >
          <Download className="h-4 w-4 mr-1" />
          Download QR
        </Button>
      )}
    </div>
  );
}
