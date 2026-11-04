# Relatórios de desenvolvimento · CCLi

Painel que lista os alunos (Insigna / Proprietário), sinaliza quem fecha trimestre, exige avaliação recente do consultor e gera o relatório de desenvolvimento em PDF.

- `public/index.html`: o painel (página única)
- `netlify/functions/api.mts`: dados no Netlify Blobs, protegidos por chave
- `netlify/functions/redigir.mts`: redação opcional com a API da Anthropic

Variáveis no Netlify (escopo Functions): `PAINEL_CHAVE` (consultores), `ADMIN_CHAVE` (equipe de CS, atualiza planilhas), `ANTHROPIC_API_KEY` (opcional; sem ela o painel usa só o texto-base).
