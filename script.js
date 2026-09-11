/* ==========================================================================
   CONFIGURAZIONE SCORTE E SHOPIFY
   ========================================================================== */
const STORE_CONFIG = {
  shopifyDomain: "tuo-store.myshopify.com",
  inventory: {
    "S": { stock: 8, variantId: "4412345678901" },
    "M": { stock: 15, variantId: "4412345678902" },
    "L": { stock: 12, variantId: "4412345678903" },
    "XL": { stock: 4, variantId: "4412345678904" },
    "XXL": { stock: 0, variantId: "4412345678905" }
  },
  modelPath: "tshirt.glb"
};

let localInventory = JSON.parse(localStorage.getItem("gh2_tshirt_stock")) || STORE_CONFIG.inventory;

function saveInventory() {
  localStorage.setItem("gh2_tshirt_stock", JSON.stringify(localInventory));
}

let selectedSize = null;

const sizeButtonsContainer = document.getElementById("size-options");
const stockFeedback = document.getElementById("stock-feedback");
const buyBtn = document.getElementById("buy-button");
const mobileBuyBtn = document.getElementById("mobile-buy-btn");
const stockListDisplay = document.getElementById("stock-list-display");

function renderSizes() {
  sizeButtonsContainer.innerHTML = "";
  stockListDisplay.innerHTML = "";

  Object.keys(localInventory).forEach((size) => {
    const item = localInventory[size];
    const isOutOfStock = item.stock <= 0;

    const btn = document.createElement("button");
    btn.className = `size-btn ${selectedSize === size ? "active" : ""}`;
    btn.disabled = isOutOfStock;
    btn.innerHTML = `
      <span>${size}</span>
      <span class="size-stock">${isOutOfStock ? "OUT" : item.stock + "pz"}</span>
    `;

    btn.addEventListener("click", () => {
      selectSize(size);
    });

    sizeButtonsContainer.appendChild(btn);

    const li = document.createElement("li");
    li.className = isOutOfStock ? "out" : "";
    li.innerHTML = `
      <span>Taglia ${size}</span>
      <strong>${isOutOfStock ? "Esaurita" : item.stock + " disponibili"}</strong>
    `;
    stockListDisplay.appendChild(li);
  });
}

function selectSize(size) {
  selectedSize = size;
  const currentStock = localInventory[size].stock;

  if (currentStock <= 3) {
    stockFeedback.textContent = `Affrettati! Solo ${currentStock} rimaste in ${size}!`;
    stockFeedback.style.color = "#ff4d6d";
  } else {
    stockFeedback.textContent = `Taglia ${size} disponibile (${currentStock} scorte)`;
    stockFeedback.style.color = "#6be3ff";
  }

  buyBtn.disabled = false;
  buyBtn.querySelector(".btn-text").textContent = `ACQUISTA ORA - TAGLIA ${size}`;

  if (mobileBuyBtn) {
    mobileBuyBtn.disabled = false;
    mobileBuyBtn.textContent = `ACQUISTA (${size})`;
  }

  renderSizes();
}

function handlePurchase() {
  if (!selectedSize || localInventory[selectedSize].stock <= 0) return;

  const item = localInventory[selectedSize];
  item.stock -= 1;
  saveInventory();

  const checkoutUrl = `https://${STORE_CONFIG.shopifyDomain}/cart/${item.variantId}:1?checkout`;

  buyBtn.querySelector(".btn-text").textContent = "REINDIRIZZAMENTO...";
  if (mobileBuyBtn) mobileBuyBtn.textContent = "ATTENDI...";

  setTimeout(() => {
    window.location.href = checkoutUrl;
  }, 400);
}

buyBtn.addEventListener("click", handlePurchase);
if (mobileBuyBtn) mobileBuyBtn.addEventListener("click", handlePurchase);

renderSizes();

/* ==========================================================================
   VIEWER 3D THREE.JS
   ========================================================================== */
const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("tshirt-canvas");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  canvasContainer.clientWidth / canvasContainer.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0.0, 3.2);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Luce Rossa di taglio
const redSpotlight = new THREE.PointLight(0xff002b, 4.5, 10);
redSpotlight.position.set(2.5, 1.2, -1.0);
scene.add(redSpotlight);

