# Cronograma de Entregas — Equipe de Macroeconomia (Cepea)

Calendário de entregas hospedado no GitHub Pages, alimentado por uma planilha do Google.

- **Calendário mensal**: clique numa entrega para ver escopo, responsáveis e status.
- **Filtro por produto/projeto**: aparece também a lista de *todas* as entregas programadas dele.
- **Filtro por pessoa** e modo **Lista**.
- O endereço guarda o filtro (ex.: `...#projeto=ippa&mes=2026-12`), então dá para compartilhar uma visão já filtrada.

## 1. Criar a planilha (Google Planilhas)

1. Crie uma planilha nova e renomeie a aba para **Entregas**.
2. **Arquivo → Importar → Upload** → `modelo-planilha.csv` → *Substituir planilha atual*.
3. Troque os exemplos pelos dados reais. Colunas:

| Coluna | O que colocar |
|---|---|
| Produto/Projeto | Nome (igual em todas as linhas do mesmo produto) |
| Tipo | `Produto` ou `Projeto` |
| Data | `dd/mm/aaaa` |
| Entrega | Título da entrega (se vazio, usa o nome do produto) |
| Escopo | O que será entregue |
| Responsáveis | Nomes separados por vírgula: `Felipe, Gabriel` |
| Status | `Planejado`, `Em andamento`, `Entregue` ou `Cancelado` (cancelada some do calendário) |
| Link | (opcional) endereço do relatório |
| Cor | (opcional) cor do produto, ex.: `#2f6fdb`. Sem cor, o site escolhe |

Uma linha por entrega. Entrega com data passada que não esteja `Entregue` aparece como **Atrasado**.
Se alguma linha tiver problema (ex.: data inválida), o site avisa no topo e ignora só aquela linha.

## 2. Publicar a planilha

**Arquivo → Compartilhar → Publicar na web** → escolha a aba **Entregas** e o formato **Valores separados por vírgula (.csv)** → **Publicar** → copie o link.

> Em contas corporativas (Google Workspace), o administrador pode bloquear "Publicar na web". Se a opção não aparecer, fale com a TI.
> Quem tiver o link do CSV consegue ler os dados, como no próprio site. Não coloque informação sigilosa.

## 3. Publicar o site no GitHub Pages (uma vez)

1. Crie um repositório (ex.: `cronograma-macro`) e envie `index.html`, `config.js`, `data.json`, `.nojekyll` e `README.md`.
2. Abra `config.js` e cole o link do CSV em `planilhaCsv`.
3. **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. Em ~1 minuto o site abre em `https://SEU-USUARIO.github.io/cronograma-macro/`.

> No GitHub Pages gratuito o repositório precisa ser **público**.

## Rotina

Atualize só a planilha. O site mostra as mudanças em poucos minutos (o Google atualiza o CSV publicado a cada ~5 min). Não precisa mexer no GitHub.

## Testar no computador

Abrir o `index.html` com duplo clique não funciona. Use:
```bash
python3 -m http.server 8000
```
e abra http://localhost:8000.

## Sem planilha (opcional)

Com `planilhaCsv` vazio em `config.js`, o site usa `data.json` (dados de exemplo, com recorrência e ajustes).
