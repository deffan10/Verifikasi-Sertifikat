"use client";

import { useEffect, useState, useRef } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Lock, Link2, Image, Upload } from "lucide-react";

export default function SettingsPage() {
  const [contactUrl, setContactUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [logoMsg, setLogoMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setContactUrl(data.contact_url || "");
        setLogoUrl(data.logo_url || "");
      })
      .catch(console.error);
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "contact_url", value: contactUrl }),
      });
      setSettingsMsg("Pengaturan berhasil disimpan");
    } catch {
      setSettingsMsg("Gagal menyimpan");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoMsg("");

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setLogoUrl(data.url);
        setLogoMsg("Logo berhasil diupload");
      } else {
        setLogoMsg(data.error || "Gagal upload logo");
      }
    } catch {
      setLogoMsg("Terjadi kesalahan");
    } finally {
      setUploadingLogo(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru tidak cocok");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg("Password berhasil diubah");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "Gagal mengubah password");
      }
    } catch {
      setPasswordError("Terjadi kesalahan");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan aplikasi</p>
        </div>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo
            </CardTitle>
            <CardDescription>
              Upload logo yang tampil di header halaman verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Logo saat ini"
                  className="h-16 w-auto object-contain border rounded p-1"
                />
                <p className="text-xs text-muted-foreground">Logo saat ini</p>
              </div>
            )}
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                {uploadingLogo ? "Mengupload..." : "Upload Logo Baru"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleUploadLogo}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Format: PNG, JPG, SVG, WEBP. Maks 2MB.
              </p>
            </div>
            {logoMsg && (
              <p className={`text-sm ${logoMsg.includes("berhasil") ? "text-green-600" : "text-red-600"}`}>
                {logoMsg}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link Kontak
            </CardTitle>
            <CardDescription>
              Link &quot;Hubungi Kami&quot; yang tampil di halaman verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL Hubungi Kami</Label>
              <Input
                value={contactUrl}
                onChange={(e) => setContactUrl(e.target.value)}
                placeholder="Contoh: https://wa.me/628123456789 atau mailto:admin@ltc.com"
              />
              <p className="text-xs text-muted-foreground">
                Gunakan wa.me/628xxx untuk WhatsApp atau mailto:email@domain.com untuk email
              </p>
            </div>
            {settingsMsg && (
              <p className="text-sm text-green-600">{settingsMsg}</p>
            )}
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Simpan
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Ganti Password
            </CardTitle>
            <CardDescription>
              Ubah password login admin Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Password Lama</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password Baru</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordMsg && (
                <p className="text-sm text-green-600">{passwordMsg}</p>
              )}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Lock className="h-4 w-4 mr-1" />}
                Ubah Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
