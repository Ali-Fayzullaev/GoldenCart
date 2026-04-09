"use client";

import { use, useState, useRef } from "react";
import { User, MapPin, Plus, Pencil, Trash2, Star, Camera, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-profile";
import { useCustomerAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/lib/hooks/use-addresses";
import { useUpload } from "@/lib/hooks/use-upload";
import { toast } from "sonner";
import type { CustomerAddress } from "@/lib/types/database";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: addresses, isLoading: addressesLoading } = useCustomerAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const { upload, uploading } = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [nameInit, setNameInit] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrDefault, setAddrDefault] = useState(false);

  // Init name from profile
  if (profile && !nameInit) {
    setFullName(profile.full_name || "");
    setNameInit(true);
  }

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    try {
      await updateProfile.mutateAsync({ full_name: fullName.trim() });
      toast.success("Имя обновлено");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Максимум 2 МБ");
      return;
    }
    try {
      const url = await upload("logos", "avatars", file);
      await updateProfile.mutateAsync({ avatar_url: url });
      toast.success("Аватар обновлён");
    } catch {
      toast.error("Ошибка загрузки");
    }
  };

  const resetAddrForm = () => {
    setAddrLabel("");
    setAddrAddress("");
    setAddrPhone("");
    setAddrDefault(false);
    setEditingAddress(null);
    setShowAddForm(false);
  };

  const openEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setAddrLabel(addr.label);
    setAddrAddress(addr.address);
    setAddrPhone(addr.phone);
    setAddrDefault(addr.is_default);
    setShowAddForm(true);
  };

  const handleSaveAddress = async () => {
    if (!addrAddress.trim()) {
      toast.error("Введите адрес");
      return;
    }
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          label: addrLabel.trim(),
          address: addrAddress.trim(),
          phone: addrPhone.trim(),
          is_default: addrDefault,
        });
        toast.success("Адрес обновлён");
      } else {
        await createAddress.mutateAsync({
          label: addrLabel.trim() || "Мой адрес",
          address: addrAddress.trim(),
          phone: addrPhone.trim(),
          is_default: addrDefault || !addresses?.length,
        });
        toast.success("Адрес добавлен");
      }
      resetAddrForm();
    } catch {
      toast.error("Ошибка сохранения адреса");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.success("Адрес удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateAddress.mutateAsync({ id, is_default: true });
      toast.success("Адрес по умолчанию обновлён");
    } catch {
      toast.error("Ошибка");
    }
  };

  if (profileLoading || addressesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Войдите в аккаунт</h2>
        <p className="s-muted">Для просмотра профиля необходимо авторизоваться</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Мой профиль</h1>

      {/* Profile info */}
      <div className="s-card rounded-2xl border s-border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 s-muted" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name + email */}
          <div className="flex-1 space-y-3">
            <div>
              <Label>Имя</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше имя"
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={updateProfile.isPending || fullName === profile.full_name}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white hover:opacity-90"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label className="s-muted">Email</Label>
              <p className="text-sm mt-1">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved addresses */}
      <div className="s-card rounded-2xl border s-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Мои адреса
          </h2>
          {!showAddForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetAddrForm(); setShowAddForm(true); }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          )}
        </div>

        {/* Address form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-3 s-card">
            <div>
              <Label>Название</Label>
              <Input
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder="Дом, Работа..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Адрес *</Label>
              <Textarea
                value={addrAddress}
                onChange={(e) => setAddrAddress(e.target.value)}
                placeholder="Город, улица, дом, квартира..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input
                value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="mt-1"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={addrDefault}
                onChange={(e) => setAddrDefault(e.target.checked)}
                className="rounded"
              />
              Адрес по умолчанию
            </label>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAddress}
                disabled={createAddress.isPending || updateAddress.isPending}
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90"
              >
                {(createAddress.isPending || updateAddress.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {editingAddress ? "Обновить" : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={resetAddrForm}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Address list */}
        {!addresses?.length && !showAddForm ? (
          <p className="text-sm s-muted">Нет сохранённых адресов</p>
        ) : (
          <div className="space-y-2">
            {addresses?.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{addr.label || "Адрес"}</span>
                    {addr.is_default && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        По умолчанию
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{addr.address}</p>
                  {addr.phone && (
                    <p className="text-xs s-muted mt-0.5">{addr.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="p-1.5 s-muted hover:text-gray-700 transition-colors"
                      title="Сделать основным"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditAddress(addr)}
                    className="p-1.5 s-muted hover:text-blue-500 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 s-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
