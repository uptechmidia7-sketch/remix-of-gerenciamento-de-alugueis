import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl, formatDate, MESES, statusPagamento, statusInquilino, cobrancasTodas } from "@/lib/format";
import {
  Home, Users, Wallet, TrendingUp, TrendingDown, AlertCircle,
  Clock, CheckCircle2, Building2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const { data } = useQuery({
    queryKey: ["dashboard", ano],
    queryFn: async () => {
      const [imoveis, pagamentos, despesas, inquilinos] = await Promise.all([
        supabase.from("imoveis").select("*"),
        supabase.from("pagamentos").select("*, imoveis(nome), inquilinos(nome)").eq("ano", ano),
        supabase.from("despesas").select("*").eq("ano", ano),
        supabase.from("inquilinos").select("id,nome,imovel_id,status,data_entrada,data_saida,dia_vencimento,valor_aluguel,imoveis(nome,valor_aluguel)"),
      ]);
      return {
        imoveis: imoveis.data ?? [],
        pagamentos: pagamentos.data ?? [],
        despesas: despesas.data ?? [],
        inquilinos: inquilinos.data ?? [],
      };
    },
  });

  const imoveis = data?.imoveis ?? [];
  const pagamentos = data?.pagamentos ?? [];
  const despesas = data?.despesas ?? [];

  const inquilinos = data?.inquilinos ?? [];
  const st = (p: any) => statusPagamento(p);
  // inclui meses esperados (a partir da data de entrada) ainda sem lançamento
  const cobrancas = cobrancasTodas(inquilinos, pagamentos).filter((p: any) => Number(p.ano) === ano);

  const pagosMes = pagamentos.filter((p: any) => p.mes === mes && st(p) === "pago");
  const despesasMes = despesas.filter((d: any) => d.mes === mes);
  const totalRecebido = pagosMes.reduce((s: number, p: any) => s + Number(p.valor), 0);
  const totalDespesas = despesasMes.reduce((s: number, d: any) => s + Number(d.valor), 0);
  const lucroLiquido = totalRecebido - totalDespesas;

  const alugados = imoveis.filter((i: any) => i.status === "alugado").length;
  const vagos = imoveis.filter((i: any) => i.status === "vago").length;
  const pendentes = cobrancas.filter((p: any) => st(p) === "pendente").length;
  const atrasados = cobrancas.filter((p: any) => st(p) === "atrasado").length;

  const inquilinosAtraso = inquilinos.filter(
    (i: any) => statusInquilino(i, pagamentos) === "atrasado"
  ).length;

  const chartData = MESES.map((m, idx) => {
    const i = idx + 1;
    const r = pagamentos.filter((p: any) => p.mes === i && st(p) === "pago")
      .reduce((s: number, p: any) => s + Number(p.valor), 0);
    const d = despesas.filter((x: any) => x.mes === i).reduce((s: number, x: any) => s + Number(x.valor), 0);
    return { mes: m.slice(0, 3), Receita: r, Despesas: d, Lucro: r - d };
  });

  const proximosVencimentos = cobrancas
    .filter((p: any) => st(p) === "pendente" && p.data_vencimento)
    .sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento))
    .slice(0, 5);

  const aluguelAtrasados = cobrancas
    .filter((p: any) => st(p) === "atrasado")
    .sort((a: any, b: any) => (a.data_vencimento ?? "").localeCompare(b.data_vencimento ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{MESES[mes - 1]} de {ano}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Recebido no mês" value={brl(totalRecebido)} tone="success" />
        <StatCard icon={TrendingDown} label="Despesas do mês" value={brl(totalDespesas)} tone="destructive" />
        <StatCard icon={Wallet} label="Lucro líquido" value={brl(lucroLiquido)} tone={lucroLiquido >= 0 ? "primary" : "destructive"} />
        <StatCard icon={Building2} label="Imóveis" value={String(imoveis.length)} />
        <StatCard icon={Home} label="Alugados" value={String(alugados)} tone="success" />
        <StatCard icon={Home} label="Vagos" value={String(vagos)} tone="warning" />
        <StatCard icon={Clock} label="Pagamentos pendentes" value={String(pendentes)} tone="warning" />
        <StatCard icon={AlertCircle} label="Pagamentos atrasados" value={String(atrasados)} tone="destructive" />
        <StatCard icon={Users} label="Inquilinos em atraso" value={String(inquilinosAtraso)} tone={inquilinosAtraso > 0 ? "destructive" : "success"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Receita x Despesas ({ano})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: any) => brl(v)} />
                <Legend />
                <Bar dataKey="Receita" fill="var(--color-success)" />
                <Bar dataKey="Despesas" fill="var(--color-destructive)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Lucro líquido por mês</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: any) => brl(v)} />
                <Line type="monotone" dataKey="Lucro" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Próximos vencimentos</h3>
          {proximosVencimentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vencimento pendente.</p>
          ) : (
            <ul className="space-y-2">
              {proximosVencimentos.map((p: any) => (
                <li key={p.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{p.imoveis?.nome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.inquilinos?.nome ?? "—"} • Vence em {formatDate(p.data_vencimento)}</p>
                  </div>
                  <span className="font-semibold">{brl(p.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive"><AlertCircle className="w-4 h-4" /> Aluguéis atrasados</h3>
          {aluguelAtrasados.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> Tudo em dia!</p>
          ) : (
            <ul className="space-y-2">
              {aluguelAtrasados.map((p: any) => (
                <li key={p.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{p.imoveis?.nome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.inquilinos?.nome ?? "—"}</p>
                  </div>
                  <Badge variant="destructive">{brl(p.valor)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: any; label: string; value: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[tone ?? "primary"];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg md:text-xl font-bold mt-1 truncate">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${toneClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
