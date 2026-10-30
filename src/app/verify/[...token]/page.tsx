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
  QrCode,
  Download,
  Calendar,
  FileCheck,
} from "lucide-react";
import { LogoImage } from "@/components/logo-image";

interface VerificationResult {
  verified: boolean;
  message: string;
  document?: {
    documentNumber: string;
    documentType: string;
    programName?: string | null;
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
  const [showQr, setShowQr] = useState(false);
  const [qrSrc, setQrSrc] = useState("");

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

  const handleShowQr = async () => {
    if (qrSrc) {
      setShowQr(!showQr);
      return;
    }
    try {
      const QRCode = await import("qrcode");
      const url = window.location.href;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      setQrSrc(dataUrl);
      setShowQr(true);
    } catch {
      alert("Gagal generate QR code");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70 dark:bg-slate-950 text-foreground">
        <div className="text-center space-y-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Memvalidasi dokumen dalam sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b bg-background/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoImage />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Verifikasi Dokumen
              </h1>
              <p className="text-xs text-muted-foreground">
                LKP Language Training Center
              </p>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors print:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke pencarian
          </Link>

          {result?.verified ? (
            <>
              {/* Official Verified Card */}
              <Card
                className="border-emerald-200/90 dark:border-emerald-900/60 shadow-sm overflow-hidden bg-card"
                id="verification-result"
              >
                {/* Header Banner */}
                <CardHeader className="bg-emerald-50/60 dark:bg-emerald-950/25 border-b border-emerald-100 dark:border-emerald-900/40 p-5 sm:p-6">
                  <div className="flex items-start gap-3.5">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-emerald-950 dark:text-emerald-100 text-lg sm:text-xl font-bold tracking-tight">
                          Dokumen Terverifikasi Resmi
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-emerald-950/60 text-[11px] font-medium"
                        >
                          Status Valid
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-emerald-800/80 dark:text-emerald-400">
                        Dokumen ini terdaftar dan dinyatakan sah dalam pangkalan data LKP Language Training Center
                      </p>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-2.5 border-t border-emerald-200/50 dark:border-emerald-800/50 mt-2">
                        Peserta tersebut betul telah mengikuti{" "}
                        <span className="font-semibold text-foreground">
                          {result.document?.programName || result.document?.documentType}
                        </span>{" "}
                        dengan LKP Language Training Center, sebagaimana bukti fisik berupa sertifikat yang diberikan agar dimanfaatkan dengan sebaik-baiknya untuk kebutuhan akademik dan dunia kerja.
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 space-y-5">
                  {/* Primary Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Jenis Dokumen
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        {result.document?.documentType}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Nomor Dokumen
                      </span>
                      <p className="text-sm sm:text-base font-mono font-semibold text-foreground break-all">
                        {result.document?.documentNumber}
                      </p>
                    </div>
                  </div>

                  {/* Document Fields Specification */}
                  {result.document?.fields && result.document.fields.length > 0 && (
                    <div className="border-t border-border/70 pt-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Detail Lembar Dokumen
                        </h3>
                      </div>
                      <dl className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden bg-card text-xs sm:text-sm">
                        {result.document.fields.map((field, i) => (
                          <div
                            key={i}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-1 ${
                              i % 2 === 0 ? "bg-muted/25" : "bg-card"
                            }`}
                          >
                            <dt className="font-medium text-muted-foreground sm:w-1/3">
                              {field.label}
                            </dt>
                            <dd className="font-semibold text-foreground sm:w-2/3 sm:text-right break-words">
                              {field.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Print-only official metadata */}
                  <div className="hidden print:block border-t border-gray-300 pt-4 mt-4 space-y-1 text-center text-[10px] text-gray-500">
                    <p>
                      Diverifikasi pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p>
                      URL Verifikasi: {typeof window !== "undefined" ? window.location.href : ""}
                    </p>
                    <p className="font-semibold text-gray-700">
                      LKP Language Training Center - Sistem Verifikasi Sertifikasi Resmi
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Toolbar */}
              <div className="flex flex-col items-center gap-3 pt-2 print:hidden">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="h-8 text-xs font-medium"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Cetak Halaman
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 text-xs font-medium"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    {copied ? "Link Tersalin!" : "Salin Tautan"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowQr}
                    className="h-8 text-xs font-medium"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1.5" />
                    {showQr ? "Tutup QR" : "Tampilkan QR"}
                  </Button>
                </div>

                {/* QR Code Card */}
                {showQr && qrSrc && (
                  <div className="flex flex-col items-center gap-2.5 p-4 bg-card rounded-lg border border-border/80 shadow-sm animate-in fade-in-50 duration-200">
                    <img
                      src={qrSrc}
                      alt="QR Code Verifikasi"
                      className="w-44 h-44 rounded-md border border-border/40 p-1 bg-white"
                    />
                    <p className="text-[11px] text-muted-foreground text-center">
                      Scan untuk verifikasi dokumen langsung dari perangkat lain
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = qrSrc;
                        a.download = `qr-verifikasi-${result.document?.documentNumber?.replace(/\//g, "-")}.png`;
                        a.click();
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Unduh Berkas QR
                    </Button>
                  </div>
                )}

                {/* Official Contact Button */}
                {contactUrl && contactUrl.startsWith("http") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-medium mt-1"
                    onClick={() => window.open(contactUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Butuh verifikasi resmi melalui surat? Hubungi kami
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* Not Found State */
            <div className="space-y-4">
              <Card className="border-rose-200 dark:border-rose-900/60 shadow-sm overflow-hidden bg-card">
                <CardHeader className="bg-rose-50/60 dark:bg-rose-950/25 border-b border-rose-100 dark:border-rose-900/40 p-5 sm:p-6">
                  <div className="flex items-start gap-3.5">
                    <div className="p-1 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-rose-950 dark:text-rose-100 text-lg font-bold tracking-tight">
                        Dokumen Tidak Terdaftar
                      </CardTitle>
                      <p className="text-xs font-medium text-rose-800/80 dark:text-rose-400">
                        Nomor dokumen atau token verifikasi tidak ditemukan dalam database resmi
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Pastikan nomor dokumen atau kode token yang Anda masukkan sudah persis sesuai dengan yang tertera pada sertifikat fisik. Jika Anda yakin dokumen ini valid dan sah, silakan hubungi bagian administrasi LKP Language Training Center.
                </CardContent>
              </Card>

              {contactUrl && contactUrl.startsWith("http") && (
                <div className="flex justify-center print:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => window.open(contactUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Hubungi Layanan Administrasi
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-background/50 print:hidden">
        <p>&copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_INSTITUTION_NAME || "LKP Language Training Center"}. All rights reserved.</p>
      </footer>
    </div>
  );
}
