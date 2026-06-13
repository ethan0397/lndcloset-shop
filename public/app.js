const VND = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

let STATE = {
  categories: [],
  products: [],
  gallery: [],
  activeCat: "all",
  search: "",
  sort: "default",
  shipping: { fee: 30000, freeThreshold: 300000 },
  discounts: [],
  discountCode: ""
};
let CART = JSON.parse(localStorage.getItem("cart") || "[]");

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

async function init() {
  const res = await fetch("/api/products");
  const data = await res.json();
  STATE.categories = data.categories;
  STATE.products = data.products;
  STATE.gallery = data.gallery || [];
  if (data.shipping) STATE.shipping = data.shipping;
  if (data.discounts) STATE.discounts = data.discounts;
  renderCatNav();
  renderGrid();
  renderGallery();
  updateCartUI();
  bindEvents();
}

// Tinh tien giong server (products.js -> computeOrder)
function computeOrder(items, code) {
  const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
  const shippingFee =
    subtotal === 0 || subtotal >= STATE.shipping.freeThreshold ? 0 : STATE.shipping.fee;
  let discountAmount = 0;
  let appliedCode = null;
  const d = code
    ? STATE.discounts.find((x) => x.code === String(code).trim().toUpperCase())
    : null;
  if (d) {
    appliedCode = d.code;
    if (d.type === "percent") discountAmount = Math.round((subtotal * d.value) / 100);
    else if (d.type === "amount") discountAmount = Math.min(d.value, subtotal);
    else if (d.type === "freeship") discountAmount = shippingFee;
  }
  const total = Math.max(0, subtotal + shippingFee - discountAmount);
  return { subtotal, shippingFee, discountAmount, appliedCode, total };
}

function renderCatNav() {
  const nav = $("#catNav");
  const cats = [{ id: "all", name: "Tất cả" }, ...STATE.categories];
  nav.innerHTML = cats
    .map(
      (c) =>
        `<button class="cat-pill ${c.id === STATE.activeCat ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`
    )
    .join("");
}

