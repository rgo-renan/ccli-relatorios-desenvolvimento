# Relatórios de desenvolvimento · CCLi

Painel que lista os alunos (Insigna / Proprietário), sinaliza quem fecha trimestre, exige avaliação recente do consultor e gera o relatório de desenvolvimento em PDF.

- `public/index.html`: o painel (página única)
- `netlify/functions/api.mts`: dados no Netlify Blobs, protegidos por chave
- `netlify/functions/redigir.mts`: redação opcional com a API da Anthropic

Variáveis no Netlify (escopo Functions): `PAINEL_CHAVE` (consultores), `ADMIN_CHAVE` (equipe de CS, atualiza planilhas), `REDACAO_IA` = `sim` liga a redação com Claude (desligada por padrão, sem custo; o painel usa só o texto-base). Com ela ligada, a função usa `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` (injetadas pelo AI Gateway do Netlify ou cadastradas manualmente).
