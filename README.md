# Universo CAMIS (Cami Unhas) 💅✨

Bem-vindo ao repositório do **Universo CAMIS**, uma plataforma web moderna e encantadora criada especialmente para amantes de beleza, com foco na organização pessoal de esmaltes, cosméticos e recomendações de produtos.

## 🌟 Sobre a Aplicação

Sabe quando você tem tanta coisa maravilhosa guardada que acaba esquecendo o que tem, ou deixa aquele produto caríssimo vencer? A **Camis** foi desenhada para resolver exatamente isso: organizar a sua paixão por beleza em um só lugar.

A aplicação funciona com um modelo híbrido de acesso:
- **Área Pública:** Visitantes podem explorar a página principal, navegar pelo **Shopping** (vitrine de produtos recomendados) e acessar os links das redes sociais (TikTok, Instagram) sem precisar criar uma conta.
- **Área Privada:** Ao fazer login, o usuário desbloqueia sua **Coleção Pessoal** e um **Dashboard Inteligente** para gerenciar seus próprios cosméticos.

## 🚀 Principais Funcionalidades

### 📦 Minha Coleção (Acervo de Beleza)
O coração do sistema. Permite registrar entradas de produtos (esmaltes, bases, tratamentos) com riqueza de detalhes:
- Foto, Marca, Cor, Coleção.
- Quantidade e Preço pago.
- Datas de compra e de **validade**.
- Marcação de status de uso (Testado/Usado).
- Sistema de classificação por corações: *Gostei (1), Adorei (2), Super Amei (3)*.

### 📊 Dashboard Inteligente
Uma visão analítica e visual (com gráficos interativos) da coleção do usuário logado:
- **Valor estimado** total do acervo.
- **Alerta de validade:** Produtos próximos do vencimento (30 dias) ou vencidos.
- **Gráficos de Distribuição:** Divisão percentual por cores e evolução do valor investido ao longo do tempo.
- **Top Marcas** e carrosséis com os produtos favoritos.

### 🛍️ Shopping (Vitrine)
Uma área pública onde os visitantes podem explorar "achadinhos" recomendados pela Camila. 
- Navegação por categorias.
- Produtos patrocinados ou em oferta.
- Cliques direcionam para links de afiliados, contabilizando o tráfego para a criadora.

### ⚙️ Painel Administrativo
Uma área segura exclusiva para a dona do sistema:
- Gerenciamento completo da vitrine (CRUD de Categorias e Produtos do Shopping).
- Visão geral de métricas, como a quantidade total de cliques gerados nos links de afiliados.

## 💻 Stack Tecnológica

O projeto foi construído utilizando as melhores e mais modernas tecnologias do ecossistema front-end:

- **Framework:** [Vue 3](https://vuejs.org/) / [Nuxt 3](https://nuxt.com/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Ícones:** [Lucide Icons](https://lucide.dev/) (`lucide-vue-next`)
- **Gráficos:** [Chart.js](https://www.chartjs.org/) integrado via `vue-chartjs`
- **Backend as a Service (BaaS):** [Supabase](https://supabase.com/)
  - Autenticação de Usuários (`@nuxtjs/supabase`)
  - Banco de Dados PostgreSQL (Perfis, Produtos, Movimentações, Vitrine, Categorias)

## 🛠️ Como Executar o Projeto

Certifique-se de instalar as dependências antes de rodar o projeto:

```bash
# npm
npm install

# Rodar o servidor de desenvolvimento localmente
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

---
*Desenvolvido com ❤️ para organizar nossa paixão por beleza em um só lugar.*
