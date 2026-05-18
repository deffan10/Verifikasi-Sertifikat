"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface DocumentField {
  id?: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
}

interface DocumentType {
  id: number;
  name: string;
  slug: string;
  prefix: string;
  isActive: boolean;
  fields: DocumentField[];
  _count?: { documents: number };
}

export default function DocumentTypesPage() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [fields, setFields] = useState<DocumentField[]>([]);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await fetch("/api/document-types");
      const data = await res.json();
      setTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPrefix("");
    setFields([{ fieldName: "", fieldLabel: "", fieldType: "text", isRequired: true }]);
    setDialogOpen(true);
  };

  const openEdit = (type: DocumentType) => {
    setEditing(type);
    setName(type.name);
    setPrefix(type.prefix);
    setFields(
      type.fields.map((f) => ({
        fieldName: f.fieldName,
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType,
        isRequired: f.isRequired,
      }))
    );
    setDialogOpen(true);
  };

  const addField = () => {
    setFields([...fields, { fieldName: "", fieldLabel: "", fieldType: "text", isRequired: true }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof DocumentField, value: string | boolean) => {
    const updated = [...fields];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[key] = value;
    // Auto-generate fieldName from fieldLabel
    if (key === "fieldLabel" && typeof value === "string") {
      updated[index].fieldName = value
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "_");
    }
    setFields(updated);
  };

  const handleSave = async () => {
    if (!name || !prefix) return;
    setSaving(true);

    try {
      const validFields = fields.filter((f) => f.fieldName && f.fieldLabel);
      const url = editing ? `/api/document-types/${editing.id}` : "/api/document-types";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prefix, fields: validFields }),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchTypes();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan");
      }
    } catch (error) {
      alert("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jenis dokumen ini? Semua dokumen terkait juga akan terhapus.")) return;
    try {
      await fetch(`/api/document-types/${id}`, { method: "DELETE" });
      fetchTypes();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Jenis Dokumen</h1>
            <p className="text-muted-foreground">Kelola jenis dokumen dan field-nya</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Jenis
          </Button>
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
                    <TableHead>Nama</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Dokumen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{type.prefix}</Badge>
                      </TableCell>
                      <TableCell>{type.fields.length} fields</TableCell>
                      <TableCell>{type._count?.documents || 0}</TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? "success" : "outline"}>
                          {type.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {types.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada jenis dokumen
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Jenis Dokumen" : "Tambah Jenis Dokumen"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Jenis Dokumen</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sertifikat"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prefix</Label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="Contoh: SERT"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Fields</Label>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah Field
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={field.fieldLabel}
                        onChange={(e) => updateField(index, "fieldLabel", e.target.value)}
                        placeholder="Nama Lengkap"
                        className="h-8"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Tipe</Label>
                      <select
                        value={field.fieldType}
                        onChange={(e) => updateField(index, "fieldType", e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={(e) => updateField(index, "isRequired", e.target.checked)}
                          className="rounded"
                        />
                        Wajib
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {editing ? "Simpan Perubahan" : "Buat Jenis Dokumen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
