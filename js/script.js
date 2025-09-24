/* ==========================
   js/script.js
   Global script for project
   ========================== */

/* ---------- Navbar scroll effect ---------- */
(function navbarEffect() {
  const navbar = document.getElementById('mainNavbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });
})();

/* ---------- Storage ---------- */
const storage = {
  get(key, fallback = null) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

/* ---------- Utilities ---------- */
function $(id) { return document.getElementById(id); }
function el(tag, props = {}) {
  const e = document.createElement(tag);
  Object.keys(props).forEach(k => e[k] = props[k]);
  return e;
}
function formatPrice(n) { return Number(n).toFixed(2); }

/* ---------- Navbar cart count ---------- */
function updateNavCartCount() {
  const cart = storage.get('pm_cart', []);
  const count = cart.reduce((s, i) => s + (i.quantity || 0), 0);
  document.querySelectorAll('.nav-cart-count').forEach(el => el.textContent = count);
}
updateNavCartCount();
window.updateNavCartCount = updateNavCartCount;

/* ====================================================
   PRODUCTS PAGE
   ==================================================== */
(function productsModule() {
  if (!$('tBody')) return;

  let products = storage.get('pm_products', []);
  const defaults = [
    { id: 1, name: 'Gaming Laptop Pro', price: 1200, image: 'images/laptopImage1.png', category: 'Electronics', stock: 10, rating: 5, desc: '16GB RAM, RTX 3060, 512GB SSD' },
    { id: 2, name: 'Office Laptop Slim', price: 850, image: 'images/laptopImage2.png', category: 'Electronics', stock: 14, rating: 4, desc: 'i5, 8GB RAM, 256GB SSD' }
  ];
  if (!products || !products.length) {
    products = defaults.slice();
    storage.set('pm_products', products);
  }

  const pName = $('pName'), pPrice = $('pPrice'), pCategory = $('pCategory'),
        pImage = $('pImage'), pStock = $('pStock'), pRating = $('pRating'), pDesc = $('pDesc'),
        addBtn = $('addBtn'), clearFormBtn = $('clearFormBtn'), clearAllBtn = $('clearAllBtn'),
        searchInput = $('searchInput'), categoryFilter = $('categoryFilter'), sortSelect = $('sortSelect'),
        tBody = $('tBody'), pagination = $('pagination'), nameAlert = $('nameAlert');

  let currentPage = 1, pageSize = 6, editingId = null;
  const nameRegex = /^[a-zA-Z0-9\s\-\_]{3,60}$/;

  function save() { storage.set('pm_products', products); }
  function nextId() { return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1; }
  function getById(id) { return products.find(p => p.id === id); }
  function clearForm() {
    [pName,pPrice,pCategory,pImage,pStock,pRating,pDesc].forEach(elm => elm && (elm.value = ''));
    if (pRating) pRating.value = '5';
    editingId = null;
    if (addBtn) addBtn.textContent = 'Add Product';
    if (nameAlert) { nameAlert.classList.add('d-none'); pName && pName.classList.remove('is-invalid','is-valid'); }
  }

  function rebuildCategoryFilter() {
    const cats = Array.from(new Set(products.map(p => p.category))).sort();
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    cats.forEach(c => {
      const opt = el('option'); opt.value = c; opt.textContent = c;
      categoryFilter.appendChild(opt);
    });
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const li = el('li'); li.className = 'page-item ' + (i === currentPage ? 'active' : '');
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', (e) => { e.preventDefault(); currentPage = i; renderProducts(); });
      pagination.appendChild(li);
    }
  }

  function renderProducts() {
    let list = products.slice();
    const q = searchInput.value.trim().toLowerCase();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q));
    const cat = categoryFilter.value;
    if (cat && cat !== 'all') list = list.filter(p => p.category === cat);
    const sortV = sortSelect.value;
    if (sortV === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortV === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortV === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => a.id - b.id);

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const paged = list.slice(start, start + pageSize);

    let rows = `
      <tr>
        <td>0</td>
        <td><img src="images/placeholder.png" class="product-img" alt="Sample"></td>
        <td>Sample Product</td>
        <td>$0.00</td>
        <td>Demo</td>
        <td>1</td>
        <td>★★★☆☆</td>
        <td class="small text-muted">Static example row</td>
        <td><div class="btn-group">
          <button class="btn btn-sm btn-success"><i class="fa fa-cart-plus"></i></button>
          <button class="btn btn-sm btn-warning">Edit</button>
          <button class="btn btn-sm btn-danger">Delete</button>
        </div></td>
      </tr>
    `;

    if (!paged.length) {
      rows += '<tr><td colspan="9" class="text-center small text-muted">No products found.</td></tr>';
    } else {
      paged.forEach(p => {
        rows += `
          <tr>
            <td>${p.id}</td>
            <td><img src="${p.image}" class="product-img" alt="${p.name}"></td>
            <td>${p.name}</td>
            <td>$${formatPrice(p.price)}</td>
            <td>${p.category}</td>
            <td>${p.stock}</td>
            <td>${'★'.repeat(p.rating)}${'☆'.repeat(5-p.rating)}</td>
            <td class="small text-muted">${p.desc || ''}</td>
            <td class="text-center">
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-success" onclick="addToCartById(${p.id})"><i class="fa fa-cart-plus"></i></button>
                <button class="btn btn-sm btn-warning" onclick="editProductById(${p.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProductById(${p.id})">Delete</button>
              </div>
            </td>
          </tr>`;
      });
    }

    tBody.innerHTML = rows;
    renderPagination(totalPages);
  }

  function addProduct() {
    const name = pName.value.trim();
    if (!nameRegex.test(name)) { pName.classList.add('is-invalid'); nameAlert.classList.remove('d-none'); return; }
    const product = {
      id: nextId(),
      name,
      price: parseFloat(pPrice.value) || 0,
      image: pImage.value.trim() || 'images/placeholder.png',
      category: pCategory.value.trim() || 'General',
      stock: parseInt(pStock.value) || 0,
      rating: parseInt(pRating.value) || 5,
      desc: pDesc.value.trim()
    };
    products.push(product);
    save(); rebuildCategoryFilter(); renderProducts(); clearForm();
  }

  function editProductById(id) {
    const p = getById(id); if (!p) return;
    editingId = id;
    pName.value = p.name; pPrice.value = p.price; pCategory.value = p.category;
    pImage.value = p.image; pStock.value = p.stock; pRating.value = p.rating; pDesc.value = p.desc;
    addBtn.textContent = 'Update Product';
  }

  function updateProduct() {
    if (editingId === null) return;
    const p = getById(editingId); if (!p) return;
    p.name = pName.value.trim();
    p.price = parseFloat(pPrice.value) || 0;
    p.category = pCategory.value.trim() || 'General';
    p.image = pImage.value.trim() || p.image;
    p.stock = parseInt(pStock.value) || 0;
    p.rating = parseInt(pRating.value) || p.rating;
    p.desc = pDesc.value.trim();
    save(); rebuildCategoryFilter(); renderProducts(); clearForm();
  }

  function deleteProductById(id) {
    products = products.filter(p => p.id !== id);
    save(); rebuildCategoryFilter(); renderProducts();
  }

  function clearAllProducts() {
    products = []; save(); rebuildCategoryFilter(); renderProducts();
  }

  function addToCartById(id) {
    const cart = storage.get('pm_cart', []);
    const prod = getById(id); if (!prod) return;
    const existing = cart.find(i => i.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, image: prod.image });
    storage.set('pm_cart', cart);
    updateNavCartCount();
  }

  addBtn?.addEventListener('click', () => addBtn.textContent.includes('Update') ? updateProduct() : addProduct());
  clearFormBtn?.addEventListener('click', clearForm);
  clearAllBtn?.addEventListener('click', clearAllProducts);
  searchInput?.addEventListener('keyup', () => { currentPage = 1; renderProducts(); });
  categoryFilter?.addEventListener('change', () => { currentPage = 1; renderProducts(); });
  sortSelect?.addEventListener('change', () => { currentPage = 1; renderProducts(); });

  rebuildCategoryFilter(); renderProducts();
  window.addToCartById = addToCartById;
  window.editProductById = editProductById;
  window.deleteProductById = deleteProductById;
})();

