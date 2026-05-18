"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Search, Download, Eye, QrCode, Copy } from "lucide-react";

interface Document {
  id: number;
  documentNumber: string;
  verificationToken: string;
  qrCode: string;
  isActive: boolean;
  createdAt: string;
  documentType: { name: string };
  values: { field: { fieldLabel: string }; value: string }[];
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [qrDialog, setQrDialog] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [page, search]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents);
      setTotalPages(data.pagination.totalPages);
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

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dokumen</h1>
            <p className="text-muted-foreground">Kelola semua dokumen yang terdaftar</p>
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

        {/* Search */}
        <div className="flex gap-2">
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
      // Generate QR client-side
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
