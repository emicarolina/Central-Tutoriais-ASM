/**
 * main.js — Central de Tutoriais ASM
 *
 * O que esse arquivo faz:
 *  1. Busca os tutoriais da API do Flask
 *  2. Monta as categorias e dropdowns na tela
 *  3. Faz a busca em tempo real por título e tags
 *  4. Gerencia os favoritos via localStorage
 *  5. Controla o painel lateral de favoritos
 *  6. Exibe os toasts de feedback
 */

// Chave usada pra salvar os favoritos no localStorage
// Pensa nela como o "nome da gaveta" onde guardamos os dados
const STORAGE_KEY = "asm_favoritos";

// Aqui ficam todos os tutoriais depois que a API responder
let todosTutoriais = [];

// ══════════════════════════════════════════════════
// 1. PONTO DE ENTRADA
// Executa quando a página terminar de carregar
// ══════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
  await carregarTutoriais();
  configurarBusca();
  configurarPainelFavoritos();
});

// ══════════════════════════════════════════════════
// 2. CARREGAR TUTORIAIS DA API
// ══════════════════════════════════════════════════

async function carregarTutoriais() {
  try {
    // fetch faz uma requisição HTTP para nossa API local do Flask
    const resposta = await fetch("/api/tutoriais");
    const dados = await resposta.json();

    todosTutoriais = dados.tutoriais;

    // Separa os tutoriais pela seção deles
    const plataforma = todosTutoriais.filter((t) => t.secao === "Plataforma");
    const totvs = todosTutoriais.filter((t) => t.secao === "TOTVS");

    // Monta cada seção na tela
    montarSecao(plataforma, "listaPlataforma");
    montarSecao(totvs, "listaTOTVS");

    atualizarBadgeFavoritos();

    // Esconde o spinner e mostra o conteúdo
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("secoesGrid").style.display = "grid";
  } catch (erro) {
    // Se der erro (ex: servidor Flask não está rodando)
    document.getElementById("loadingState").innerHTML =
      '<p style="color:#C96278;text-align:center">Erro ao carregar.<br/>Verifique se o servidor está rodando.</p>';
  }
}

// ══════════════════════════════════════════════════
// 3. MONTAR CATEGORIAS E DROPDOWNS NA TELA
// ══════════════════════════════════════════════════

/**
 * Recebe um array de tutoriais de uma seção
 * e monta os blocos de categoria com seus dropdowns.
 */
function montarSecao(tutoriais, idContainer) {
  const container = document.getElementById(idContainer);
  container.innerHTML = "";

  // Agrupa: { "Produtos": { "Cadastros": [tutorial, ...] } }
  const grupos = agruparPorCategoria(tutoriais);

  Object.entries(grupos).forEach(([categoria, subcategorias]) => {
    const totalTutoriais = Object.values(subcategorias).flat().length;

    // ── Bloco da categoria ──
    const bloco = document.createElement("div");
    bloco.className = "categoria-bloco";

    // ── Cabeçalho clicável ──
    const header = document.createElement("div");
    header.className = "categoria-header";
    header.innerHTML = `
      <span class="categoria-nome">
        <span class="categoria-dot"></span>
        ${categoria}
      </span>
      <span style="display:flex;align-items:center;gap:8px">
        <span class="categoria-count">${totalTutoriais}</span>
        <svg class="categoria-arrow" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>
    `;

    // Clicou no cabeçalho → abre ou fecha o dropdown
    header.addEventListener("click", () => {
      bloco.classList.toggle("aberto");
    });

    // ── Dropdown com os tutoriais ──
    const dropdown = document.createElement("div");
    dropdown.className = "categoria-dropdown";

    Object.entries(subcategorias).forEach(([subcategoria, itens]) => {
      // Mostra o título da subcategoria só se for diferente da categoria
      if (subcategoria !== categoria) {
        const tituloSub = document.createElement("p");
        tituloSub.className = "subcategoria-titulo";
        tituloSub.textContent = subcategoria;
        dropdown.appendChild(tituloSub);
      }

      // Adiciona cada tutorial da subcategoria
      itens.forEach((tutorial) => {
        dropdown.appendChild(criarItemTutorial(tutorial));
      });
    });

    bloco.appendChild(header);
    bloco.appendChild(dropdown);
    container.appendChild(bloco);
  });
}

/**
 * Cria o elemento HTML de um tutorial individual
 * com o link e o botão de estrela (favorito).
 */
