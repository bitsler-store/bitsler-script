const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev/";
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
  return "ORD-" + Date.now();
}

(async function(){
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
  document.getElementById("amount").innerText =
    `Send exactly $${PRICE_USD} worth of ${crypto}`;

  document.getElementById("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallets[crypto]}`;

  // Create order backend
  await fetch(WORKER_URL + "/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      email,
      crypto,
      network: crypto,
      amountUSD: PRICE_USD
    })
  });

  // TIMER
  let time = 900;
  setInterval(()=>{
    time--;
    if(time <= 0){
      location.href = "expired.html";
    }
    document.getElementById("timer").innerText =
      Math.floor(time/60) + ":" + String(time%60).padStart(2,"0");
  },1000);
})();
