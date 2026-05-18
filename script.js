// DATA
// 1. ข้อมูลจำลอง (Data)
const products = [
    {id: 1,name:"Apple",category:"fruit",price:50,img:'https://images.pexels.com/photos/13027756/pexels-photo-13027756.jpeg'},
    {id: 2,name:"Orange",category:"fruit",price:40,img:'https://images.pexels.com/photos/30925639/pexels-photo-30925639.jpeg'},
    {id: 3,name:"Beef",category:"meat",price:250,img:'https://cdn.pixabay.com/photo/2023/01/04/14/16/meat-7696814_1280.jpg'},
    {id: 4,name:"Chicken",category:"meat",price:120,img:'https://images.pexels.com/photos/36869209/pexels-photo-36869209.jpeg'},
    {id: 5,name:"Banana",category:"fruit",price:30,img:'https://images.pexels.com/photos/5187395/pexels-photo-5187395.jpeg'},
];

// cart คือ array เก็บสินค้าในตะกร้า
// แต่ละ item มี: { id, name, price, img, qty }
let cart = [];

// currentCategory เก็บหมวดที่กำลังกรองอยู่ (default: 'all')
let currentCategory = "all";

const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const cartSidebar  = document.getElementById("cartSidebar");
const cartOverlay  = document.getElementById("cartOverlay");
const cartBadge    = document.getElementById("cartBadge");
const cartItemsEl  = document.getElementById("cartItems");
const cartTotalEl  = document.getElementById("cartTotal");
const checkoutBtn  = document.getElementById("checkoutBtn");



//* DISPLAY PRODUCTS: แสดงสินค้าบน Grid
// 2. ฟังก์ชันแสดงสินค้า (Render)

function displayProducts(items) {
     // ถ้าไม่มีสินค้าที่ตรงเงื่อนไข → แสดงข้อความแจ้ง
    if (items.length === 0) {
        productGrid.innerHTML = `<p class="empty-message">😔 ไม่พบสินค้าที่ค้นหา </p>`;
        return;
    }
     // วน map() สร้าง HTML card ให้สินค้าแต่ละตัว
    productGrid.innerHTML = items.map(item =>`
        <div class="product-card">
            <img src="${item.img}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p class="price">${item.price} บาท</p>
            <button class="btn-cart" onclick="addToCart(${item.id})">+ลงตะกร้า</button>
        </div>
        `).join("");   
}


// ==========================================
//* FILTER: กรองสินค้าตามหมวดหมู่ + คำค้นหา
// ==========================================

//* getFiltered() → คืน array สินค้าที่ผ่านทั้ง 2 เงื่อนไข
//* (category และ search ทำงานร่วมกัน ไม่แยกกัน)
// 3. ฟังก์ชันกรองตามหมวดหมู่
function getFiltered(){
    const searchValue = searchInput.value.toLowerCase();

    return products.filter(p => {
    // เงื่อนไข 1: ตรงหมวดหมู่ที่เลือก (ถ้าเลือก 'all' ผ่านหมด)
        const matchCategory = currentCategory === "all" || p.category === currentCategory;
    // เงื่อนไข 2: ชื่อสินค้ามีคำที่พิมพ์ค้นหาอยู่ไหม   
        const matchSearch = p.name.toLowerCase().includes(searchValue);
     // ต้องผ่านทั้งคู่ถึงจะแสดง
        return matchCategory && matchSearch;
    });
}

// filterCategory() → เรียกเมื่อกดปุ่มหมวดหมู่
function filterCategory(cat, btnEI) {
    // อัปเดต state
    currentCategory = cat;

    // ย้าย class .active ไปที่ปุ่มที่กด
    document.querySelectorAll(".btn-filter").forEach(btn => btn.classList.remove("active"));
    btnEI.classList.add("active");

     // แสดงสินค้าตามเงื่อนไขใหม่
    displayProducts(getFiltered());
}

// Event: ทุกครั้งที่พิมพ์ใน search box → กรองใหม่ทันที
searchInput.addEventListener("input", () =>{
    displayProducts(getFiltered());
});

// ==========================================
// CART: ระบบตะกร้าสินค้า
// ==========================================

