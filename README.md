<div align="center">

<img src="src/assets/logo.png" alt="Pirataflix" width="220" />

# Pirataflix

**Catálogo de filmes e séries para descobrir o que assistir — rápido, multilíngue e sem login.**

[![Netlify](https://img.shields.io/badge/demo-pirataflix.netlify.app-00C7B7?logo=netlify&logoColor=white)](https://pirataflix.netlify.app)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![TMDB](https://img.shields.io/badge/dados-TMDB-01B4E4?logo=themoviedatabase&logoColor=white)

[**🏴‍☠️ Ver ao vivo →**](https://pirataflix.netlify.app)

</div>

---

## ✨ Funcionalidades

| | |
|---|---|
| 🏠 **Início** | Destaque em hero + em alta do dia/semana, filtrável por filmes ou séries, com rolagem infinita |
| 🎬 **Filmes & Séries** | Exploração com filtros por gênero, ordenação e paginação |
| 🔎 **Busca** | Filmes, séries e pessoas num só lugar |
| 📄 **Detalhes** | Sinopse, elenco e equipe, trailers, imagens, temporadas, onde assistir (streaming), recomendações e similares |
| 🧑 **Pessoas** | Biografia e filmografia de atores e diretores |
| ⭐ **Minha Lista** | Salve títulos para depois — fica no `localStorage`, sem conta |
| 🎲 **Sorteio** | Não sabe o que ver? Escolha o clima (😂 💥 👻 💘 🕵️ 🚀 😢 🍿), época, duração, nota mínima e seus streamings — o Pirataflix sorteia |
| 🌎 **Multilíngue** | Português, English e Español, com URLs traduzidas (`/pt/filmes`, `/en/movies`, `/es/peliculas`) |
| 🔗 **SEO de verdade** | Edge Function injeta título, descrição e Open Graph por página — links compartilhados mostram pôster e sinopse |

## 🧱 Stack

- **[React 19](https://react.dev)** + **[React Router 8](https://reactrouter.com)** — páginas com lazy loading
- **[TanStack Query](https://tanstack.com/query)** — cache e estado de servidor
- **[Tailwind CSS 4](https://tailwindcss.com)** + **[Headless UI](https://headlessui.com)** — interface
- **[Axios](https://axios-http.com)** — cliente da API do [TMDB](https://www.themoviedb.org)
- **[Vite 8](https://vite.dev)** + **TypeScript** — build
- **[Netlify](https://netlify.com)** — hospedagem + Edge Functions para SEO

## 🚀 Rodando localmente

Requer [Bun](https://bun.sh) e Node 22 (`nvm use`).

```sh
git clone https://github.com/jonathanFranco/pirataflix-v2.0.git
cd pirataflix-v2.0
bun install
bun run dev
```

| Comando | O que faz |
|---|---|
| `bun run dev` | Servidor de desenvolvimento |
| `bun run build` | Typecheck + build de produção em `./build` |
| `bun run preview` | Serve o build localmente |
| `bun run typecheck` | Só checagem de tipos |

## 🗂️ Estrutura

```
src/
├── pages/         # Home, Discover, Search, Details, Person, MyList, RandomPick
├── components/    # Layout, Row, MediaCard, MediaGrid, Modal, Seo, ui
├── hooks/         # queries do TMDB (TanStack Query)
├── services/      # cliente TMDB, Minha Lista, lógica do Sorteio
├── i18n/          # mensagens, formatação e rotas por idioma
└── seo/           # metadados por página
netlify/
└── edge-functions/seo.ts   # injeta meta tags no HTML antes de servir
```

## ☁️ Deploy

Configurado para Netlify via [`netlify.toml`](netlify.toml): build com `bun run build`, publica `build/` e roda a Edge Function de SEO. Basta conectar o repositório.

## 📜 Créditos

Dados e imagens fornecidos pelo [TMDB](https://www.themoviedb.org). Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

> O Pirataflix é um catálogo de descoberta — não hospeda nem transmite nenhum conteúdo.
