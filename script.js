const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev"; // Remplace par l’URL de ton Worker
const PRICE_USD = 30; // Prix fixe en USD

// Adresse wallets (remplace par tes vrais wallets)
const wallets = {
  BTC: "1B4GpRC6A2tWiVAqqb9cCEJNyGHmZK6Uf4",
  ETH: "0xb0896309e10d52c6925179a7426f3d642db096db",
  LTC: "LNZBEueQ14NRHoD1RYMiJpFUxFmnfXUDZN",
  DOGE: "D6oCyXEUXwh2yHHp43WZWqjGMJNgP5dC6A",
  USDT_TRC20: "TJbd8B6dGaYYuhwRXAMppxDnYKanXHWirQ",
  USDT_BEP20: "0xb0896309e10d52c6925179a7426f3d642db096db"
};

// Les paires pour Coinbase
const coinbasePairs = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  LTC: "LTC-USD",
  DOGE: "DOGE-USD"
};

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function generateOrderId() {
  return "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

async function createOrder(order) {
  try {
    await fetch(WORKER_URL + "/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
  } catch (e) {
    alert("Order creation failed");
  }
}

async function getCryptoAmount(crypto) {
  // USDT est stable, 1 USDT = 1 USD
  if (crypto === "USDT_TRC20" || crypto === "USDT_BEP20") {
    return PRICE_USD.toFixed(2);
  }
  const pair = coinbasePairs[crypto];
  if (!pair) return "0.00000000";
  
  try {
    const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
    const obj = await res.json();
    const price = parseFloat(obj.data.amount);
    const amountCrypto = PRICE_USD / price;
    // Ajustement de décimales en fonction de la crypto
    return amountCrypto.toFixed(8);
  } catch (e) {
    return "0.00000000";
  }
}

(async function initPayPage() {
  const crypto = getParam("crypto");
  const email = getParam("email");

  if (!crypto || !email || !wallets[crypto]) {
    window.location.href = "index.html";
    return;
  }

  const orderId = generateOrderId();

  document.getElementById("title").innerText = `Pay with ${crypto}`;
  document.getElementById("orderId").innerText = orderId;
  document.getElementById("address").innerText = wallets[crypto];
  document.getElementById("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallets[crypto]}`;

  // Calcul montant exact
  const amount = await getCryptoAmount(crypto);
  document.getElementById("amount").innerText =
    `Send exactly ${amount} ${crypto} (≈ $${PRICE_USD} USD)`;

  // COPY ADDRESS
  document.getElementById("copyBtn").onclick = () => {
    navigator.clipboard.writeText(wallets[crypto])
      .then(() => alert("Address copied!"))
      .catch(() => alert("Copy failed"));
  };

  // CREATE ORDER BACKEND
  await createOrder({
    orderId,
    email,
    crypto,
    network: crypto,
    amountUSD: PRICE_USD
  });

  // Timer
  let time = 900;
  const timerEl = document.getElementById("timer");

  function updateTimer() {
    const m = Math.floor(time / 60);
    const s = time % 60;
    timerEl.innerText = `${m}:${String(s).padStart(2, "0")}`;
  }

  updateTimer();
  const interval = setInterval(() => {
    time--;
    if (time <= 0) {
      clearInterval(interval);
      window.location.href = "expired.html";
    } else {
      updateTimer();
    }
  }, 1000);
})();
