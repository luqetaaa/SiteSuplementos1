/* ========= Helpers ========= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ========= Mock Data ========= */
const PRODUCTS = [
  {
    id: "whey-vanilla",
    name: "Whey Protein Isolado - Baunilha 900g",
    price: 199.9,
    category: "Whey Protein",
    rating: 4.8,
    emoji: "🥛",
  },
  {
    id: "creatine-300",
    name: "Creatina Monohidratada 300g",
    price: 129.9,
    category: "Creatina",
    rating: 4.9,
    emoji: "⚪",
  },
  {
    id: "pre-workout-x",
    name: "Pré-treino Xtreme 300g",
    price: 159.9,
    category: "Pré-treino",
    rating: 4.6,
    emoji: "⚡",
  },
  {
    id: "bcaa-120",
    name: "BCAA 2:1:1 120 cáps",
    price: 89.9,
    category: "Aminoácidos",
    rating: 4.4,
    emoji: "🧬",
  },
  {
    id: "multi-man",
    name: "Multivitamínico Premium 60 cáps",
    price: 74.9,
    category: "Vitaminas",
    rating: 4.7,
    emoji: "✨",
  },
  {
    id: "shaker-700",
    name: "Coqueteleira 700ml Antivazamento",
    price: 49.9,
    category: "Acessórios",
    rating: 4.5,
    emoji: "🧪",
  },
  {
    id: "whey-chocolate",
    name: "Whey Concentrado - Chocolate 1kg",
    price: 149.9,
    category: "Whey Protein",
    rating: 4.6,
    emoji: "🍫",
  },
  {
    id: "creatine-100",
    name: "Creatina Monohidratada 100g",
    price: 59.9,
    category: "Creatina",
    rating: 4.3,
    emoji: "⚪",
  },
];

/* ========= State ========= */
const state = {
  products: [...PRODUCTS],
  filtered: [...PRODUCTS],
  cart: JSON.parse(localStorage.getItem("nutri_cart") || "[]"),
  query: "",
  category: "todas",
  sort: "relevance",
};

/* ========= Rendering ========= */
function productCard(p) {
  return `
  <article class="card" role="listitem" aria-label="${p.name}">
    <div class="thumb" aria-hidden="true">${p.emoji}</div>
    <div class="card-body">
      <h3>${p.name}</h3>
      <div class="meta">
        <span>${p.category}</span> • <span>⭐ ${p.rating.toFixed(1)}</span>
      </div>
      <div class="price">${fmt(p.price)}</div>
      <button class="btn" data-add="${p.id}">Adicionar</button>
    </div>
  </article>`;
}

function renderGrid() {
  const grid = $("#grid");
  grid.innerHTML = state.filtered.map(productCard).join("");
  // attach events
  $$("#grid [data-add]").forEach((btn) =>
    btn.addEventListener("click", (e) => addToCart(e.target.dataset.add))
  );
}

/* ========= Filtering & Sorting ========= */
function applyFilters() {
  let list = [...state.products];

  // search
  if (state.query.trim()) {
    const q = state.query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  // category
  if (state.category !== "todas") {
    list = list.filter((p) => p.category === state.category);
  }

  // sort
  switch (state.sort) {
    case "price_asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name_asc":
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
    default:
      // relevance (rating then price)
      list.sort((a, b) => b.rating - a.rating || a.price - b.price);
  }

  state.filtered = list;
  renderGrid();
}

/* ========= Cart ========= */
function saveCart() {
  localStorage.setItem("nutri_cart", JSON.stringify(state.cart));
  updateCartBadge();
}

function updateCartBadge() {
  $("#cartCount").textContent = state.cart.reduce((s, i) => s + i.qty, 0);
}

function addToCart(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;
  const found = state.cart.find((i) => i.id === id);
  if (found) found.qty += 1;
  else state.cart.push({ id, qty: 1, price: product.price, name: product.name, emoji: product.emoji });
  saveCart();
  openCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((i) => i.id !== id);
  }
  saveCart();
  renderCart();
}

function removeItem(id) {
  state.cart = state.cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const list = $("#cartItems");
  if (state.cart.length === 0) {
    list.innerHTML = `<p style="color:var(--muted); text-align:center; padding:18px">Seu carrinho está vazio.</p>`;
    $("#cartSubtotal").textContent = fmt(0);
    return;
  }

  list.innerHTML = state.cart
    .map((i) => {
      const p = state.products.find((p) => p.id === i.id);
      return `
      <div class="cart-item">
        <div class="cart-thumb">${p?.emoji ?? "🛍️"}</div>
        <div>
          <div style="font-weight:600">${i.name}</div>
          <div style="color:var(--muted); font-size:13px">${fmt(i.price)} • ${p?.category ?? ""}</div>
          <div class="qty">
            <button aria-label="Diminuir" data-dec="${i.id}">−</button>
            <span>${i.qty}</span>
            <button aria-label="Aumentar" data-inc="${i.id}">+</button>
            <button class="remove" data-rem="${i.id}">remover</button>
          </div>
        </div>
        <div style="font-weight:700">${fmt(i.qty * i.price)}</div>
      </div>`;
    })
    .join("");

  const subtotal = state.cart.reduce((s, i) => s + i.qty * i.price, 0);
  $("#cartSubtotal").textContent = fmt(subtotal);

  // attach events
  $$("#cartItems [data-inc]").forEach((b) =>
    b.addEventListener("click", (e) => changeQty(e.target.dataset.inc, +1))
  );
  $$("#cartItems [data-dec]").forEach((b) =>
    b.addEventListener("click", (e) => changeQty(e.target.dataset.dec, -1))
  );
  $$("#cartItems [data-rem]").forEach((b) =>
    b.addEventListener("click", (e) => removeItem(e.target.dataset.rem))
  );
}

/* ========= Cart Drawer UI ========= */
function openCart(){
  $("#cart").classList.add("open");
  $("#overlay").classList.add("show");
  $("#overlay").setAttribute("aria-hidden","false");
}
function closeCart(){
  $("#cart").classList.remove("open");
  $("#overlay").classList.remove("show");
  $("#overlay").setAttribute("aria-hidden","true");
}

/* ========= Newsletter ========= */
function handleNewsletter(e){
  e.preventDefault();
  const email = $("#nlEmail").value.trim();
  const msg = $("#nlMsg");
  if(!email){
    msg.textContent = "Digite um e-mail válido.";
    return;
  }
  msg.textContent = "Obrigado! Cupom NUTRI10 aplicado no carrinho.";
}

/* ========= Events ========= */
document.addEventListener("DOMContentLoaded", () => {
  // year
  $("#year").textContent = new Date().getFullYear();

  // restore cart
  updateCartBadge();
  renderCart();

  // first render
  applyFilters();

  // search
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.query = $("#searchInput").value;
    applyFilters();
  });

  // live search (opcional)
  $("#searchInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    applyFilters();
  });

  // category
  $("#categorySelect").addEventListener("change", (e) => {
    state.category = e.target.value;
    applyFilters();
  });

  // sort
  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    applyFilters();
  });

  // cart
  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  // checkout
  $("#checkoutBtn").addEventListener("click", () => {
    if(state.cart.length === 0) return;
    alert("Pedido enviado! (exemplo) — aqui você integraria com seu checkout.");
  });

  // newsletter
  $("#nlForm").addEventListener("submit", handleNewsletter);
});
