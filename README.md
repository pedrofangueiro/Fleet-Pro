# Fleet Pro

Ferramenta simples de **conferência de viaturas**: compara a lista de matrículas dos veículos
disponíveis (importada de Excel, PDF, foto ou texto) com as matrículas lidas em fotografias,
e apresenta **Confirmados**, **Impro**, **Em falta** e **Não previstos**.

É uma aplicação web estática (HTML + CSS + JavaScript), sem passo de compilação e sem servidor próprio.

## Como abrir no Cursor (ou VS Code)

1. Descompacta o ZIP e abre a pasta `fleet-pro` no Cursor: **File → Open Folder…**
2. Instala a extensão **Live Server** (o Cursor sugere-a automaticamente, a partir de `.vscode/extensions.json`).
3. Clica com o botão direito em `index.html` → **Open with Live Server**.
   A app abre em `http://127.0.0.1:5500`.

Alternativa sem extensões, no terminal da pasta do projeto:

```bash
python3 -m http.server 5500
# depois abre http://localhost:5500
```

> Abre sempre por `http://localhost`, não com duplo clique no ficheiro. O leitor de PDF (pdf.js)
> precisa de ser servido por HTTP para funcionar.

## A leitura por IA e os downloads (importante)

A leitura das matrículas por IA e o botão **Descarregar Excel** usam a ligação ao Claude
(`claude.use("sample")` e `claude.use("downloads")`), que **só existe quando a página é publicada
como Artifact no claude.ai**. Fora do Claude (Live Server, GitHub Pages, etc.):

- a interface, a importação de listas, a comparação, as correções manuais, as notas, os relatórios guardados
  e o menu funcionam;
- a **leitura automática das fotos** e o **download de ficheiros** não funcionam, porque dependem do Claude.

Para usar a app completa, publica a versão de ficheiro único como Artifact:

```bash
python3 scripts/build_artifact.py
# gera artifact/fleet-pro-artifact.html (um só ficheiro, pronto para publicar no Claude)
```

O ficheiro `artifact/fleet-pro-artifact.html` incluído neste projeto é exatamente o que está
publicado no Claude. Para o atualizar no Claude, pede ao Claude para publicar esse ficheiro no mesmo Artifact.

Para ter a leitura por IA fora do Claude seria preciso um pequeno servidor que chame a API da Anthropic
com uma chave própria (guardada em `.env`, que o `.gitignore` já exclui do GitHub). Não está incluído.

## Estrutura

```
fleet-pro/
├── index.html              Estrutura da página (HTML)
├── css/
│   ├── base.css            Base da página (reset, safe areas do iPhone)
│   ├── fonts.css           Fonte Inter local
│   └── styles.css          Todo o design da app
├── js/
│   ├── app.js              Lógica principal: listas, leitura de fotos, comparação, detalhe, estados
│   └── menu.js             Menu lateral, perfil, relatórios guardados, Excel, definições, idioma
├── vendor/                 Bibliotecas de terceiros (incluídas, sem CDN)
│   ├── xlsx.full.min.js    SheetJS 0.18.5, ler e criar Excel
│   ├── pdf.js              pdf.js 3.11.174, ler PDFs
│   ├── pdf.worker.js       worker do pdf.js
│   └── licenses/
├── fonts/                  Inter (variável) + licença
├── artifact/               Versão de ficheiro único para publicar no Claude
├── scripts/build_artifact.py
├── .vscode/                Sugestão de extensão Live Server
├── .gitignore
└── README.md
```

## Onde ficam os dados

Tudo fica **no navegador do utilizador** (localStorage e IndexedDB): perfil, sessão em curso, fotos,
relatórios guardados no Fleet Pro, tema e idioma. Nada é enviado para o GitHub nem para um servidor
da app. Limpar os dados do navegador apaga os relatórios guardados.

## Enviar para o GitHub

```bash
git init
git add .
git commit -m "Fleet Pro"
git branch -M main
git remote add origin https://github.com/<o-teu-utilizador>/fleet-pro.git
git push -u origin main
```

(ou usa o GitHub Desktop / o separador "Source Control" do Cursor).

## Notas técnicas

- Tecnologias: HTML, CSS, JavaScript puro; `localStorage`; IndexedDB; Canvas; SheetJS; pdf.js.
- A única diferença no código em relação ao Artifact publicado é o caminho do worker do pdf.js
  (`vendor/pdf.worker.js` em vez do CDN, em `js/app.js`). O `scripts/build_artifact.py` repõe o CDN
  e gera um ficheiro idêntico, byte a byte, ao Artifact.
- Exemplos no código (matrículas como `AB-12-CD`) são inventados. Não há chaves de API, credenciais
  nem dados reais da empresa.
