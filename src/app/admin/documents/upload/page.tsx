"use client";

import { useEffect, useState, useRef } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface DocumentType {
  id: number;
  name: string;
  prefix: string;
  fields: { id: number; fieldName: string; fieldLabel: string; isRequired: boolean }[];
}

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; reason: string }[];
}

export default function BulkUploadPage() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/document-types")
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch(console.error);
  }, []);

  const selectedType = types.find((t) => t.id === selectedTypeId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Read columns from file
    const buffer = await f.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    if (rows.length > 0) {
      const headerRow = rows[0];
      setColumns(headerRow.filter(Boolean).map(String));
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedTypeId) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentTypeId", String(selectedTypeId));
      formData.append("columnMapping", JSON.stringify(columnMapping));

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        alert(`Upload Selesai! ${data.success} dokumen berhasil diproses.`);
      } else {
        alert(data.error || "Upload gagal");
      }
    } catch {
      alert("Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Upload Massal</h1>
          <p className="text-muted-foreground">
            Upload dokumen secara massal dari file Excel atau CSV
          </p>
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
              Tips format Excel: Kolom tanggal harus berformat <strong>Text</strong> (bukan Date).
              Tulis langsung seperti &quot;12 Agustus 2025&quot;. Jika kolom berformat Date, sistem akan otomatis konversi.
            </p>
          </div>
        </div>

        {/* Step 1: Select Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Pilih Jenis Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedTypeId}
              onChange={(e) => {
                setSelectedTypeId(parseInt(e.target.value));
                setColumnMapping({});
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value={0}>Pilih jenis dokumen</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.prefix})
                </option>
              ))}
            </select>

            {selectedType && (
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Fields:</span>
                {selectedType.fields.map((f) => (
                  <Badge key={f.id} variant="secondary" className="text-xs">
                    {f.fieldLabel}
                    {f.isRequired && "*"}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Upload File */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Upload File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Klik untuk upload file .xlsx
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Column Mapping */}
        {columns.length > 0 && selectedType && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Mapping Kolom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Document Number Mapping */}
              <div className="flex items-center gap-3">
                <Label className="w-40 text-sm">Nomor Dokumen *</Label>
                <select
                  value={columnMapping["documentNumber"] || ""}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, documentNumber: e.target.value })
                  }
                  className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">-- Pilih kolom --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Mappings */}
              {selectedType.fields.map((field) => (
                <div key={field.id} className="flex items-center gap-3">
                  <Label className="w-40 text-sm">
                    {field.fieldLabel}
                    {field.isRequired && <span className="text-red-500">*</span>}
                  </Label>
                  <select
                    value={columnMapping[field.fieldName] || ""}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, [field.fieldName]: e.target.value })
                    }
                    className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">-- Pilih kolom --</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {file && selectedTypeId > 0 && (
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Proses
              </>
            )}
          </Button>
        )}

        {/* Result */}
        {result && (
          <Card className={result.failed > 0 ? "border-yellow-300" : "border-green-300"}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-600" />
                )}
                Hasil Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total Baris</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{result.success}</p>
                  <p className="text-xs text-muted-foreground">Berhasil</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-xs text-muted-foreground">Gagal</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Detail Error:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 bg-red-50 dark:bg-red-900/10 rounded text-red-700 dark:text-red-400"
                      >
                        Baris {err.row}: {err.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
