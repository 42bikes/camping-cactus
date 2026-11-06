# Acervo de fotos — Camping Cactus

Fotos públicas do camping coletadas em 06/11/2026 para análise interna e
avaliação de uso na prévia do site.

## O que tem aqui

| Pasta | Fonte | Fotos | Página de origem |
|---|---|---|---|
| `77camps/` | 77camps | 4 | https://www.77camps.com/camping/13516/camping-cactus |
| `google-maps/` | Google Maps | 1 | https://www.google.com/maps/search/?api=1&query=Camping+Cactus+Itacare |
| `macamp/` | MaCamp | 12 | https://macamp.com.br/guia/guia/campings/brasil/bahia/itacare/camping-cactus-do-rustico/ |

- `manifest.json` — metadados de cada arquivo: URL original, dimensões, peso,
  hash, duplicatas e papel sugerido.
- As 4 fotos do 77camps são **exatamente as mesmas** já usadas em
  `preview/assets/cactus-1..4.jpg` (hash idêntico).
- A foto do Google Maps é a única em alta: **4032×3024** (4,3 MB). É a
  candidata natural para hero e Open Graph, mas a autoria precisa ser
  confirmada antes de publicar.
- As 12 do MaCamp são de 2020 e têm no máximo 800 px no maior lado.

## Limitações

- Nenhuma foto chega a 1200 px de largura. Servem para cards e miniaturas,
  mas não para um hero em tela grande nem para Open Graph 1200×630.
- O Instagram bloqueou o acesso público (login/429), então não foi possível
  puxar posts recentes de lá.
- O ensaio de 1h continua necessário para hero, chalés internos, cozinha,
  banheiros e fotos dos anfitriões.

## Direitos de uso

As imagens são de anúncios públicos do próprio camping em sites de terceiros.
**Uso interno para análise e proposta.** Publicar no site, no Google Business
ou nas redes exige autorização dos proprietários (Nanda e Max) — item já
previsto no checklist do `dossie.md`.

## Como atualizar

```bash
node baixar-fotos.mjs          # baixa o que falta e regenera a análise
node baixar-fotos.mjs --force  # baixa tudo de novo
```

O script também regenera `analise-fotos.html` na raiz do projeto.
