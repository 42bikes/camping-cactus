# Camping Cactus — Landing Page

Landing page estática para o **Camping Cactus** (Itacaré-BA): camping arborizado com barracas, motorhome (até 7 m) e 2 chalés, a poucos minutos a pé das praias.

Conceito visual: editorial orgânico (papel, mata, barro). Protótipo funcional pronto para demonstração e publicação.

## Estrutura

```
camping-cactus/
├── preview/              # site estático (raiz de publicação)
│   ├── index.html        # landing page
│   ├── proposta.html     # deck de apresentação para os anfitriões
│   └── assets/           # imagens usadas no site
├── midia/                # acervo de fotos (origem dos assets)
├── dados.json            # dados estruturados do camping
├── landing-copy.md       # wireframe e copy com SEO
├── dossie.md             # pesquisa e diagnóstico
└── vercel.json           # configuração de deploy (outputDirectory: preview)
```

## Rodar localmente

Servir a pasta `preview/` em um servidor HTTP (necessário para carregar os assets):

```bash
# Python
python -m http.server 8123 --directory preview

# ou Node
npx serve preview
```

Acesse: http://127.0.0.1:8123/index.html

## Deploy (Vercel)

O projeto é 100% estático. O `vercel.json` define `preview/` como diretório de saída, então o Vercel publica `preview/index.html` na raiz do domínio e resolve os assets em `preview/assets/`.

```bash
# via CLI
vercel --prod

# ou conecte o repositório no dashboard da Vercel (Framework: Other)
```

## Antes de publicar

- Confirmar preços, depoimentos e detalhes com os anfitriões (Nanda e Max).
- Substituir fotos de acervo público por fotos autorizadas.
- Remover o aviso de prévia (`.preview-note`) do `index.html`.
- Configurar o Google Business Profile.

## Licença

Projeto de prospecção/comercial. Uso restrito ao Camping Cactus.
