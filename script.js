const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev";
const PRICE_USD = 10;

const wallets = {
  BTC: "1B4GpRC6A2tWiVAqqb9cCEJNyGHmZK6Uf4",
  ETH: "0xb0896309e10d52c6925179a7426f3d642db096db",
  LTC: "LNZBEueQ14NRHoD1RYMiJpFUxFmnfXUDZN",
  DOGE: "D6oCyXEUXwh2yHHp43WZWqjGMJNgP5dC6A",
  USDT_TRC20: "TJbd8B6dGaYYuhwRXAMppxDnYKanXHWirQ",
  USDT_BEP20: "0xb0896309e10d52c6925179a7426f3d642db096db"
};

function getParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

function generateOrderId(){
  return "ORD-" + Date.now() + "-" + Math.floor(Math.random()*1000);
}

async function createOrder(order){
  try {
    const resp = await fetch(WORKER_URL + "/create-order", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(order)
    });
    return await resp.json();
  } catch(e){
    alert("Failed to create order. Backend issue.");
    return null;
  }
}

(function(){
  const crypto = getParam("crypto");
  const email = getParam("email");

  if(!crypto || !email){
    location.href = "index.html";
    return;
  }

  const orderId = generateOrderId();

  document.getElementById("title").innerText = `Pay with ${crypto}`;
  document.getElementById("orderId").innerText = orderId;
  document.getElementById("address").innerText = wallets[crypto];
  document.getElementById("amount").innerText = `Send exactly $${PRICE_USD} worth of ${crypto}`;
  document.getElementById("qr").src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallets[crypto]}`;

  // COPY ADDRESS
  document.getElementById("copyBtn").onclick = () => {
    navigator.clipboard.writeText(wallets[crypto])
      .then(()=>alert("Address copied!"))
      .catch(()=>alert("Copy failed"));
  };

  // CREATE ORDER IMMEDIATEMENT
  createOrder({
    orderId,
    email,
    crypto,
    network: crypto,
    amountUSD: PRICE_USD
  });

  // TIMER
  let time = 900; // 15 min
  const timerEl = document.getElementById("timer");

  function updateTimer(){
    const m = Math.floor(time/60);
    const s = time % 60;
    timerEl.innerText = `${m}:${String(s).padStart(2,'0')}`;
  }

  updateTimer(); // affiche timer dès le début

  const interval = setInterval(()=>{
    time--;
    if(time <= 0){
      clearInterval(interval);
      location.href = "expired.html";
    } else {
      updateTimer();
    }
  },1000);

})();
