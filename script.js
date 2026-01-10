// script.js pour pay.html

// Wallets config
const wallets = {
  BTC:{address:"1B4GpRC6A2tWiVAqqb9cCEJNyGHmZK6Uf4",network:"Bitcoin",pair:"BTC-USD",logo:"https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=023"},
  ETH:{address:"0xb0896309e10d52c6925179a7426f3d642db096db",network:"Ethereum",pair:"ETH-USD",logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=023"},
  LTC:{address:"LNZBEueQ14NRHoD1RYMiJpFUxFmnfXUDZN",network:"Litecoin",pair:"LTC-USD",logo:"https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=023"},
  DOGE:{address:"D6oCyXEUXwh2yHHp43WZWqjGMJNgP5dC6A",network:"Dogecoin",pair:"DOGE-USD",logo:"https://cryptologos.cc/logos/dogecoin-doge-logo.png?v=023"},
  USDT_TRON:{address:"TJbd8B6dGaYYuhwRXAMppxDnYKanXHWirQ",network:"TRC20",fixed:true,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"},
  USDT_BEP20:{address:"0xb0896309e10d52c6925179a7426f3d642db096db",network:"BEP20",fixed:true,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"}
};

const PRICE_USD = 10;
const EXPIRATION_MINUTES = 15;

// Générer Order ID unique
function generateOrderId(){ return "ORD-"+Date.now()+"-"+Math.random().toString(36).substring(2,7); }

// Copie adresse
function copyAddress(){
  const text = document.getElementById("walletAddress").textContent;
  navigator.clipboard.writeText(text);
  alert("Wallet address copied");
}

// Initialisation page pay
(async function initPayPage(){
  const params = new URLSearchParams(window.location.search);
  const crypto = params.get("c");
  const email = params.get("e");
  if(!crypto || !wallets[crypto] || !email){
    window.location.href="index.html";
    return;
  }

  const orderId = generateOrderId();

  document.getElementById("cryptoName").textContent = crypto + " Payment";
  document.getElementById("orderId").textContent = orderId;
  document.getElementById("emailClient").textContent = email;
  document.getElementById("walletAddress").textContent = wallets[crypto].address;
  document.getElementById("networkInfo").textContent = "Network: "+wallets[crypto].network;
  document.getElementById("cryptoLogo").src = wallets[crypto].logo;

  // Calculer montant crypto
  let amount;
  if(wallets[crypto].fixed) amount = PRICE_USD;
  else {
    try{
      const r = await fetch(`https://api.coinbase.com/v2/prices/${wallets[crypto].pair}/spot`);
      const d = await r.json();
      amount = (PRICE_USD / parseFloat(d.data.amount)).toFixed(8);
    }catch(e){ amount="0.00000000"; }
  }
  document.getElementById("amountCrypto").textContent = `Send exactly ${amount} ${crypto}`;

  // QR Code gratuit fonctionnel
  const qrData = `${wallets[crypto].address}\nAmount: ${amount} ${crypto}`;
  document.getElementById("qrCode").src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(qrData);

  // Sauvegarder order local
  localStorage.setItem("order_"+orderId, JSON.stringify({
    oid:orderId,email:email,crypto:crypto,start:Date.now(),status:"pending"
  }));

  // Timer
  let seconds = EXPIRATION_MINUTES*60;
  const timerEl = document.getElementById("timer");
  const interval = setInterval(()=>{
    const m=Math.floor(seconds/60);
    const s=seconds%60;
    timerEl.textContent = `${m}:${s.toString().padStart(2,"0")}`;
    seconds--;
    if(seconds<0){ clearInterval(interval); window.location.href="expired.html"; }
  },1000);

  // Vérification TXID via Cloudflare Worker
setInterval(async ()=>{
  try{
    const res = await fetch(`https://YOUR-WORKER.workers.dev?crypto=${crypto}&address=${wallets[crypto].address}&amount=${PRICE_USD}`);
    const data = await res.json();
    if(data.paid){
      const orderData = JSON.parse(localStorage.getItem("order_"+orderId)) || {};
      orderData.txid = data.txid;

      // Récupérer IP + pays via ipapi.co
      fetch('https://ipapi.co/json/')
        .then(res=>res.json())
        .then(ipData=>{
          orderData.ip = ipData.ip || "N/A";
          orderData.country = ipData.country_name || "N/A";
          orderData.status = "paid";
          localStorage.setItem("order_"+orderId, JSON.stringify(orderData));
          window.location.href = `success.html?oid=${orderId}&e=${email}`;
        }).catch(e=>{
          orderData.ip = "N/A";
          orderData.country = "N/A";
          orderData.status = "paid";
          localStorage.setItem("order_"+orderId, JSON.stringify(orderData));
          window.location.href = `success.html?oid=${orderId}&e=${email}`;
        });
    }
  }catch(e){}
},20000);

})();