function renderGrid() {
  const grid = $("#productGrid");
  const q = STATE.search.trim().toLowerCase();
  let list = STATE.products.filter(
    (p) =>
      (STATE.activeCat === "all" || p.category === STATE.activeCat) &&
      (q === "" || p.name.toLowerCase().includes(q))
  );

  if (STATE.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (STATE.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (STATE.sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  $("#emptyState").classList.toggle("hidden", list.length > 0);

  grid.innerHTML = list
    .map((p) => {
      const thumbs =
        p.variants && p.variants.length
          ? `<div class="swatches">${p.variants
              .slice(0, 5)
              .map(
                (v) =>
                  `<span class="swatch" style="background-image:url('${v.image}')" title="${v.name}"></span>`
              )
              .join("")}${p.variants.length > 5 ? `<span class="more">+${p.variants.length - 5}</span>` : ""}</div>`
          : "";
      return `
      <article class="card" data-id="${p.id}">
        <div class="card-img"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-price">${VND(p.price)}</div>
          ${thumbs}
        </div>
      </article>`;
    })
    .join("");
}

function renderGallery() {
  const wrap = $("#gallery");
  if (!wrap || !STATE.gallery.length) return;
  wrap.innerHTML = STATE.gallery
    .map(
      (g) =>
        `<figure class="gallery-item"><img src="${g.image}" alt="${g.caption}" loading="lazy" /><figcaption>${g.caption}</figcaption></figure>`
    )
    .join("");
}

// ---- Modal chi tiet ----
let modalSel = { product: null, variant: null, size: null, qty: 1 };

function openProduct(id) {
  const p = STATE.products.find((x) => x.id === id);
  if (!p) return;
  const variant = p.variants && p.variants.length ? p.variants[0] : null;
  modalSel = { product: p, variant, size: p.sizes[0], qty: 1 };
  renderModal();
  $("#productModal").classList.remove("hidden");
}

function currentImage() {
  return modalSel.variant ? modalSel.variant.image : modalSel.product.image;
}

function renderModal() {
  const p = modalSel.product;
  const variantBlock =
    p.variants && p.variants.length
      ? `<div class="opt-label">Mẫu: <span id="variantName">${modalSel.variant.name}</span></div>
         <div class="opt-row" id="variantRow">${p.variants
           .map(
             (v, i) =>
               `<div class="variant-opt ${v.name === modalSel.variant.name ? "active" : ""}" data-variant="${i}" title="${v.name}">
                  <img src="${v.image}" alt="${v.name}" />
                </div>`
           )
           .join("")}</div>`
      : "";

  const sizes = p.sizes
    .map(
      (s) =>
        `<div class="size-opt ${s === modalSel.size ? "active" : ""}" data-size="${s}">${s}</div>`
    )
    .join("");

  $("#modalContent").innerHTML = `
    <div class="modal-img" id="modalImg"><img src="${currentImage()}" alt="${p.name}" /></div>
    <div class="modal-info">
      <h2>${p.name}</h2>
      <div class="modal-price">${VND(p.price)}</div>
      <p class="modal-desc">${p.desc}</p>
      ${variantBlock}
      <div class="opt-label">Kích cỡ</div>
      <div class="opt-row" id="sizeRow">${sizes}</div>
      <div class="qty-row">
        <span>Số lượng</span>
        <div class="qty-ctrl">
          <button data-q="-1">−</button><span id="qtyVal">${modalSel.qty}</span><button data-q="1">+</button>
        </div>
      </div>
      <button class="btn-add" id="addToCart">🛍️ Thêm vào giỏ</button>
    </div>`;
}

function bindEvents() {
  $("#catNav").addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-pill");
    if (!btn) return;
    STATE.activeCat = btn.dataset.cat;
    renderCatNav();
    renderGrid();
  });

  $("#searchInput").addEventListener("input", (e) => {
    STATE.search = e.target.value;
    renderGrid();
  });
  $("#sortSelect").addEventListener("change", (e) => {
    STATE.sort = e.target.value;
    renderGrid();
  });

  $("#applyDiscount").addEventListener("click", applyDiscount);
  $("#discountInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyDiscount();
  });

  $("#productGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openProduct(card.dataset.id);
  });

  $("#modalContent").addEventListener("click", (e) => {
    const variant = e.target.closest(".variant-opt");
    const size = e.target.closest(".size-opt");
    const q = e.target.closest("[data-q]");
    if (variant) {
      modalSel.variant = modalSel.product.variants[+variant.dataset.variant];
      $("#modalImg").innerHTML = `<img src="${currentImage()}" alt="${modalSel.product.name}" />`;
      $("#variantName").textContent = modalSel.variant.name;
      $$("#variantRow .variant-opt").forEach((el, i) =>
        el.classList.toggle("active", i === +variant.dataset.variant)
      );
    }
    if (size) {
      modalSel.size = size.dataset.size;
      $$("#sizeRow .size-opt").forEach((el) =>
        el.classList.toggle("active", el.dataset.size === modalSel.size)
      );
    }
    if (q) {
      modalSel.qty = Math.max(1, modalSel.qty + Number(q.dataset.q));
      $("#qtyVal").textContent = modalSel.qty;
    }
    if (e.target.id === "addToCart") addToCart();
  });

  $$("[data-close]").forEach((el) =>
    el.addEventListener("click", () => $("#productModal").classList.add("hidden"))
  );

  $("#cartBtn").addEventListener("click", () => $("#cartDrawer").classList.remove("hidden"));
  $$("[data-close-cart]").forEach((el) =>
    el.addEventListener("click", () => $("#cartDrawer").classList.add("hidden"))
  );

  $("#cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const idx = +btn.dataset.idx;
    if (btn.dataset.act === "inc") CART[idx].qty++;
    if (btn.dataset.act === "dec") CART[idx].qty = Math.max(1, CART[idx].qty - 1);
    if (btn.dataset.act === "rm") CART.splice(idx, 1);
    saveCart();
  });

  $("#checkoutForm").addEventListener("submit", submitOrder);
}

function addToCart() {
  const p = modalSel.product;
  const vName = modalSel.variant ? modalSel.variant.name : "";
  const key = `${p.id}|${vName}|${modalSel.size}`;
  const existing = CART.find((x) => x.key === key);
  if (existing) {
    existing.qty += modalSel.qty;
  } else {
    CART.push({
      key,
      id: p.id,
      name: p.name,
      price: p.price,
      color: vName,
      image: currentImage(),
      size: modalSel.size,
      qty: modalSel.qty
    });
  }
  saveCart();
  $("#productModal").classList.add("hidden");
  $("#cartDrawer").classList.remove("hidden");
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartUI();
}

