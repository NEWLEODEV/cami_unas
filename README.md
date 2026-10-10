# Universo CAMIS (Cami Unhas) 💅✨

[![Nuxt 3](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

Bem-vindo ao repositório do **Universo CAMIS**, uma plataforma web encantadora, moderna e completa criada especialmente para amantes do universo das unhas e beleza, com foco na organização pessoal de esmaltes, gestão de validade, vitrine de recomendações e comunidade de trocas e desapegos.

---

## 🌟 Sobre a Aplicação

Sabe quando você tem tantos esmaltes e cosméticos guardados que acaba esquecendo o que tem, compra cores repetidas ou deixa produtos caros vencerem no fundo da gaveta? 

O **Universo CAMIS** foi desenhado para resolver exatamente isso:
- **Área Pública:** Qualquer visitante pode conhecer a plataforma, navegar pela vitrine do **Shopping** com os melhores achadinhos recomendados e conferir conteúdos e redes sociais.
- **Área Privada (Usuário):** Ao se autenticar, a usuária tem acesso ao seu acervo pessoal (**Minha Coleção**), painel analítico (**Dashboard**) e central de negociações (**Trade**).
- **Área Administrativa:** Gestão da vitrine de produtos recomendados, categorização e acompanhamento de métricas de cliques em links de afiliados.

---

## 🚀 Principais Módulos e Funcionalidades

### 📦 Minha Coleção (Acervo Pessoal)
O núcleo de organização do acervo:
- **Cadastro Completo:** Registro de fotos, nome, marca, cor, acabamento, coleção, volume/variação, preço pago e quantidade.
- **Controle de Validade:** Registro de data de compra e data de validade com avisos visuais.
- **Status de Uso:** Marcação de itens já testados ou ainda lacrados/não usados.
- **Classificação Afetiva:** Níveis de favoritismo com corações (*Gostei ❤️, Adorei ❤️❤️, Super Amei ❤️❤️❤️*).
- **Visualização Flexível:** Alternância entre modos Grade Média, Grade Grande e Tabela de Detalhes, com busca instantânea e filtros por marca e coleção.

---

### 📊 Dashboard Inteligente
Painel limpo, ágil e visual para acompanhar o status geral da coleção:
- **Métricas em Tempo Real:** Total de itens no acervo e valor financeiro estimado acumulado.
- **Alerta de Validade Próxima:** Card em destaque no topo sinalizando itens próximos de vencer (dentro de 30 dias) ou já vencidos, prevenindo desperdício.
- **Coleção de Favoritos:** Vitrines rápidas com produtos classificados por nível de preferência.
- **Últimas Entradas:** Histórico recente dos itens adicionados ao acervo.
- **Top Marcas:** Ranking visual das marcas mais presentes na coleção.

---

### 🔄 Trade (Mural de Trocas & Desapegos)
Um espaço colaborativo para fazer a coleção girar e evitar produtos parados:
- **Disponibilizar para Negociação:** Usuárias podem selecionar itens da sua coleção e disponibilizá-los com intenção de troca, venda ou doação, especificando estado e valor.
- **Explorar Desapegos:** Visualização de itens colocados para troca por outras pessoas da comunidade.
- **Gerenciamento de Solicitações:** Controle de propostas enviadas e recebidas com status pendente, aceito ou concluído.
- **Contato Facilitado:** Conexão direta com os interessados via WhatsApp para combinar envio ou entrega.

---

### 🛍️ Shopping (Vitrine de Achadinhos)
- Catálogo público de produtos e esmaltes testados e aprovados pela Camila.
- Filtros rápidos por categorias (Bases, Finalizadores, Cuidados, etc.) e destaques em oferta.
- Redirecionamento com rastreamento seguro de tráfego para programas de afiliados.

---

### 📱 Experiência Mobile First
Totalmente otimizado para uso em smartphones:
- **Header Fixo (Sticky):** Logo e perfil do usuário sempre acessíveis sem sumir com a rolagem.
- **Bottom Navigation Bar:** Barra inferior fixa com navegação direta para *Início*, *Shopping*, *Minha Coleção*, *Trade* e *Dashboard*.
- **Carrossel Mobile Exclusivo:** Imagens explicativas personalizadas no formato vertical para introdução às funcionalidades da plataforma.
- **Rodapé Responsivo:** Quebra harmoniosa centralizada com créditos e direitos autorais.

---

## 💻 Stack Tecnológica

| Tecnologia | Descrição |
| :--- | :--- |
| **[Nuxt 3](https://nuxt.com/)** | Framework Vue fullstack com SSR/SSG híbrido e auto-imports |
| **[Vue 3](https://vuejs.org/)** | Composition API (`<script setup>`) e reatividade moderna |
| **[Tailwind CSS](https://tailwindcss.com/)** | Estilização utilitária moderna com design system suave e elegante |
| **[Lucide Icons](https://lucide.dev/)** | Pacote de ícones minimalistas (`lucide-vue-next`) |
| **[Supabase](https://supabase.com/)** | Autenticação (Auth), PostgreSQL com Row Level Security (RLS) e Storage de imagens |
| **[Cloudflare Pages](https://pages.cloudflare.com/)** | Hospedagem global de alta performance e disponibilidade na Edge |

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (versão 18.x ou 20.x recomendada)
- Gerenciador de pacotes `npm` ou `pnpm`

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/NEWLEODEV/cami_unas.git
   cd cami_unas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as chaves do Supabase:
   ```env
   SUPABASE_URL=https://sua-url-supabase.supabase.co
   SUPABASE_KEY=sua-anon-key-aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   Abra `http://localhost:3000` para visualizar o app.

---

## 📝 Scripts Disponíveis

- `npm run dev` — Inicia o servidor local de desenvolvimento.
- `npm run build` — Compila a aplicação para produção.
- `npm run generate` — Gera a versão estática pré-renderizada do projeto.
- `npm run preview` — Executa o preview local da build de produção.

---

## 📄 Licença e Créditos

Desenvolvido por **[Leonardo Bezerra](https://www.instagram.com/leonardo.bezerra.dev/)**.  
Todos os direitos reservados © 2026.
