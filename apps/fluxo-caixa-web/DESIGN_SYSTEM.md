# Design System — Agro Gestão

Guia de referência para gerar/editar UI do app web **Agro Gestão** (gestão financeira rural para produtores e contadores). Siga estes tokens e convenções para manter consistência visual. Baseado no que está implementado em `src/App.css` (escopo `.publica`) e nas telas públicas/dashboard.

> **Fonte da verdade:** os tokens vivem em `src/App.css` como variáveis CSS com prefixo `--ag-*`, dentro do seletor `.publica`. Qualquer tela nova deve usar essas variáveis, **nunca cores/medidas hardcoded novas**.

---

## 1. Princípios

- **Estética:** SaaS corporativo moderno com calor "agro" — verde cultivado + âmbar de terra, superfícies claras, cantos arredondados moderados, sombras suaves em tom slate.
- **Honestidade de dados (regra crítica):** NÃO invente números, métricas, selos ou textos que o backend não fornece (ex.: "+14,2% vs safra anterior", "22 NFs pagas", "Meta 38%", "ROI OK", nomes de clientes/bancos). Use apenas dados reais ou rótulos neutros/descritivos. Quando um valor não existe, mostre um texto de ajuda ("Registre uma receita para calcular") em vez de inventar.
- **Acessibilidade:** respeite contraste, `aria-label` em ícones/botões sem texto, foco visível, e `prefers-reduced-motion` para animações.
- **Idioma:** português do Brasil. Nomes de classes/variáveis em português quando possível (ex.: `--ag-campo`, `.ag-dash-*`).

---

## 2. Cores (tokens `--ag-*`)

Material Design 3, derivada do verde `#3b7b00`.

### Superfícies
| Token | Hex | Uso |
|---|---|---|
| `--ag-surface` | `#faf8ff` | Fundo geral de página |
| `--ag-surface-lowest` | `#ffffff` | Cards, superfícies elevadas (branco) |
| `--ag-surface-low` | `#f0f9e9` | **Verde claro** — só áreas decorativas (seções alternadas da landing, painel institucional). NÃO usar em inputs/rodapés |
| `--ag-surface-container` | `#eaedff` | Chips/badges suaves |
| `--ag-surface-high` | `#e2e7ff` | Bordas internas, divisórias, fundo de ícone |
| `--ag-surface-highest` | `#dae2fd` | Superfície mais alta |
| `--ag-campo` | `#f1f5f9` | **Neutro** para campos de formulário, inputs, rodapés, superfícies de UI de dados |

### Marca
| Token | Hex | Uso |
|---|---|---|
| `--ag-primary` | `#3b7b00` | Cor primária (botões, links, destaques, ícones de marca) |
| `--ag-primary-container` | `#2f6300` | Hover do primário (tom mais escuro) |
| `--ag-on-primary` | `#ffffff` | Texto/ícone sobre o primário |
| `--ag-primary-strong` | `#1e4a00` | Seções escuras de destaque (CTA full-bleed, rodapé) |
| `--ag-primary-fixed` | `#7ffc97` | Verde claro de realce sobre fundos escuros |
| `--ag-tertiary` | `#006b2f` | Verde terciário (uso pontual) |

### Secundária (âmbar / terra)
| Token | Hex | Uso |
|---|---|---|
| `--ag-secondary` | `#904d00` | Despesas, alertas suaves, texto âmbar |
| `--ag-secondary-container` | `#fe932c` | Laranja de container |
| `--ag-secondary-fixed` | `#ffdcc3` | Fundo de badge/ícone âmbar |
| `--ag-on-secondary-fixed` | `#2f1500` | Texto sobre `secondary-fixed` |

### Texto, linhas, estados
| Token | Hex | Uso |
|---|---|---|
| `--ag-on-surface` | `#131b2e` | Texto principal (quase preto azulado) |
| `--ag-on-surface-variant` | `#3e4a3d` | Texto secundário / descrições |
| `--ag-outline` | `#6e7b6c` | Placeholder, linhas fortes |
| `--ag-outline-variant` | `#bdcaba` | Bordas sutis |
| `--ag-error` | `#ba1a1a` | Erros, ações destrutivas |