function applyDiscount() {
  const code = $("#discountInput").value.trim().toUpperCase();
  const msg = $("#discountMsg");
  if (!code) {
    STATE.discountCode = "";
    msg.textContent = "";
    updateCartUI();
    return;
  }
  const d = STATE.discounts.find((x) => x.code === code);
  if (d) {
    STATE.discountCode = code;
    msg.textContent = "✅ Đã áp dụng: " + d.label;
    msg.className = "discount-msg ok";
  } else {
    STATE.discountCode = "";
    msg.textContent = "❌ Mã không hợp lệ.";
    msg.className = "discount-msg err";
  }
  updateCartUI();
}

function updateCartUI() {
  const count = CART.reduce((s, x) => s + x.qty, 0);
  $("#cartCount").textContent = count;

  const t = computeOrder(CART, STATE.discountCode);
  $("#sumSubtotal").textContent = VND(t.subtotal);
  $("#sumShip").textContent = t.shippingFee === 0 ? "Miễn phí" : VND(t.shippingFee);
  $("#cartTotal").textContent = VND(t.total);

  const discRow = $("#sumDiscountRow");
  if (t.discountAmount > 0 && t.appliedCode) {
    discRow.classList.remove("hidden");
    $("#sumDiscountCode").textContent = "(" + t.appliedCode + ")";
    $("#sumDiscount").textContent = "- " + VND(t.discountAmount);
  } else {
    discRow.classList.add("hidden");
  }

  const note = $("#shipNote");
  const remain = STATE.shipping.freeThreshold - t.subtotal;
  if (t.subtotal > 0 && remain > 0) {
    note.textContent = `Mua thêm ${VND(remain)} để được miễn phí vận chuyển 🚚`;
  } else {
    note.textContent = "";
  }

  const box = $("#cartItems");
  if (CART.length === 0) {
    box.innerHTML = `<div class="cart-empty">Giỏ hàng trống 🛍️<br/>Hãy chọn vài bộ đồ mát mẻ nhé!</div>`;
    return;
  }
  box.innerHTML = CART.map(
    (it, i) => `
    <div class="cart-item">
      <div class="ci-img"><img src="${it.image}" alt="${it.name}" /></div>
      <div class="ci-main">
        <div class="ci-name">${it.name}</div>
        <div class="ci-meta">${it.color ? it.color + " · " : ""}Size ${it.size}</div>
        <div class="ci-bottom">
          <div class="ci-qty">
            <button data-act="dec" data-idx="${i}">−</button>
            <span>${it.qty}</span>
            <button data-act="inc" data-idx="${i}">+</button>
          </div>
          <strong>${VND(it.price * it.qty)}</strong>
        </div>
        <button class="ci-remove" data-act="rm" data-idx="${i}">Xóa</button>
      </div>
    </div>`
  ).join("");
}

async function submitOrder(e) {
  e.preventDefault();
  const msg = $("#orderMsg");
  if (CART.length === 0) {
    msg.textContent = "Giỏ hàng đang trống!";
    msg.className = "order-msg err";
    return;
  }
  const form = e.target;
  const customer = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    note: form.note.value.trim()
  };
  const btn = $("#orderBtn");
  btn.disabled = true;
  btn.textContent = "Đang gửi...";
  msg.textContent = "";

  try {
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, items: CART, discountCode: STATE.discountCode })
    });
    const data = await res.json();
    if (data.ok) {
      const paid = data.totals ? " Tổng: " + VND(data.totals.total) : "";
      msg.textContent = "✅ " + (data.message || "Đặt hàng thành công!") + paid;
      msg.className = "order-msg ok";
      CART = [];
      STATE.discountCode = "";
      $("#discountInput").value = "";
      $("#discountMsg").textContent = "";
      saveCart();
      form.reset();
    } else {
      msg.textContent = "❌ " + (data.error || "Có lỗi xảy ra.");
      msg.className = "order-msg err";
    }
  } catch (err) {
    msg.textContent = "❌ Không kết nối được máy chủ.";
    msg.className = "order-msg err";
  } finally {
    btn.disabled = false;
    btn.textContent = "Đặt hàng";
  }
}

init();
