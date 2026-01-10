const WORKER_URL = "https://TON-WORKER.workers.dev";
const PRICE_USD = 10;

const wallets = {
  BTC: "BTC_ADDRESS",
  ETH: "ETH_ADDRESS",
  LTC: "LTC_ADDRESS",
  DOGE: "DOGE_ADDRESS",
  USDT_TRC20: "TRON_ADDRESS",
  USDT_BEP20: "BSC_ADDRESS"
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