### Convenções de cor semântica
- **Receita / positivo / sucesso:** `--ag-primary` (verde).
- **Despesa / pendência / atenção:** `--ag-secondary` (âmbar). Não usar vermelho para despesa — vermelho (`--ag-error`) é só erro/destruição.
- **Saldo/linha de acumulado em gráfico:** teal `#0f766e` (único literal permitido para a série "Saldo Acumulado").
- Fundos de card são sempre **brancos** (`--ag-surface-lowest`); não pinte cards de verde. Diferencie estados com barrinha lateral, badge ou texto colorido, não com fundo.

---

## 3. Tipografia

- **Família:** `Inter` (carregada via Google Fonts em `src/index.css`). Fallback: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Números/moeda:** `font-feature-settings: "tnum" 1` (figuras tabulares) — já aplicado no escopo `.publica`.
- **Tracking:** títulos usam `letter-spacing: -0.01em a -0.03em` (negativo). Eyebrows/labels usam `letter-spacing` positivo (`0.06–0.08em`) + `text-transform: uppercase`.

### Escala
| Papel | Tamanho | Peso | Observações |
|---|---|---|---|
| Display / H1 de página | `clamp(1.5rem, 3.2vw, 2rem)` | 700 | `letter-spacing: -0.02em` |
| H2 de seção | `clamp(1.75rem, 3.4vw, 2.25rem)` | 700 | landing |
| Título de card (H3) | `1.05–1.35rem` | 600 | |
| Valor/métrica (KPI) | `clamp(1.6rem, 2.8vw, 2rem)` | 700 | `letter-spacing: -0.03em`; prefixo "R$" menor (`0.9rem`, peso 600, cor variant) |
| Body | `0.875–1rem` | 400 | `line-height: 1.5–1.6` |
| Label / descrição | `0.72–0.85rem` | 500–600 | cor `--ag-on-surface-variant` |
| Eyebrow | `0.68–0.75rem` | 600 | UPPERCASE, `letter-spacing: 0.06–0.08em`, cor variant; parte destacada em `--ag-primary` |

---

## 4. Formas e espaçamento

### Raios (tokens)
| Token | Valor | Uso |
|---|---|---|
| `--ag-radius` | `0.5rem` | pequeno (tags, selos) |
| `--ag-radius-lg` | `0.75rem` | botões, inputs, controles |
| `--ag-radius-xl` | `1rem` | cards internos, chips |
| `--ag-radius-2xl` | `1.5rem` | cards principais, modais, painéis |
| `--ag-radius-full` | `9999px` | pílulas, badges, avatares |

### Espaçamento
- Base de 8px. Padding de card principal: `20–32px`. Gap entre cards: `16–24px`.
- Largura máxima de conteúdo: `--ag-largura: 1200px`.

---

## 5. Elevação (sombras, tom slate `rgb(15 23 42 / …)`)

| Token | Uso |
|---|---|
| `--ag-shadow-sm` | realce mínimo (chips, badges) |
| `--ag-shadow-1` | cards em repouso |
| `--ag-shadow-2` | card em hover, dropdowns |
| `--ag-shadow-3` | modais, drawers |
| `--ag-shadow-xl` | destaque forte (mockups, card de login) |

Prefira **borda hairline** (`1px solid var(--ag-outline-variant)` ou `--ag-surface-high`) + sombra leve, em vez de sombras pesadas.

---

## 6. Ícones

