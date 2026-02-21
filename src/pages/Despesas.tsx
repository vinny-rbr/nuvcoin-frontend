import { useEffect, useMemo, useState } from "react"; // // Hooks do React
import type { FinanceCategory, FinanceItem } from "../types/finance"; // // Tipos do financeiro
import { addFinanceItem, calcFinanceSummary, deleteFinanceItem, loadFinanceItems, makeId, todayISO } from "../lib/financeStorage"; // // Funções do localStorage

export default function Despesas() { // // Página de Despesas
  const [title, setTitle] = useState(""); // // Campo: título/descrição
  const [category, setCategory] = useState<FinanceCategory>("Alimentação"); // // Campo: categoria (default despesa)
  const [amount, setAmount] = useState(""); // // Campo: valor (string, ex: "123,45")
  const [dateISO, setDateISO] = useState(todayISO()); // // Campo: data do lançamento
  const [items, setItems] = useState<FinanceItem[]>([]); // // Lista carregada do storage

  useEffect(() => { // // Ao abrir a tela, carrega dados
    const loaded = loadFinanceItems(); // // Lê do localStorage
    setItems(loaded); // // Seta no estado
  }, []); // // Roda uma vez

  const despesas = useMemo(() => { // // Filtra só despesas pra listar nesta tela
    return items.filter((x) => x.type === "DESPESA"); // // Mantém apenas DESPESA
  }, [items]); // // Recalcula quando items muda

  const summary = useMemo(() => { // // Calcula resumo total (para mostrar na tela)
    return calcFinanceSummary(items); // // Usa helper
  }, [items]); // // Recalcula quando items muda

  function parseAmountToCents(input: string): number { // // Converte "1.234,56" -> 123456
    const normalized = input // // Normaliza string
      .trim() // // Remove espaços
      .replace(/\./g, "") // // Remove separador de milhar
      .replace(",", "."); // // Troca vírgula por ponto
    const value = Number(normalized); // // Converte pra número
    if (Number.isNaN(value) || value <= 0) return 0; // // Valida
    return Math.round(value * 100); // // Centavos
  }

  function formatCentsBRL(cents: number): string { // // Formata centavos em R$ bonitinho
    const value = cents / 100; // // Converte pra reais
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // // Formata BRL
  }

  function onAdd() { // // Ação de adicionar despesa
    const amountCents = parseAmountToCents(amount); // // Converte valor
    if (!title.trim()) return alert("Informe um título."); // // Valida título
    if (amountCents <= 0) return alert("Informe um valor válido."); // // Valida valor

    const newItem: FinanceItem = { // // Monta item
      id: makeId(), // // Id único
      type: "DESPESA", // // Tipo fixo nesta tela
      title: title.trim(), // // Título
      category, // // Categoria selecionada
      amountCents, // // Valor em centavos
      dateISO, // // Data informada
      createdAtISO: new Date().toISOString(), // // Data/hora de criação
    };

    const updated = addFinanceItem(newItem); // // Salva no localStorage e retorna lista atualizada
    setItems(updated); // // Atualiza estado
    setTitle(""); // // Limpa título
    setAmount(""); // // Limpa valor
    setDateISO(todayISO()); // // Volta data pra hoje
  }

  function onDelete(id: string) { // // Ação de remover item
    const ok = confirm("Remover esta despesa?"); // // Confirmação simples
    if (!ok) return; // // Se cancelar, para
    const updated = deleteFinanceItem(id); // // Remove e salva no storage
    setItems(updated); // // Atualiza estado
  }

  return ( // // UI da tela
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}> {/* // Container central */}
      <h1 style={{ marginBottom: 8 }}>Despesas</h1> {/* // Título */}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}> {/* // Cards resumo */}
        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12, minWidth: 200 }}> {/* // Card receitas */}
          <div style={{ opacity: 0.8 }}>Total Receitas</div> {/* // Label */}
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCentsBRL(summary.totalReceitasCents)}</div> {/* // Valor */}
        </div>

        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12, minWidth: 200 }}> {/* // Card despesas */}
          <div style={{ opacity: 0.8 }}>Total Despesas</div> {/* // Label */}
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCentsBRL(summary.totalDespesasCents)}</div> {/* // Valor */}
        </div>

        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12, minWidth: 200 }}> {/* // Card saldo */}
          <div style={{ opacity: 0.8 }}>Saldo</div> {/* // Label */}
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCentsBRL(summary.saldoCents)}</div> {/* // Valor */}
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12, marginBottom: 16 }}> {/* // Box formulário */}
        <h2 style={{ marginTop: 0 }}>Adicionar Despesa</h2> {/* // Subtítulo */}

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 220px 180px 160px" }}> {/* // Grid */}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ex: Aluguel)" /> {/* // Input título */}

          <select value={category} onChange={(e) => setCategory(e.target.value as FinanceCategory)}> {/* // Select categoria */}
            <option>Salário</option>
            <option>Freelance</option>
            <option>Vendas</option>
            <option>Alimentação</option>
            <option>Transporte</option>
            <option>Moradia</option>
            <option>Saúde</option>
            <option>Lazer</option>
            <option>Outros</option>
          </select>

          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor (ex: 250,00)" /> {/* // Input valor */}

          <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} /> {/* // Input data */}
        </div>

        <div style={{ marginTop: 12 }}> {/* // Área botão */}
          <button onClick={onAdd} style={{ padding: "10px 14px", borderRadius: 12, cursor: "pointer" }}> {/* // Botão adicionar */}
            Adicionar Despesa
          </button>
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12 }}> {/* // Box listagem */}
        <h2 style={{ marginTop: 0 }}>Lista de Despesas</h2> {/* // Subtítulo */}

        {despesas.length === 0 ? ( // // Se não tem dados
          <div style={{ opacity: 0.8 }}>Nenhuma despesa cadastrada ainda.</div> // // Texto vazio
        ) : ( // // Se tem dados
          <div style={{ display: "grid", gap: 10 }}> {/* // Lista */}
            {despesas.map((d) => ( // // Renderiza cada item
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 12, border: "1px solid #333", borderRadius: 12 }}> {/* // Card item */}
                <div> {/* // Infos */}
                  <div style={{ fontWeight: 700 }}>{d.title}</div> {/* // Título */}
                  <div style={{ opacity: 0.8 }}>{d.category} • {d.dateISO}</div> {/* // Categoria e data */}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}> {/* // Ações */}
                  <div style={{ fontWeight: 700 }}>{formatCentsBRL(d.amountCents)}</div> {/* // Valor */}
                  <button onClick={() => onDelete(d.id)} style={{ padding: "8px 12px", borderRadius: 12, cursor: "pointer" }}> {/* // Botão remover */}
                    Remover
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

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
// Esta tela cria Despesas com formulário e lista, salvando no localStorage.
// Ela também calcula um resumo (receitas, despesas, saldo) usando calcFinanceSummary.
// amountCents é usado para evitar bug de arredondamento.