/* ====================================================
   CART PAGE
   ==================================================== */
(function cartModule() {
  if (!$('cartBody')) return;
  let cart = storage.get('pm_cart', []);
  const cartBody = $('cartBody');
  const subtotalEl = $('subtotal'), taxEl = $('tax'), grandEl = $('grandTotal');
  const clearCartBtn = $('clearCartBtn'), checkoutBtn = $('checkoutBtn');

  function saveCart() { storage.set('pm_cart', cart); updateNavCartCount(); }
  function renderCart() {
    if (!cart.length) { cartBody.innerHTML = '<tr><td colspan="7">Cart is empty</td></tr>'; updateSummary(); return; }
    cartBody.innerHTML = cart.map((item,i)=>`
      <tr>
        <td>${i+1}</td>
        <td><img src="${item.image}" class="product-img"></td>
        <td>${item.name}</td>
        <td>$${formatPrice(item.price)}</td>
        <td>
          <button onclick="decreaseQty(${item.id})">-</button>
          ${item.quantity}
          <button onclick="increaseQty(${item.id})">+</button>
        </td>
        <td>$${formatPrice(item.price*item.quantity)}</td>
        <td><button onclick="removeItem(${item.id})">x</button></td>
      </tr>`).join('');
    updateSummary();
  }
  function updateSummary() {
    let subtotal = cart.reduce((s,i)=>s+i.price*i.quantity,0);
    let tax = subtotal*0.1; let grand = subtotal+tax;
    subtotalEl.textContent = '$'+formatPrice(subtotal);
    taxEl.textContent = '$'+formatPrice(tax);
    grandEl.textContent = '$'+formatPrice(grand);
  }
  function removeItem(id){ cart=cart.filter(i=>i.id!==id); saveCart(); renderCart(); }
  function increaseQty(id){ const it=cart.find(i=>i.id===id); if(it){it.quantity++; saveCart(); renderCart();} }
  function decreaseQty(id){ const it=cart.find(i=>i.id===id); if(it){ if(it.quantity>1) it.quantity--; else removeItem(id); saveCart(); renderCart(); } }

  clearCartBtn?.addEventListener('click', ()=>{cart=[]; saveCart(); renderCart();});
  checkoutBtn?.addEventListener('click', ()=>alert('Checkout (demo)'));
  window.removeItem=removeItem; window.increaseQty=increaseQty; window.decreaseQty=decreaseQty;
  renderCart();
})();

