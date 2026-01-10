// Wallets config
const wallets = {
  BTC:{address:"bc1YOURBTCADDRESS",network:"Bitcoin",pair:"BTC-USD",logo:"https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=023"},
  ETH:{address:"0xYOURETHADDRESS",network:"Ethereum",pair:"ETH-USD",logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=023"},
  LTC:{address:"ltc1YOURLTCADDRESS",network:"Litecoin",pair:"LTC-USD",logo:"https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=023"},
  DOGE:{address:"DYOURDOGEADDRESS",network:"Dogecoin",pair:"DOGE-USD",logo:"https://cryptologos.cc/logos/dogecoin-doge-logo.png?v=023"},
  USDT_TRON:{address:"TYOURUSDTTRONADDRESS",network:"TRC20",fixed:true,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"},
  USDT_BEP20:{address:"0xYOURUSDTBEP20ADDRESS",network:"BEP20",fixed:true,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"}
};

const PRICE_USD = 10;
const EXPIRATION_MINUTES = 15;

function generateOrderId(){ return "ORD-"+Date.now()+"-"+Math.random().toString(36).substring(2,7); }

function copyAddress(){
  const text = document.getElementById("walletAddress").textContent;
  navigator.clipboard.writeText(text);
  alert("Wallet address copied");
}

(async function initPayPage(){
  const params = new URLSearchParams(window.location.search);
  const crypto = params.get("c");
  const email = params.get("e");
  if(!crypto || !wallets[crypto] || !email){
    window.location.href="index.html"; return;
  }

  const orderId = generateOrderId();

  document.getElementById("cryptoName").textContent = crypto + " Payment";
  document.getElementById("orderId").textContent = orderId;
  document.getElementById("emailClient").textContent = email;
  document.getElementById("walletAddress").textContent = wallets[crypto].address;
  document.getElementById("networkInfo").textContent = "Network: "+wallets[crypto].network;
  document.getElementById("cryptoLogo").src = wallets[crypto].logo;

  // Calcul montant crypto
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

  // QR Code gratuit
  const qrData = `${wallets[crypto].address}\nAmount: ${amount} ${crypto}`;
  document.getElementById("qrCode").src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(qrData);

  // Sauvegarde initiale order
  localStorage.setItem("order_"+orderId, JSON.stringify({
    oid:orderId,email:email,crypto:crypto,start:Date.now(),status:"pending",txid:"N/A",ip:"N/A",country:"N/A"
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

  // Vérification TXID via Worker toutes les 10s
  setInterval(async ()=>{
    try{
      const res = await fetch(`https://YOUR-WORKER.workers.dev?crypto=${crypto}&address=${wallets[crypto].address}&amount=${PRICE_USD}`);
      const data = await res.json();
      if(data.paid){
        let orderData = JSON.parse(localStorage.getItem("order_"+orderId)) || {};
        orderData.txid = data.txid || "N/A";
        orderData.status = "paid";

        // IP + pays si non déjà présents
        if(!orderData.ip || !orderData.country){
          try{
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            orderData.ip = ipData.ip || "N/A";
            orderData.country = ipData.country_name || "N/A";
          } catch(e){
            orderData.ip = "N/A";
            orderData.country = "N/A";
          }
        }

        // Mise à jour order
        localStorage.setItem("order_"+orderId, JSON.stringify(orderData));

        // Redirection success
        window.location.href = `success.html?oid=${orderId}&e=${email}`;
      }
    } catch(e){}
  },10000);

})();
