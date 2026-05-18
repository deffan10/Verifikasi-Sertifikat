"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, QrCode, LogIn } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoImage />
            <div>
              <h1 className="text-lg font-bold text-primary">
                {process.env.NEXT_PUBLIC_APP_NAME || "Verifikasi Dokumen"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {process.env.NEXT_PUBLIC_INSTITUTION_NAME || "Sistem Verifikasi"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/admin/login">
              <Button variant="ghost" size="icon" title="Admin Login">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Hero */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Verifikasi Dokumen
            </h2>
            <p className="text-lg text-muted-foreground">
              Masukkan nomor dokumen atau scan QR Code untuk memverifikasi
              keaslian dokumen akademik dan sertifikasi.
            </p>
          </div>

          {/* Search Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Search className="h-5 w-5" />
                Verifikasi Dokumen
              </CardTitle>
              <CardDescription>
                Masukkan nomor dokumen, nomor sertifikat, atau token verifikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="flex gap-2">
                <Input
                  placeholder="Contoh: IJZ-2025-0001 atau SERT-2025-0001"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Memverifikasi..." : "Verifikasi"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* QR Info */}
          <Card className="bg-blue-50/50 dark:bg-slate-800/50 border-blue-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <QrCode className="h-12 w-12 text-primary shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold">Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Anda juga dapat memverifikasi dokumen dengan men-scan QR Code
                    yang terdapat pada dokumen asli.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <div className="p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Aman & Terpercaya</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Sistem verifikasi resmi
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
              <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">QR Code</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Verifikasi cepat via QR
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
              <Search className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Real-time</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Hasil verifikasi instan
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_INSTITUTION_NAME || "Universitas"}. All rights reserved.</p>
      </footer>
    </div>
  );
}
