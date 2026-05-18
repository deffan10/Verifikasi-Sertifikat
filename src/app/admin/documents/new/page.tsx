"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface DocumentType {
  id: number;
  name: string;
  prefix: string;
  fields: { id: number; fieldName: string; fieldLabel: string; fieldType: string; isRequired: boolean }[];
}

export default function NewDocumentPage() {
  const router = useRouter();
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(0);
  const [documentNumber, setDocumentNumber] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/document-types")
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch(console.error);
  }, []);

  const selectedType = types.find((t) => t.id === selectedTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const values = Object.entries(fieldValues)
        .filter(([_, v]) => v)
        .map(([fieldId, value]) => ({ fieldId: parseInt(fieldId), value }));

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTypeId: selectedTypeId,
          documentNumber,
          values,
        }),
      });

      if (res.ok) {
        router.push("/admin/documents");
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan dokumen");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tambah Dokumen</h1>
            <p className="text-muted-foreground">Buat dokumen baru untuk verifikasi</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              {/* Document Type Selection */}
              <div className="space-y-2">
                <Label>Jenis Dokumen *</Label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => {
                    setSelectedTypeId(parseInt(e.target.value));
                    setFieldValues({});
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  required
                >
                  <option value={0}>Pilih jenis dokumen</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.prefix})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Number */}
              <div className="space-y-2">
                <Label>Nomor Dokumen *</Label>
                <Input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder={selectedType ? `Contoh: ${selectedType.prefix}-2025-0001` : "Nomor dokumen"}
                  required
                />
              </div>

              {/* Dynamic Fields */}
              {selectedType && selectedType.fields.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Data Dokumen</h3>
                  {selectedType.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.fieldLabel}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.fieldType === "textarea" ? (
                        <textarea
                          value={fieldValues[field.id] || ""}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                          }
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                          required={field.isRequired}
                        />
                      ) : (
                        <Input
                          type={field.fieldType === "date" ? "date" : field.fieldType === "number" ? "number" : "text"}
                          value={fieldValues[field.id] || ""}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                          }
                          required={field.isRequired}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" disabled={saving || !selectedTypeId}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan Dokumen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
