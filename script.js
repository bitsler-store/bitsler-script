const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev";
const PRICE_USD = 0.1;

/* ============================= */
/* WALLETS */
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
const coinbasePairs = { BTC: "BTC-USD", ETH: "ETH-USD", LTC: "LTC-USD", DOGE: "DOGE-USD" };

/* ============================= */
/* PARAMS & UTIL */
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }

// 🔐 GENERATE HMAC SIGNATURE
async function signHmac(secret, body){
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(JSON.stringify(body)));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/* ============================= */
/* FETCH ORDER */
async function fetchOrder(orderId){
  try{
    const r = await fetch(`${WORKER_URL}/public/order?orderId=${orderId}`);
    if(!r.ok) return null;
    return await r.json();
  } catch(e){ return null; }
}

/* ============================= */
/* GET CRYPTO AMOUNT */
async function getCryptoAmount(crypto){
  if(crypto.startsWith("USDT")) return PRICE_USD.toFixed(2);
  try{
    const r = await fetch(`https://api.coinbase.com/v2/prices/${coinbasePairs[crypto]}/spot`);
    const j = await r.json();
    return (PRICE_USD / parseFloat(j.data.amount)).toFixed(8);
  } catch(e){ return "0.00000000"; }
}

/* ============================= */
/* INIT PAY PAGE */
(async function(){
  const orderId = getParam("orderId");
  if(!orderId){ location.href="index.html"; return; }

  const order = await fetchOrder(orderId);
  if(!order){ location.href="expired.html"; return; }

  const { crypto, createdAt } = order;
  const expiresAt = order.expiresAt || (createdAt + 20*60*1000); // fallback TTL 20 min

  // Header
  document.getElementById("orderId").innerText = orderId;
  document.getElementById("title").innerText = `Pay with ${crypto}`;
  if(cryptoMeta[crypto]){
    document.getElementById("cryptoLogo").src = cryptoMeta[crypto].logo;
    document.getElementById("cryptoName").innerText = cryptoMeta[crypto].name;
  }

  // Address + QR
  document.getElementById("address").innerText = wallets[crypto];
  document.getElementById("qr").src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallets[crypto]}`;

  // Amount
  const amount = await getCryptoAmount(crypto);
  document.getElementById("amount").innerText = `Send exactly ${amount} ${crypto} (≈ $${PRICE_USD})`;

  // Copy
  document.getElementById("copyBtn").onclick = async ()=>{
    try{ await navigator.clipboard.writeText(wallets[crypto]); alert("Address copied!"); }
    catch(e){ alert("Copy failed. Please copy manually."); }
  };

  // Timer
  const timerEl = document.getElementById("timer");
  function updateTimer(){
    const left = Math.floor((expiresAt - Date.now())/1000);
    if(left<=0){ location.href="expired.html"; return; }
    const m = Math.floor(left/60), s = left%60;
    timerEl.innerText = `${m}:${String(s).padStart(2,"0")}`;
  }
  updateTimer();
  setInterval(updateTimer,1000);

  // TXID submit
  window.submitTxid = async function(){
    const txid = document.getElementById("txidInput").value.trim();
    if(!txid){ alert("Please enter your TXID."); return; }

    const HMAC_SECRET = "6f93a9f24c8b8c91e8e2aaf3d7c1b5f49d29a0e8d3b2a1f9c7e6d4b3a2f1e9c"; // même clé que côté worker
    const body = { orderId, txid };
    const signature = await signHmac(HMAC_SECRET, body);

    try{
      const r = await fetch(`${WORKER_URL}/verify-txid`,{
        method:"POST",
        headers:{"Content-Type":"application/json", "X-Signature": signature},
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if(j.ok && j.paid){
        alert("Payment confirmed!");
        window.location.href = `success.html?orderId=${orderId}`;
      } else if(j.expired){
        alert("Order expired!");
        location.href = "expired.html";
      } else {
        alert("Payment not confirmed yet. Please wait for confirmations.");
      }
    } catch(e){ alert("Error verifying payment."); }
  };
})();