// addToCart(id) → เพิ่มสินค้าลงตะกร้า
function addToCart(id) {
    // หาสินค้าจาก products ด้วย id
    const product = products.find(p => p.id === id);

     // ตรวจว่าสินค้านี้อยู่ในตะกร้าแล้วหรือยัง
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
     // ถ้ามีอยู่แล้ว → เพิ่มจำนวน (qty) ขึ้น 1
        existingItem.qty += 1;    
    } else {
        // ถ้ายังไม่มี → push สินค้าใหม่เข้า cart พร้อม qty = 1
        cart.push({ ...product, qty: 1 });

    }
    // อัปเดต UI ทุกส่วนที่เกี่ยวกับตะกร้า
    updateCartUI();
    animateBadge();
}

// changeQty(id, delta) → เปลี่ยนจำนวนสินค้าในตะกร้า
// delta = +1 (เพิ่ม) หรือ -1 (ลด)
function changeQty(id, delta) {
     // หา item ใน cart
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.qty += delta;
    // ถ้า qty เหลือ 0 หรือน้อยกว่า → ลบออกจาก cart
    if (item.qty <= 0) {
        cart = cart.filter(item => item.id !== id);
    }

    updateCartUI();


}

// ==========================================
// UPDATE CART UI: วาด UI ตะกร้าใหม่ทุกครั้งที่ cart เปลี่ยน
// ==========================================

function updateCartUI() {
    // --- Badge (จำนวนรายการทั้งหมดในตะกร้า) ---
    // ใช้ reduce() รวมจำนวน qty ทุก item
    const totalQty = cart.reduce((sum, item) => sum + item.qty,0);
    cartBadge.textContent = totalQty;

    // --- Cart Items (รายการสินค้า) ---
    if (cart.length === 0) {
        // ตะกร้าว่าง → แสดงข้อความ
        cartItemsEl.innerHTML = `
        <div class="cart-empty">
            🛒<br>ตะกร้าว่างเปล่า<br>
            <small>เพิ่มสินค้าเพื่อเริ่มต้น</small>
        </div>
        `;
    } else {
     // มีสินค้า → วน map() สร้าง HTML แต่ละ item
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price} × ${item.qty}  = ${item.price * item.qty} บาท</div>
                </div>
                <div class="qty-control">
                    <button class="btn-qty" onclick="changeQty(${item.id}, -1)">-</button>
                    <span class="qty-number">${item.qty}</span>
                    <button class="btn-qty" onclick="changeQty(${item.id},+1)">+</button>

                </div>
            </div>
            `).join("");
    }
    // --- Total Price (ราคารวม) ---
    // ใช้ reduce() คูณ price × qty ของทุก item แล้วรวมกัน
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartTotalEl.textContent = `${total.toLocaleString()} บาท`;

    // ปุ่มชำระเงิน: disabled ถ้าตะกร้าว่าง
    checkoutBtn.disabled = cart.length === 0;

}

// ==========================================
// CART OPEN / CLOSE
// ==========================================

// เปิด sidebar ตะกร้า
document.getElementById("cartToggle").addEventListener("click", () => {
    cartSidebar.classList.add("open");
    cartOverlay.classList.add("show");
});

// ปิด sidebar ตะกร้า (กด ✕ หรือคลิก overlay)
function closeCart() {
    cartSidebar.classList.remove("open");
    cartOverlay.classList.remove("show");
}

// ==========================================
// BADGE ANIMATION: เด้งเมื่อเพิ่มสินค้า
// ==========================================
function animateBadge() {
    cartBadge.classList.add("bump");
    // เอา class ออกหลัง 200ms เพื่อให้ animation รีเซ็ต
    setTimeout(() => cartBadge.classList.remove("bump"),200);

}

// ==========================================
// CHECKOUT: ชำระเงิน
// ==========================================

function checkout() {
    if (cart.length === 0) return;

    // รวมชื่อสินค้าทั้งหมดในตะกร้า
    const summary = cart.map(item => `•${item.name} ×${item.qty}`).join("\n");
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    alert (`✅ สั่งซื้อสำเร็จ!\n\n${summary}\n\nรวม ${total.toLocaleString()} บาท`);

    // ล้างตะกร้า
    cart = [];
    updateCartUI();
    closeCart();
}

// ==========================================
// INIT: เริ่มต้นแสดงสินค้าทั้งหมด
// ==========================================
displayProducts(products);
updateCartUI();