/* ====================================================
   CONTACT PAGE
   ==================================================== */
(function contactModule() {
  if (!$('contactForm')) return;
  const form=$('contactForm'), cName=$('cName'), cEmail=$('cEmail'), cMessage=$('cMessage');
  const nameRegex=/^[a-zA-Z\s]{3,50}$/, emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  form.addEventListener('submit',e=>{
    e.preventDefault(); let valid=true;
    if(!nameRegex.test(cName.value.trim())){cName.classList.add('is-invalid'); valid=false;}
    if(!emailRegex.test(cEmail.value.trim())){cEmail.classList.add('is-invalid'); valid=false;}
    if(cMessage.value.trim().length<10){cMessage.classList.add('is-invalid'); valid=false;}
    if(!valid)return; alert('Message sent!'); form.reset();
  });
})();

/* ====================================================
   AUTH MODULE
   ==================================================== */
(function authModule(){
  function loadUsers(){return storage.get('pm_users',[]);}
  function saveUsers(u){storage.set('pm_users',u);}
  function setCurrentUser(u){storage.set('pm_currentUser',u);}
  function getCurrentUser(){return storage.get('pm_currentUser',null);}
  function clearCurrentUser(){storage.remove('pm_currentUser');}

  if($('signUpForm')){
    const form=$('signUpForm'), n=$('fullName'), e=$('signEmail'), p=$('signPassword'), c=$('confirmPassword');
    form.addEventListener('submit',ev=>{
      ev.preventDefault();
      if(p.value!==c.value) return alert('Passwords mismatch');
      const users=loadUsers(); if(users.find(u=>u.email===e.value)) return alert('Email exists');
      users.push({id:Date.now(),name:n.value,email:e.value,password:p.value});
      saveUsers(users); alert('Account created'); window.location='login.html';
    });
  }

  if($('loginForm')){
    const form=$('loginForm'), e=$('loginEmail'), p=$('loginPassword');
    form.addEventListener('submit',ev=>{
      ev.preventDefault();
      const u=loadUsers().find(u=>u.email===e.value && u.password===p.value);
      if(!u) return alert('Invalid login');
      setCurrentUser({id:u.id,name:u.name,email:u.email});
      alert('Welcome '+u.name); window.location='index.html';
    });
  }

  window.auth={getCurrentUser,logout:()=>{clearCurrentUser();alert('Logged out');}};
})();
