const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev";
const PRICE_USD = 0.1;

/* ============================= */
/* WALLETS */
/* ============================= */
const wallets = {
  BTC: "1B4GpRC6A2tWiVAqqb9cCEJNyGHmZK6Uf4",
  ETH: "0xb0896309e10d52c6925179a7426f3d642db096db",
  LTC: "LNZBEueQ14NRHoD1RYMiJpFUxFmnfXUDZN",
  DOGE: "D6oCyXEUXwh2yHHp43WZWqjGMJNgP5dC6A",
  USDT_TRC20: "TJbd8B6dGaYYuhwRXAMppxDnYKanXHWirQ",
  USDT_BEP20: "0xb0896309e10d52c6925179a7426f3d642db096db"
};

/* ============================= */
/* CRYPTO LOGOS */
/* ============================= */
const cryptoMeta = {
  BTC: { name: "Bitcoin (BTC)", logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=025" },
  ETH: { name: "Ethereum (ETH)", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025" },
  LTC: { name: "Litecoin (LTC)", logo: "https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=025" },
  DOGE: { name: "Dogecoin (DOGE)", logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.png?v=025" },
  USDT_TRC20: { name: "USDT (TRC20)", logo: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=025" },
  USDT_BEP20: { name: "USDT (BEP20)", logo: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=025" }
};

/* ============================= */
/* COINBASE PAIRS */
/* ============================= */
const coinbasePairs = { BTC: "BTC-USD", ETH: "ETH-USD", LTC: "LTC-USD", DOGE: "DOGE-USD" };

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ============================= */
/* GET ORDER */
/* ============================= */
async function fetchOrder(orderId) {
  const r = await fetch(`${WORKER_URL}/get-order?orderId=${orderId}`);
  if (!r.ok) return null;
  return await r.json();
}

/* ============================= */
/* CALCUL AMOUNT CRYPTO */
/* ============================= */
async function getCryptoAmount(crypto) {
  if (crypto.startsWith("USDT")) return PRICE_USD.toFixed(2);
  const pair = coinbasePairs[crypto];
  const r = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
  const j = await r.json();
  return (PRICE_USD / parseFloat(j.data.amount)).toFixed(8);
}

/* ============================= */
/* INIT PAY PAGE */
/* ============================= */
(async function () {
  const orderId = getParam("orderId");
  if (!orderId) { location.href = "index.html"; return; }

  const order = await fetchOrder(orderId);
  if (!order) { location.href = "expired.html"; return; }

  const { crypto, createdAt } = order;

  // Header
  document.getElementById("orderId").innerText = orderId;
  document.getElementById("title").innerText = `Pay with ${crypto}`;
  if (cryptoMeta[crypto]) {
    document.getElementById("cryptoLogo").src = cryptoMeta[crypto].logo;
    document.getElementById("cryptoName").innerText = cryptoMeta[crypto].name;
  }

  // Address + QR
  document.getElementById("address").innerText = wallets[crypto];
  document.getElementById("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallets[crypto]}`;

  // Amount
  const amount = await getCryptoAmount(crypto);
  document.getElementById("amount").innerText = `Send exactly ${amount} ${crypto} (≈ $${PRICE_USD})`;

  // Copy address
  document.getElementById("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(wallets[crypto]); alert("Address copied!"); }
    catch(e){ alert("Copy failed. Please copy manually."); }
  };

  // Timer
  const EXPIRE_SECONDS = 1200;
  const expiresAt = createdAt + EXPIRE_SECONDS * 1000;
  const timerEl = document.getElementById("timer");
  function updateTimer() {
    const left = Math.floor((expiresAt - Date.now()) / 1000);
    if (left <= 0) { location.href = "expired.html"; return; }
    const m = Math.floor(left / 60), s = left % 60;
    timerEl.innerText = `${m}:${String(s).padStart(2,"0")}`;
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  // -------------------------
  // Submit TXID
  // -------------------------
  window.submitTxid = async function() {
    const txid = document.getElementById("txidInput").value.trim();
    if(!txid){ alert("Please enter your TXID."); return; }

    try {
      const r = await fetch(`${WORKER_URL}/verify-txid`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ orderId, txid })
      });
      const j = await r.json();
      if(j.ok && j.paid){
        alert("Payment confirmed!");
        window.location.href = `success.html?orderId=${orderId}`;
      } else {
        alert("Payment not confirmed yet. Please wait for confirmations.");
      }
    } catch(e){
      alert("Error verifying payment.");
    }
  };

})();
