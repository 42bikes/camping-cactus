# Camping Cactus — pacote de prospecção

Pasta de trabalho para a proposta de landing page + Google Business + acompanhamento do **Camping Cactus**, em Itacaré-BA.

## Arquivos

| Arquivo | O que é |
|---|---|
| `proposta-apresentacao.md` | Roteiro completo de pitch e apresentação presencial (10 min) |
| `preview/proposta.html` | Apresentação interativa de slides/deck da proposta para Nanda e Max |
| `preview/index.html` | Protótipo funcional da landing page para demonstração ao vivo |
| `dossie.md` | Pesquisa completa: dados, diagnóstico digital, gaps, oferta e abordagem |
| `dados.json` | Os mesmos dados em formato estruturado (para usar no site/CRM) |
| `landing-copy.md` | Wireframe e copy pronta da landing page, com SEO e checklist técnico |
| `google-business-checklist.md` | Passo a passo do Google Business + cartão de visita com QR |
| `scrape-instagram.mjs` | Script Node para puxar metadados públicos de um perfil do Instagram |
| `baixar-fotos.mjs` | Baixa e cataloga fotos públicas do camping (MaCamp + 77camps) |
| `midia/camping-cactus/` | Acervo de fotos reais + `manifest.json` com origem e metadados |
| `analise-fotos.html` | Folha de contato para avaliar as fotos antes de usar na prévia |

## O que foi confirmado

- Instagram ativo: **3.782 seguidores**
- WhatsApp: **+55 71 98668-2428**
- Endereço: **Rua dos Jacarandás, 94 — Alto da Boa Vista, Itacaré-BA**
- Donos: **Nanda e Max**
- Estrutura: barracas, motorhome até 7 m, 2 chalés, cozinha, wi-fi, chuveiro quente, lavanderia, churrasqueira, pet friendly
- Reputação: **4,1 no MaCamp (9 avaliações)**
- **Não tem site próprio** e **não aparece no itacare.com**

## O que precisa confirmar com os donos

- Preços atuais (barraca, motorhome, chalé, por pessoa)
- Quantidade e capacidade dos chalés
- Horário de check-in/check-out e regras
- Formas de pagamento
- Autorização para usar as fotos do Instagram

## Como rodar o scraper

```bash
node scrape-instagram.mjs camping_cactus
```

O Instagram bloqueia IPs de datacenter com frequência. Se retornar `blocked: true`:

1. Rode da sua rede residencial.
2. Abra o perfil no navegador logado e copie a bio manualmente.
3. Para posts e legendas, use uma API paga (Apify, RapidAPI) ou `instaloader --login`.

Os dados já coletados manualmente estão em `dados.json` — o script é para os próximos alvos (outros campings).

## Próximos passos sugeridos

1. Confirmar os dados na visita (checklist no fim do `dossie.md`).
2. Fazer o ensaio de 1h (12 fotos).
3. Publicar a landing page em 5 dias.
4. Configurar o Google Business no mesmo dia da publicação.
5. Oferecer o acompanhamento mensal de R$ 250.
