# Manual e Estrutura da Aplicação - Camis

Este documento apresenta um mapeamento completo e o detalhamento técnico e funcional da aplicação **Camis**, descrevendo sua stack de desenvolvimento, arquitetura, módulos e a estrutura de dados identificada.

---

## 1. Stack Tecnológica e Arquitetura

A aplicação utiliza uma arquitetura moderna baseada em **Server-Side Rendering (SSR)** e **Jamstack**, utilizando o Nuxt.js como framework principal integrado ao ecossistema do Supabase.

### 1.1 Frontend
- **Framework Principal:** [Nuxt 4](https://nuxt.com/) (`nuxt ^4.5.2`) operando sobre o [Vue 3](https://vuejs.org/) (`vue ^3.5.42`).
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (`@nuxtjs/tailwindcss`) para estilização rápida e utilitária.
- **Roteamento:** Vue Router integrado nativamente através do Nuxt.
- **Gráficos e Dashboards:** [Chart.js](https://www.chartjs.org/) juntamente com `vue-chartjs`.
- **Ícones:** `lucide-vue-next` para uma biblioteca de ícones consistentes.
- **Outras Ferramentas:**
  - `html5-qrcode`: Para escaneamento de QRCodes ou Códigos de barra.
  - `browser-image-compression`: Para compactação de imagens no lado do cliente (upload otimizado).

### 1.2 Backend e Banco de Dados (BaaS)
A aplicação adota um modelo *Backend-as-a-Service (BaaS)*, terceirizando o banco de dados e a autenticação.
- **Plataforma:** [Supabase](https://supabase.com/) (`@nuxtjs/supabase`).
- **Banco de Dados:** PostgreSQL (nativo do Supabase).
- **Autenticação:** Supabase Auth (Suporte a Email/Senha, OAuth, Password Reset).
- **APIs / Endpoints:** A comunicação com o banco de dados é majoritariamente feita pela API RESTful gerada automaticamente pelo Supabase (PostgREST) usando o cliente do Supabase diretamente nos arquivos Vue.
- **Realtime / WebSockets:** Utilização de `supabase.channel` (ex: canal `trade-updates`) para atualizações em tempo real nas trocas (Trades).
- **Serverless APIs:** O Nuxt possui diretórios backend (`server/api`), onde lógicas customizadas (ex: `server/api/trade/complete.post.ts`) são processadas isoladamente do frontend.

---

## 2. Estrutura de Diretórios e Componentes

A estrutura de código segue o padrão de roteamento baseado em arquivos (file-system routing) do Nuxt:

### 2.1 Páginas Principais (`app/pages`)

#### Autenticação e Acesso
- **`/login` (`login.vue`):** Tela de entrada. Lida com Login (Email/Senha, OAuth), Registro e Recuperação de Senha (`resetPasswordForEmail`).
- **`/update-password` (`update-password.vue`):** Tela para atualização e redefinição de senha para usuários autenticados.

#### Visão Geral e Perfil
- **`/` (`index.vue`):** Página inicial da aplicação, possivelmente uma landing page ou feed introdutório.
- **`/dashboard` (`dashboard.vue`):** Painel gerencial, responsável pela exibição de métricas e gráficos usando o Chart.js.
- **`/perfil` (`perfil/index.vue`):** Visualização dos dados do usuário logado.
- **`/perfil/editar` (`perfil/editar.vue`):** Formulário para alteração de dados pessoais (nome, cidade, estado, telefone, foto de perfil) no banco de dados.

#### Módulo de Estoque (Gestão de Itens)
- **`/estoque` (`estoque.vue`):** O core da gestão pessoal.
  - Permite visualizar itens cadastrados (`products` e `inventory_entries`).
  - Funções para exclusão de entradas e marcação de itens favoritos (`favorite_level`) ou usados (`is_used`).

#### Módulo de Trade (Trocas)
- **`/trade` (`trade.vue`):** Gerenciador de requisições de trocas ativas. Inclui atualizações realtime (`trade-updates`).
- **`/trade-search` (`trade-search.vue`):** Área para buscar usuários ou itens para iniciar uma nova proposta de troca (`trade_requests`).
- **`/historico-trade` (`historico-trade.vue`):** Registro de trocas passadas (concluídas, recusadas ou canceladas).

#### Módulo de Shopping
- **`/shopping` (`shopping.vue`):** Vitrine ou catálogo da aplicação. Apresenta itens categorizados (`shopping_categories`) e os produtos para visualização (`shopping_products`).

#### Módulo Administrativo (Área Restrita)
- **`/admin` (`admin/index.vue`):** Dashboard administrativo principal.
- **`/admin/shopping` (`admin/shopping.vue`):** Gerenciamento do catálogo do shopping (Adição, edição e exclusão de categorias e produtos da vitrine).

#### Outros
- **`/contatos` (`contatos.vue`):** Página de informações de contato ou suporte.

### 2.2 Componentes Modulares (`app/components`)
Fragmentos de UI reutilizáveis, principalmente modais para as telas principais:
- **`ProductFormModal.vue`:** Formulário para adicionar ou editar itens do estoque.
- **`TradeFormModal.vue` / `TradeCompleteModal.vue`:** Janelas sobrepostas para enviar, visualizar ou concluir uma negociação/troca.
- **`AdminProductModal.vue` / `AdminCategoryModal.vue`:** Modais exclusivos para o gestor popular o catálogo do `/shopping`.
- **`SidebarOfferCarousel.vue`:** Carrossel de ofertas, possivelmente para exibição no dashboard ou shopping.
- **`CustomSelect.vue` & `AppDialog.vue`:** Componentes de interface genéricos (selects customizados e janelas de diálogo).

---

## 3. Estrutura de Banco de Dados (Supabase / PostgreSQL)

Com base nas chamadas REST realizadas no frontend, a modelagem de dados da aplicação Camis é estruturada através das seguintes tabelas:

1. **`profiles`**
   - **Descrição:** Tabela estendida de usuários.
   - **Campos Principais:** `id` (relacionado à auth do Supabase), `name`, `city`, `state`, `phone`, dados de avatar.
2. **`products`**
   - **Descrição:** O catálogo mestre de produtos disponíveis ou cadastrados na plataforma.
   - **Campos Principais:** `id`, `name`, `brand`, `favorite_level`, `is_used`.
3. **`inventory_entries`**
   - **Descrição:** Relação de estoque de um usuário específico em relação a um produto.
   - **Campos Principais:** `id`, `product_id` (FK para `products`), dados de quantidade, datas.
4. **`trade_requests`**
   - **Descrição:** Central de transações de troca entre usuários.
   - **Campos Principais:** `id`, identificadores das partes envolvidas (remetente/destinatário), status da troca (Pendente, Aceito, Recusado).
5. **`shopping_categories`**
   - **Descrição:** Categorias dos produtos apresentados na aba de shopping.
6. **`shopping_products`**
   - **Descrição:** Os itens exibidos efetivamente na área pública de Shopping.

---

## 4. Análise de Segurança e Próximos Passos (Polimento)

Já que a aplicação está em sua reta final e um dos seus objetivos é a **segurança de dados**, aqui estão pontos de atenção sugeridos para a próxima fase:

### 4.1 Row Level Security (RLS) do Supabase
Como o frontend consome diretamente os dados do Supabase (padrão BaaS), **a segurança não é feita nas rotas do Nuxt, mas diretamente no banco usando RLS (Row Level Security)**.
- **Ação Recomendada:** Revisar no painel do Supabase se tabelas como `inventory_entries` e `trade_requests` possuem políticas do tipo: `auth.uid() = user_id`. Isso impede que o "Usuário A" apague ou edite o estoque do "Usuário B" usando ferramentas de rede do navegador.

### 4.2 Autorização Administrativa (`/admin`)
- **Ação Recomendada:** Garantir que rotas sob `/admin` contenham *middlewares* no Nuxt verificando não apenas se o usuário está logado, mas se o `perfil` dele o classifica como **"Administrador"**.
- As rotas de inserção no banco de dados para `shopping_products` também devem estar protegidas no Supabase RLS para permitir `INSERT`/`UPDATE` apenas para administradores.

### 4.3 Tratamento de Erros e Validação
- **Ação Recomendada:** Verificar os formulários (ex: `ProductFormModal.vue` e `TradeFormModal.vue`). Garantir que os inputs estão limitados no cliente (HTML5/Tailwind) e que o banco de dados recuse dados excessivos ou incorretos.

### 4.4 Proteção de Autenticação
- Como o redirecionamento global do Supabase está desativado (`redirect: false` no `nuxt.config.ts`), certifique-se de que cada página que necessita de login possui a macro `definePageMeta({ middleware: 'auth' })` ativada.
