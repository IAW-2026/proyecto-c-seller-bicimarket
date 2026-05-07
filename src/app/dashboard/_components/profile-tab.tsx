"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSellerProfile, useUpsertSellerProfile, type SellerProfileInput } from "@/hooks/use-seller-profile";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const VERIFICATION_LABEL = {
  pending_review: "Pendiente de revisión",
  verified: "Verificado",
  suspended: "Suspendido",
};

const VERIFICATION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_review: "secondary",
  verified: "default",
  suspended: "destructive",
};

const EMPTY: SellerProfileInput = {
  legal_name: "",
  display_name: "",
  tax_id: "",
  tax_condition: "monotributo",
  bank_account_reference: "",
  pickup_address: {
    street: "",
    number: "",
    city: "",
    province: "",
    postal_code: "",
    country: "AR",
  },
};

export function ProfileTab({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data: profile, isLoading } = useSellerProfile();
  const upsert = useUpsertSellerProfile();
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState<SellerProfileInput>(EMPTY);

  useEffect(() => {
    if (profile) {
      setForm({
        legal_name: profile.legal_name,
        display_name: profile.display_name,
        tax_id: profile.tax_id,
        tax_condition: profile.tax_condition,
        bank_account_reference: profile.bank_account_reference,
        pickup_address: { ...profile.pickup_address },
      });
    }
  }, [profile]);

  function setTop<K extends keyof SellerProfileInput>(k: K, v: SellerProfileInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setAddr(k: keyof SellerProfileInput["pickup_address"], v: string) {
    setForm((f) => ({ ...f, pickup_address: { ...f.pickup_address, [k]: v } }));
  }

  async function handleVerify(status: "verified" | "pending_review" | "suspended") {
    if (!profile) return;
    setVerifying(true);
    try {
      await api.patch(`/v1/admin/seller-profiles/${profile.id}/verification`, { status });
      await queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      toast.success(`Estado actualizado a: ${VERIFICATION_LABEL[status]}`);
    } catch {
      toast.error("No se pudo actualizar el estado");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSave() {
    const { legal_name, display_name, tax_id, bank_account_reference, pickup_address } = form;
    if (!legal_name || !display_name || !tax_id || !bank_account_reference) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }
    if (!pickup_address.street || !pickup_address.city || !pickup_address.province) {
      toast.error("Completá la dirección de retiro");
      return;
    }
    try {
      await upsert.mutateAsync(form);
      toast.success(profile ? "Perfil actualizado" : "Perfil creado — quedará pendiente de verificación");
    } catch {
      toast.error("No se pudo guardar el perfil");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando perfil…</p>;

  return (
    <div className="space-y-6 max-w-xl">
      {profile && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Estado de verificación:</span>
          <Badge variant={VERIFICATION_VARIANT[profile.verification_status]}>
            {VERIFICATION_LABEL[profile.verification_status]}
          </Badge>
          {isAdmin && (
            <>
              {profile.verification_status !== "verified" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerify("verified")}
                  disabled={verifying}
                >
                  Verificar
                </Button>
              )}
              {profile.verification_status !== "pending_review" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerify("pending_review")}
                  disabled={verifying}
                >
                  Pasar a pendiente
                </Button>
              )}
              {profile.verification_status !== "suspended" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleVerify("suspended")}
                  disabled={verifying}
                >
                  Suspender
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {!profile && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>Completá tu perfil de vendedor para poder publicar productos.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos fiscales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Razón social *</Label>
              <Input
                value={form.legal_name}
                onChange={(e) => setTop("legal_name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Nombre público *</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setTop("display_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>CUIT / CUIL *</Label>
              <Input
                value={form.tax_id}
                onChange={(e) => setTop("tax_id", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Condición fiscal</Label>
              <Select
                value={form.tax_condition}
                onValueChange={(v) =>
                  setTop("tax_condition", v as SellerProfileInput["tax_condition"])
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monotributo">Monotributo</SelectItem>
                  <SelectItem value="responsable_inscripto">Responsable inscripto</SelectItem>
                  <SelectItem value="consumidor_final">Consumidor final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>CBU / Alias bancario *</Label>
            <Input
              value={form.bank_account_reference}
              onChange={(e) => setTop("bank_account_reference", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dirección de retiro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Calle *</Label>
              <Input
                value={form.pickup_address.street}
                onChange={(e) => setAddr("street", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Número</Label>
              <Input
                value={form.pickup_address.number}
                onChange={(e) => setAddr("number", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ciudad *</Label>
              <Input
                value={form.pickup_address.city}
                onChange={(e) => setAddr("city", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Provincia *</Label>
              <Input
                value={form.pickup_address.province}
                onChange={(e) => setAddr("province", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Código postal</Label>
              <Input
                value={form.pickup_address.postal_code}
                onChange={(e) => setAddr("postal_code", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>País</Label>
              <Input
                value={form.pickup_address.country}
                onChange={(e) => setAddr("country", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
        {profile ? "Guardar cambios" : "Crear perfil de vendedor"}
      </Button>
    </div>
  );
}