- **Material Symbols Outlined** (webfont, carregada em `src/index.css`).
- Uso: `<span class="material-symbols-outlined">nome_do_icone</span>`. Tamanho via `font-size`.
- Ícones de marca (WhatsApp, Instagram) usam SVG inline do [Simple Icons](https://simpleicons.org) (CC0), com `fill="currentColor"`.
- A marca Agro Gestão usa o ícone `eco` dentro de um quadrado verde (componente `MarcaAgro`).

Exemplos usados: `eco` (marca), `agriculture`, `payments`/`finance_mode`, `account_balance_wallet`, `local_shipping`, `calculate`, `receipt_long`, `stacked_line_chart`, `trending_up`/`trending_down`, `check_circle`, `search`, `notifications`, `logout`.

---

## 7. Componentes

### Botões
- **Primário:** fundo `--ag-primary`, texto `--ag-on-primary`, raio `--ag-radius-lg`, `min-height ~44–48px`, sombra `0 8px 20px rgb(59 123 0 / 0.2)`. Hover: `--ag-primary-container` + leve `translateY(-1px/-2px)`.
- **Claro/secundário:** fundo branco, borda `--ag-outline-variant`, texto `--ag-on-surface`; hover vira texto `--ag-primary`.
- **Contorno claro (sobre fundo escuro):** fundo `rgb(255 255 255 / 0.08)`, borda branca translúcida.
- **Fantasma/ícone:** sem fundo, hover com `--ag-surface-high`.

### Inputs / campos
- Fundo `--ag-campo` (neutro), raio `--ag-radius-lg`, ícone à esquerda em `--ag-on-surface-variant`.
- Foco: fundo branco + `box-shadow: 0 0 0 3px rgb(59 123 0 / 0.15)` + borda `--ag-primary`.

### Cards
- Fundo `--ag-surface-lowest` (branco), raio `--ag-radius-xl`/`2xl`, borda hairline + `--ag-shadow-1`. Hover: `--ag-shadow-2` + `translateY(-3px)`.

### Chips / badges
- Pílula (`--ag-radius-full`), `font-size 0.65–0.72rem`, peso 600.
- Verde: fundo `--ag-surface-container`, texto `--ag-primary`. Âmbar: fundo `--ag-secondary-fixed`, texto `--ag-secondary`. Neutro: fundo `--ag-campo`, texto variant.

### Tabelas / linhas de dados
- Cabeçalho com `font-size 0.72rem`, uppercase leve, cor variant, borda inferior `--ag-surface-high`.
- Linhas separadas por hairline; hover em `--ag-surface-low`/`--ag-campo`.

### Navegação (underline animado)
- Links de menu com sublinhado que cresce da esquerda no hover (`transform: scaleX`); item ativo com sublinhado fixo + cor `--ag-primary`.

### Modal
- Fundo `rgb(15 23 42 / 0.45)` + blur leve; card branco, raio `--ag-radius-2xl`, `--ag-shadow-3`; animação de entrada/saída suave; respeita `prefers-reduced-motion`; fecha com Esc / clique no fundo; trap de foco.

### Shell do dashboard (telas internas)
- **Sidebar** fixa (272px): marca + seletor de propriedade + nav; borda-direita hairline `rgb(15 23 42 / 0.06)` + sombra lateral difusa.
- **Header** fixo: busca, ícones (app, sino de notificações), bloco de usuário.
- Reutilizável via componente `ShellDashboard` (`src/componentes/ShellDashboard.jsx`), props `{ sessao, ativo, children }`.

---

## 8. Movimento
- Transições de 160–260ms, ease suave (`cubic-bezier(0.16, 1, 0.3, 1)` para entradas).
- Sempre encerrar/encurtar animações em `@media (prefers-reduced-motion: reduce)`.

---

## 9. Como aplicar numa tela nova
1. Envolver a raiz da tela com a classe `publica` (ou importar `src/App.css`) para herdar os tokens `--ag-*`, a fonte Inter e os Material Symbols.
2. Usar classes semânticas com prefixo de contexto (ex.: `.ag-fin-*` para financeiro, `.ag-dash-*` para dashboard, `.ag-login-*` para auth) e sempre `var(--ag-*)` para cores/raios/sombras.
3. Não hardcodar hex novos. Se precisar de uma cor que não existe, prefira compor com os tokens existentes ou proponha um novo token em `App.css`.
4. Ícones via Material Symbols; dados sempre reais (ver regra de honestidade na seção 1).