function criarItemTutorial(tutorial) {
  const favoritados = lerFavoritos();
  const ehFavorito = favoritados.some((f) => f.id === tutorial.id);

  const item = document.createElement("div");
  item.className = "tutorial-item";
  item.dataset.id = tutorial.id;

  item.innerHTML = `
    <a class="tutorial-link"
       href="${tutorial.link}"
       target="_blank"
       rel="noopener">
      ${tutorial.titulo}
    </a>
    <button class="btn-fav ${ehFavorito ? "favoritado" : ""}"
            data-id="${tutorial.id}"
            title="${ehFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
      <svg width="14" height="14" viewBox="0 0 24 24"
           stroke="currentColor" stroke-width="1.8"
           fill="${ehFavorito ? "currentColor" : "none"}">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  `;

  // Evento do botão de favorito
  item.querySelector(".btn-fav").addEventListener("click", () => {
    alternarFavorito(tutorial);
  });

  return item;
}

/**
 * Agrupa um array de tutoriais assim:
 * { "Categoria": { "Subcategoria": [tutorial, tutorial] } }
 */
function agruparPorCategoria(tutoriais) {
  return tutoriais.reduce((acc, t) => {
    if (!acc[t.categoria]) acc[t.categoria] = {};
    if (!acc[t.categoria][t.subcategoria])
      acc[t.categoria][t.subcategoria] = [];
    acc[t.categoria][t.subcategoria].push(t);
    return acc;
  }, {});
}

// ══════════════════════════════════════════════════
// 4. BUSCA DINÂMICA EM TEMPO REAL
// ══════════════════════════════════════════════════

function configurarBusca() {
  // Configura a busca para cada seção de forma independente
  configurarInputBusca(
    "buscaPlataforma",
    "clearPlataforma",
    "listaPlataforma",
    "semResultadoPlataforma",
    "Plataforma",
  );
  configurarInputBusca(
    "buscaTOTVS",
    "clearTOTVS",
    "listaTOTVS",
    "semResultadoTOTVS",
    "TOTVS",
  );
}

function configurarInputBusca(
  inputId,
  clearId,
  listaId,
  semResultadoId,
  secao,
) {
  const input = document.getElementById(inputId);
  const btnClear = document.getElementById(clearId);
  const lista = document.getElementById(listaId);
  const semResultado = document.getElementById(semResultadoId);

  // Dispara a cada tecla digitada
  input.addEventListener("input", () => {
    const termo = input.value.trim().toLowerCase();

    // Mostra o botão de limpar só quando há texto
    btnClear.style.display = termo ? "flex" : "none";

    if (!termo) {
      // Campo vazio → volta pra listagem normal com categorias
      semResultado.style.display = "none";
      montarSecao(
        todosTutoriais.filter((t) => t.secao === secao),
        listaId,
      );
      return;
    }

    // Filtra comparando o termo com título e tags de cada tutorial
    const resultados = todosTutoriais.filter((t) => {
      if (t.secao !== secao) return false;

      const noTitulo = t.titulo.toLowerCase().includes(termo);

      // tags é um array, então verificamos cada tag
      const nasTags = t.tags.some((tag) => tag.toLowerCase().includes(termo));

      return noTitulo || nasTags;
    });

    renderizarResultadoBusca(resultados, lista, semResultado);
  });

  // Clicou no X → limpa o campo e restaura as categorias
  btnClear.addEventListener("click", () => {
    input.value = "";
    btnClear.style.display = "none";
    semResultado.style.display = "none";
    montarSecao(
      todosTutoriais.filter((t) => t.secao === secao),
      listaId,
    );
  });
}

/**
 * Renderiza os tutoriais encontrados em modo lista,
 * sem agrupamento por categoria.
 */
function renderizarResultadoBusca(resultados, lista, semResultado) {
  lista.innerHTML = "";

  if (resultados.length === 0) {
    semResultado.style.display = "block";
    return;
  }

  semResultado.style.display = "none";

  const wrap = document.createElement("div");
  wrap.className = "resultado-busca";

  const favoritados = lerFavoritos();

  resultados.forEach((tutorial) => {
    const ehFavorito = favoritados.some((f) => f.id === tutorial.id);

    const item = document.createElement("div");
    item.className = "resultado-item";
    item.innerHTML = `
      <div class="resultado-meta">
        <a class="resultado-titulo"
           href="${tutorial.link}"
           target="_blank"
           rel="noopener">
          ${tutorial.titulo}
        </a>
        <span class="resultado-categoria">
          ${tutorial.categoria} · ${tutorial.subcategoria}
        </span>
      </div>
      <button class="btn-fav ${ehFavorito ? "favoritado" : ""}"
              data-id="${tutorial.id}"
              title="${ehFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
        <svg width="14" height="14" viewBox="0 0 24 24"
             stroke="currentColor" stroke-width="1.8"
             fill="${ehFavorito ? "currentColor" : "none"}">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    `;

    item.querySelector(".btn-fav").addEventListener("click", () => {
      alternarFavorito(tutorial);
    });

    wrap.appendChild(item);
  });

  lista.appendChild(wrap);
}

// ══════════════════════════════════════════════════
// 5. SISTEMA DE FAVORITOS (localStorage)
// ══════════════════════════════════════════════════

