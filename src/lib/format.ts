export const brl = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

export const formatDate = (d?: string | null) => {
  if (!d) return "-";
  const date = new Date(d.includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
};

export const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export const STATUS_IMOVEL = [
  { value: "alugado", label: "Alugado" },
  { value: "vago", label: "Vago" },
  { value: "manutencao", label: "Em manutenção" },
];

export const STATUS_INQUILINO = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "atrasado", label: "Atrasado" },
];

export const STATUS_PAGAMENTO = [
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

export const TIPOS_DESPESA = [
  "Manutenção","Reforma","Pintura","Água","Luz","IPTU",
  "Condomínio","Taxas","Material de construção","Mão de obra","Outros",
];

export const FORMAS_PAGAMENTO = ["Pix","Dinheiro","Transferência","Boleto","Cartão","Outro"];

export const hoje = () => new Date().toISOString().slice(0, 10);

// Vencimento calculado a partir do dia de vencimento do inquilino
export const vencimentoDe = (mes: number, ano: number, dia?: number | null) => {
  const m = Number(mes), a = Number(ano);
  if (!m || !a) return null;
  const ultimo = new Date(a, m, 0).getDate();
  const d = Math.min(Math.max(Number(dia) || 5, 1), ultimo);
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

// Status do pagamento derivado automaticamente
export const statusPagamento = (p: any): "pago" | "atrasado" | "pendente" => {
  if (p?.data_pagamento) return "pago";
  const venc = p?.data_vencimento ?? vencimentoDe(p?.mes, p?.ano, p?.dia_vencimento);
  if (venc && venc < hoje()) return "atrasado";
  return "pendente";
};

// Meses que o inquilino deve pagar: da data de entrada até hoje (ou data de saída)
export const mesesCobranca = (inq: any) => {
  if (!inq?.data_entrada) return [] as { mes: number; ano: number }[];
  const ini = new Date(inq.data_entrada + "T00:00:00");
  const fimBase = inq.data_saida ? new Date(inq.data_saida + "T00:00:00") : new Date();
  const hojeD = new Date();
  const fim = fimBase < hojeD ? fimBase : hojeD;
  const out: { mes: number; ano: number }[] = [];
  let y = ini.getFullYear(), m = ini.getMonth() + 1;
  const yF = fim.getFullYear(), mF = fim.getMonth() + 1;
  while (y < yF || (y === yF && m <= mF)) {
    out.push({ mes: m, ano: y });
    m++; if (m > 12) { m = 1; y++; }
    if (out.length > 600) break;
  }
  return out;
};

const valorDoInquilino = (inq: any) =>
  Number(inq?.imoveis?.valor_aluguel ?? inq?.valor_aluguel ?? 0);

// Cobranças do inquilino = pagamentos lançados + meses esperados ainda sem lançamento
export const cobrancasInquilino = (inq: any, pagamentos: any[] = []) => {
  const doInq = pagamentos.filter((p: any) => p.inquilino_id === inq?.id);
  const virtuais = mesesCobranca(inq)
    .filter(({ mes, ano }) => !doInq.some((p: any) => Number(p.mes) === mes && Number(p.ano) === ano))
    .map(({ mes, ano }) => ({
      id: `virtual-${inq.id}-${ano}-${mes}`,
      virtual: true,
      inquilino_id: inq.id,
      imovel_id: inq.imovel_id,
      inquilinos: { nome: inq.nome },
      imoveis: inq.imoveis ? { nome: inq.imoveis.nome } : null,
      mes, ano,
      valor: valorDoInquilino(inq),
      data_pagamento: null,
      data_vencimento: vencimentoDe(mes, ano, inq.dia_vencimento),
    }));
  return [...doInq, ...virtuais];
};

// Todas as cobranças (lançadas + esperadas) de todos os inquilinos ativos/inativos
export const cobrancasTodas = (inquilinos: any[] = [], pagamentos: any[] = []) => {
  const semInquilino = pagamentos.filter((p: any) => !p.inquilino_id);
  const porInquilino = inquilinos.flatMap((i: any) => cobrancasInquilino(i, pagamentos));
  return [...porInquilino, ...semInquilino];
};

// Status do inquilino: inativo permanece; ativo fica "atrasado" se houver cobrança em atraso
export const statusInquilino = (inq: any, pagamentos: any[] = []) => {
  if (inq?.status === "inativo") return "inativo";
  const atrasado = cobrancasInquilino(inq, pagamentos).some(
    (p: any) => statusPagamento(p) === "atrasado"
  );
  return atrasado ? "atrasado" : "ativo";
};
