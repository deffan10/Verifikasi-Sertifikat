"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Printer,
  Copy,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface VerificationResult {
  verified: boolean;
  message: string;
  document?: {
    documentNumber: string;
    documentType: string;
    verificationToken: string;
    createdAt: string;
    fields: { label: string; value: string; type: string }[];
  };
}

export default function VerifyPage() {
  const params = useParams();
  const tokenParts = params.token as string[];
  const token = Array.isArray(tokenParts) ? tokenParts.join("/") : String(tokenParts);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [contactUrl, setContactUrl] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(token)}`);
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({ verified: false, message: "Terjadi kesalahan saat verifikasi" });
      } finally {
        setLoading(false);
      }
    }

    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings?key=contact_url");
        const data = await res.json();
        setContactUrl(data.value || "");
      } catch {}
    }

    verify();
    fetchSettings();
  }, [token]);

  const handlePrint = () => window.print();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Memverifikasi dokumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-lg font-bold text-primary">Verifikasi Dokumen</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke halaman utama
          </Link>

          {result?.verified ? (
            <>
              {/* Verified */}
              <Card className="border-green-200 dark:border-green-800 shadow-lg" id="verification-result">
                <CardHeader className="bg-green-50 dark:bg-green-900/20 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                    <div>
                      <CardTitle className="text-green-700 dark:text-green-400 text-xl">
                        Dokumen Terverifikasi
                      </CardTitle>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        Dokumen ini valid dan terdaftar dalam sistem
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Jenis Dokumen</p>
                      <p className="font-medium">{result.document?.documentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nomor Dokumen</p>
                      <p className="font-medium">{result.document?.documentNumber}</p>
                    </div>
                  </div>

                  {result.document?.fields && result.document.fields.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-3">Detail Dokumen</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.document.fields.map((field, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">{field.label}</p>
                            <p className="font-medium text-sm">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Print-only footer */}
                  <div className="hidden print:block border-t pt-4 mt-4">
                    <p className="text-xs text-center text-gray-500">
                      Diverifikasi pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-center text-gray-500">
                      URL Verifikasi: {typeof window !== "undefined" ? window.location.href : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions - centered */}
              <div className="flex flex-col items-center gap-3 print:hidden">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Cetak
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? "Tersalin!" : "Salin Link"}
                  </Button>
                </div>

                {contactUrl && (
                  <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Butuh verifikasi resmi melalui surat? Silahkan hubungi kami
                    </Button>
                  </a>
                )}
              </div>
            </>
          ) : (
            /* Not Verified */
            <>
              <Card className="border-red-200 dark:border-red-800 shadow-lg">
                <CardHeader className="bg-red-50 dark:bg-red-900/20 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-10 w-10 text-red-600" />
                    <div>
                      <CardTitle className="text-red-700 dark:text-red-400 text-xl">
                        Dokumen Tidak Ditemukan
                      </CardTitle>
                      <p className="text-sm text-red-600 dark:text-red-500">
                        Dokumen dengan nomor/token tersebut tidak terdaftar dalam sistem
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Pastikan nomor dokumen atau token verifikasi yang Anda masukkan sudah benar.
                    Jika Anda yakin dokumen ini valid, silakan hubungi pihak yang menerbitkan dokumen.
                  </p>
                </CardContent>
              </Card>

              {contactUrl && (
                <div className="flex justify-center print:hidden">
                  <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Hubungi Kami
                    </Button>
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t mt-16 py-6 text-center text-sm text-muted-foreground print:hidden">
        <p>&copy; {new Date().getFullYear()} Sistem Verifikasi Dokumen</p>
      </footer>
    </div>
  );
}
