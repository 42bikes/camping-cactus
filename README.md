# Camping Cactus — Landing Page

Landing page estática (protótipo funcional) para o **Camping Cactus**, camping em Itacaré-BA (Alto da Boa Vista). Barracas, motorhome (até 7 m) e 2 chalés, a poucos minutos a pé das praias.

> Projeto de prospecção/comercial — prévia de design. Fotos do acervo público do camping; preços, depoimentos e detalhes serão confirmados com os anfitriões (Nanda e Max) na versão final.

## Stack

- HTML5 + CSS3 (single file, sem framework)
- Fontes: [Fraunces](https://fonts.google.com/specimen/Fraunces), [DM Sans](https://fonts.google.com/specimen/DM+Sans) e [Bitter](https://fonts.google.com/specimen/Bitter) (Google Fonts)
- Sem build step — site 100% estático

## Estrutura

```
camping-cactus/
├── preview/              # raiz de publicação (site estático)
│   ├── index.html        # landing page
│   ├── proposta.html     # deck de apresentação para os anfitriões
│   └── assets/           # imagens usadas no site
├── midia/                # acervo de fotos (origem dos assets)
├── dados.json            # dados estruturados do camping
├── landing-copy.md       # wireframe e copy com SEO
├── dossie.md             # pesquisa e diagnóstico
├── vercel.json           # deploy: outputDirectory = preview
└── README.md
```

## Seções da landing

1. Hero (tela cheia no desktop, imagem de fundo)
2. Trust bar (números)
3. Acomodações (barracas, motorhome, chalés)
4. Estrutura (features)
5. Chalés
6. Localização (mapa + distâncias)
7. Roteiro (praias, trilhas, cachoeiras)
8. Depoimentos
9. FAQ
10. CTA final (reserva direto com os anfitriões)

## Rodar localmente

Servir a pasta `preview/` em um servidor HTTP (necessário para carregar os assets):

```bash
# Python
python -m http.server 8123 --directory preview

# Node
npx serve preview
```

Acesse: http://127.0.0.1:8123/index.html

## Deploy (Vercel)

Site 100% estático. O `vercel.json` define `preview/` como diretório de saída, publicando `preview/index.html` na raiz do domínio.

```bash
vercel --prod
# ou conecte o repositório no dashboard da Vercel (Framework: Other)
```

## Antes de publicar

- Confirmar preços, depoimentos e detalhes com os anfitriões.
- Substituir fotos de acervo público por fotos autorizadas.
- Remover o aviso de prévia (`.preview-note`) do `index.html`.
- Configurar o Google Business Profile.

## Repositório

https://github.com/42bikes/camping-cactus