// Luce Ciano fredda frontale
const cyanKeyLight = new THREE.DirectionalLight(0x7cd7ff, 2.0);
cyanKeyLight.position.set(-2.0, 1.5, 2.5);
scene.add(cyanKeyLight);

// Luce ambientale
const ambientLight = new THREE.AmbientLight(0x1a0508, 1.2);
scene.add(ambientLight);

const tshirtModel = new THREE.Group();
scene.add(tshirtModel);

function createGH2Texture() {
  const texCanvas = document.createElement("canvas");
  texCanvas.width = 512;
  texCanvas.height = 512;
  const ctx = texCanvas.getContext("2d");

  ctx.fillStyle = "#e8eaed";
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#0c0406";
  ctx.font = "bold 55px serif";
  ctx.textAlign = "center";
  ctx.fillText("Going Hard 2", 256, 220);

  ctx.fillStyle = "#d90429";
  ctx.font = "italic 32px sans-serif";
  ctx.fillText("TONY BOY", 256, 270);

  return new THREE.CanvasTexture(texCanvas);
}

function createFallbackTshirt() {
  const shirtMaterial = new THREE.MeshStandardMaterial({
    map: createGH2Texture(),
    roughness: 0.65,
    metalness: 0.1
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.35, 8, 8, 8), shirtMaterial);
  tshirtModel.add(torso);

  const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.6, 16), shirtMaterial);
  sleeveL.rotation.z = Math.PI / 3;
  sleeveL.position.set(-0.75, 0.42, 0);
  tshirtModel.add(sleeveL);

  const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.6, 16), shirtMaterial);
  sleeveR.rotation.z = -Math.PI / 3;
  sleeveR.position.set(0.75, 0.42, 0);
  tshirtModel.add(sleeveR);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.04, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 })
  );
  collar.rotateX(Math.PI / 2);
  collar.position.set(0, 0.72, 0);
  tshirtModel.add(collar);
}

// Caricamento modello reale con fallback sicuro
// Contenitore per centrare geometricamente qualsiasi modello disassato
const pivotGroup = new THREE.Group();
tshirtModel.add(pivotGroup);

const loader = new THREE.GLTFLoader();
loader.load(
  STORE_CONFIG.modelPath,
  (gltf) => {
    // Rimuove eventuali fallback precedenti
    while (pivotGroup.children.length > 0) {
      pivotGroup.remove(pivotGroup.children[0]);
    }

    const realModel = gltf.scene;

    // 1. Calcola il volume e il centro geometrico effettivo della mesh
    const bbox = new THREE.Box3().setFromObject(realModel);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());

    // 2. Scala proporzionale: adatta il modello alla vista
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scaleFactor = 1.9 / maxDimension;
    realModel.scale.setScalar(scaleFactor);

    // 3. Trasla il modello rispetto al centro geometrico calcolato e applica la scala
    realModel.position.x = -center.x * scaleFactor;
    realModel.position.y = -center.y * scaleFactor;
    realModel.position.z = -center.z * scaleFactor;

    pivotGroup.add(realModel);
  },
  undefined,
  (error) => {
    console.warn("Caricamento fallback procedurale:", error);
    createFallbackTshirt();
  }
);

let targetRotationY = 0;
let targetRotationX = 0;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY;
  targetRotationY = scrollPosition * 0.005;
  targetRotationX = Math.sin(scrollPosition * 0.003) * 0.2;
});

canvasContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousMousePosition.x;
  const deltaY = e.clientY - previousMousePosition.y;
  targetRotationY += deltaX * 0.01;
  targetRotationX += deltaY * 0.01;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvasContainer.addEventListener("touchstart", (e) => {
  isDragging = true;
  previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

window.addEventListener("touchend", () => {
  isDragging = false;
});

window.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const deltaX = e.touches[0].clientX - previousMousePosition.x;
  targetRotationY += deltaX * 0.015;
  previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.0015;
  tshirtModel.position.y = Math.sin(time) * 0.04;

  tshirtModel.rotation.y += (targetRotationY - tshirtModel.rotation.y) * 0.08;
  tshirtModel.rotation.x += (targetRotationX - tshirtModel.rotation.x) * 0.08;

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});