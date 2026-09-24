import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, initials } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/configuracoes")({ component: Config });

function Config() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setEmail(profile.email ?? user?.email ?? "");
      setTelefone(profile.telefone ?? "");
    }
  }, [profile, user?.email]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!nome.trim()) { toast.error("Informe seu nome"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome: nome.trim(), email: email.trim(), telefone: telefone.trim() || null })
        .eq("id", user.id);
      if (error) throw error;

      if (email.trim() && email.trim() !== user.email) {
        const { error: e2 } = await supabase.auth.updateUser({ email: email.trim() });
        if (e2) throw e2;
        toast.message("Confirme seu novo e-mail na caixa de entrada.");
      }

      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadAvatar(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatars/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("anexos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("anexos").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
      if (updErr) throw updErr;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (novaSenha !== confirmaSenha) { toast.error("As senhas não coincidem"); return; }
    setTrocandoSenha(true);
    try {
      if (senhaAtual && user?.email) {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email: user.email, password: senhaAtual });
        if (signErr) { toast.error("Senha atual incorreta"); setTrocandoSenha(false); return; }
      }
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setSenhaAtual(""); setNovaSenha(""); setConfirmaSenha("");
      toast.success("Senha alterada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar senha");
    } finally {
      setTrocandoSenha(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e segurança da conta.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.nome || ""} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
                {initials(profile?.nome, user?.email)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50"
              aria-label="Trocar foto"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(f); e.target.value = ""; }}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold">{profile?.nome || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Trocar foto"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-1">Alterar senha</h3>
        <p className="text-sm text-muted-foreground mb-4">Use uma senha forte com pelo menos 6 caracteres.</p>
        <form onSubmit={handleAlterarSenha} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <Input id="senhaAtual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input id="novaSenha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmaSenha">Confirmar nova senha</Label>
              <Input id="confirmaSenha" type="password" value={confirmaSenha} onChange={(e) => setConfirmaSenha(e.target.value)} placeholder="••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={trocandoSenha}>{trocandoSenha ? "Alterando..." : "Alterar senha"}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-1">Conta</h3>
        <p className="text-sm text-muted-foreground mb-4">Sair desconecta este dispositivo.</p>
        <Button variant="destructive" onClick={async () => { await signOut(); navigate({ to: "/login" }); }}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </Card>
    </div>
  );
}