/**
 * localStorage funciona como um bloco de notas do navegador.
 * Só aceita texto, então usamos JSON.stringify pra salvar
 * e JSON.parse pra ler de volta como objeto JavaScript.
 */

function lerFavoritos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function salvarFavoritos(favoritos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
}

/**
 * Se o tutorial já está nos favoritos → remove.
 * Se não está → adiciona.
 * Depois atualiza tudo na tela.
 */
function alternarFavorito(tutorial) {
  let favoritos = lerFavoritos();
  const index = favoritos.findIndex((f) => f.id === tutorial.id);

  if (index === -1) {
    favoritos.push(tutorial);
    mostrarToast(`"${tutorial.titulo}" adicionado aos favoritos ★`);
  } else {
    favoritos.splice(index, 1);
    mostrarToast(`"${tutorial.titulo}" removido dos favoritos`);
  }

  salvarFavoritos(favoritos);
  atualizarBotoesFavorito(tutorial.id, favoritos);
  atualizarBadgeFavoritos();
  renderizarPainelFavoritos();
}

/**
 * Atualiza visualmente todos os botões de estrela
 * que pertencem a um determinado tutorial.
 * (O mesmo tutorial pode aparecer na busca e na lista ao mesmo tempo.)
 */
function atualizarBotoesFavorito(idTutorial, favoritos) {
  const ehFavorito = favoritos.some((f) => f.id === idTutorial);

  document
    .querySelectorAll(`.btn-fav[data-id="${idTutorial}"]`)
    .forEach((btn) => {
      const svg = btn.querySelector("svg");

      if (ehFavorito) {
        btn.classList.add("favoritado");
        btn.title = "Remover dos favoritos";
        svg.setAttribute("fill", "currentColor");
      } else {
        btn.classList.remove("favoritado");
        btn.title = "Adicionar aos favoritos";
        svg.setAttribute("fill", "none");
      }
    });
}

/** Atualiza o número no badge do botão "Favoritos" no topo. */
function atualizarBadgeFavoritos() {
  const total = lerFavoritos().length;
  const badge = document.getElementById("badgeCount");
  badge.textContent = total;
  badge.style.display = total > 0 ? "inline-flex" : "none";
}

// ══════════════════════════════════════════════════
// 6. PAINEL LATERAL DE FAVORITOS
// ══════════════════════════════════════════════════

function configurarPainelFavoritos() {
  const btnAbrir = document.getElementById("btnFavoritos");
  const btnFechar = document.getElementById("btnFecharPainel");
  const painel = document.getElementById("painelFavoritos");
  const overlay = document.getElementById("overlay");

  // Abre o painel
  btnAbrir.addEventListener("click", () => {
    renderizarPainelFavoritos();
    painel.classList.add("visivel");
    overlay.classList.add("visivel");
  });

  // Fecha pelo botão ou clicando fora
  const fechar = () => {
    painel.classList.remove("visivel");
    overlay.classList.remove("visivel");
  };

  btnFechar.addEventListener("click", fechar);
  overlay.addEventListener("click", fechar);
}

/** Monta a lista de favoritos dentro do painel lateral. */
function renderizarPainelFavoritos() {
  const body = document.getElementById("painelBody");
  const favoritos = lerFavoritos();

  body.innerHTML = "";

  if (favoritos.length === 0) {
    body.innerHTML = `
      <p class="painel-vazio">
        Você ainda não tem favoritos.<br/>
        Clique na estrela ao lado de um tutorial.
      </p>`;
    return;
  }

  favoritos.forEach((tutorial) => {
    const item = document.createElement("div");
    item.className = "fav-item";
    item.innerHTML = `
      <div class="fav-item-info">
        <span class="fav-secao-badge">${tutorial.secao}</span>
        <a class="fav-item-titulo"
           href="${tutorial.link}"
           target="_blank"
           rel="noopener">
          ${tutorial.titulo}
        </a>
        <span class="fav-item-sub">
          ${tutorial.categoria} · ${tutorial.subcategoria}
        </span>
      </div>
      <button class="fav-item-remover"
              title="Remover dos favoritos"
              data-id="${tutorial.id}">
        ✕
      </button>
    `;

    item.querySelector(".fav-item-remover").addEventListener("click", () => {
      alternarFavorito(tutorial);
    });

    body.appendChild(item);
  });
}

// ══════════════════════════════════════════════════
// 7. TOAST (notificação visual)
// ══════════════════════════════════════════════════

let toastTimer = null;

function mostrarToast(mensagem) {
  const toast = document.getElementById("toast");
  toast.textContent = mensagem;
  toast.classList.add("visivel");

  // Cancela o timer anterior se o usuário agiu rápido
  if (toastTimer) clearTimeout(toastTimer);

  // Some depois de 2.8 segundos
  toastTimer = setTimeout(() => {
    toast.classList.remove("visivel");
  }, 2800);
}
