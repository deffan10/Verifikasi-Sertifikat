"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, QrCode, LogIn, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoImage } from "@/components/logo-image";

export default function HomePage() {
  const [documentNumber, setDocumentNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim()) return;
    setIsLoading(true);
    router.push(`/verify/${encodeURIComponent(documentNumber.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b bg-background/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoImage />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {process.env.NEXT_PUBLIC_APP_NAME || "Verifikasi Dokumen"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {process.env.NEXT_PUBLIC_INSTITUTION_NAME || "Sistem Verifikasi Sertifikat & Dokumen Resmi"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/admin/login">
              <Button variant="ghost" size="icon" title="Admin Login" aria-label="Admin Login">
                <LogIn className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-16 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Portal Validasi Dokumen Resmi
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Verifikasi Keaslian Dokumen
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Pastikan keabsahan sertifikat dan dokumen resmi Anda langsung melalui pangkalan data terintegrasi LTC.
            </p>
          </div>

          {/* Search Card */}
          <Card className="border-border/80 shadow-sm bg-card">
            <CardHeader className="pb-3 text-center sm:text-left">
              <CardTitle className="text-lg font-semibold flex items-center justify-center sm:justify-start gap-2">
                <Search className="h-4 w-4 text-primary" />
                Pencarian Dokumen
              </CardTitle>
              <CardDescription className="text-xs">
                Ketik nomor dokumen, kode sertifikat, atau token verifikasi yang tertera pada lembar fisik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2.5">
                <label htmlFor="document-number-input" className="sr-only">
                  Nomor Dokumen atau Token
                </label>
                <Input
                  id="document-number-input"
                  placeholder="Contoh: LTC/ETP-FL/2026/91026976"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="flex-1 font-mono text-sm h-10"
                  required
                />
                <Button type="submit" disabled={isLoading} className="h-10 px-6 font-medium">
                  {isLoading ? "Memverifikasi..." : "Verifikasi"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* QR Info Banner */}
          <div className="flex items-start sm:items-center gap-3.5 p-4 rounded-lg bg-card border border-border/70 text-sm">
            <div className="p-2.5 rounded-md bg-primary/10 text-primary shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Pindai QR Code Dokumen</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda juga dapat memverifikasi instan dengan mengarahkan kamera ponsel ke QR Code yang tercetak di sertifikat fisik.
              </p>
            </div>
          </div>

          {/* Institutional Assurances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-lg border border-border/50 bg-card/60 text-center space-y-1">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-xs font-semibold text-foreground">Otentik & Resmi</h3>
              <p className="text-[11px] text-muted-foreground">
                Terkoneksi langsung ke database arsip
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-border/50 bg-card/60 text-center space-y-1">
              <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" />
              <h3 className="text-xs font-semibold text-foreground">Akses Instan</h3>
              <p className="text-[11px] text-muted-foreground">
                Validasi cepat melalui QR Code & token
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-border/50 bg-card/60 text-center space-y-1">
              <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
              <h3 className="text-xs font-semibold text-foreground">Pencatatan Presisi</h3>
              <p className="text-[11px] text-muted-foreground">
                Data nilai, status, & nomor tercatat detail
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-background/50">
        <p>&copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_INSTITUTION_NAME || "Language Training Center"}. All rights reserved.</p>
      </footer>
    </div>
  );
}
