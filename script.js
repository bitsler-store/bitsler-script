// script.js for index.html & pay.html

// START PAYMENT from index.html
function startPayment(crypto){
  const email = document.getElementById("email").value.trim();
  if(!email){ alert("Email required"); return; }
  if(!email.includes("@")){ alert("Enter a valid email"); return; }
  window.location.href = `pay.html?c=${encodeURIComponent(crypto)}&e=${encodeURIComponent(email)}`;
}

// PAY.HTML logic
const PRICE_USD = 10;
const EXPIRATION_MINUTES = 15;
const wallets = {
  BTC:{address:"bc1XXXXXXXX",network:"Bitcoin",pair:"BTC-USD",logo:"https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=023"},
  ETH:{address:"0xXXXXXXXX",network:"Ethereum",pair:"ETH-USD",logo:"https://cryptologos.cc/logos/ethereum-eth-logo.png?v=023"},
  LTC:{address:"ltc1XXXXXXXX",network:"Litecoin",pair:"LTC-USD",logo:"https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=023"},
  DOGE:{address:"DXXXXXXXX",network:"Dogecoin",pair:"DOGE-USD",logo:"https://cryptologos.cc/logos/dogecoin-doge-logo.png?v=023"},
  USDT_TRON:{address:"TXXXXXXXX",network:"TRC20",fixed:true,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"},
  USDT_BEP20:{address:"0xXXXXXXXX",network:"BEP20",fixed:true,logo:"https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"}
};

function generateOrderId(){ return "ORD-"+Date.now()+"-"+Math.random().toString(36).substring(2,7); }

async function getCryptoAmount(crypto){
  if(wallets[crypto].fixed) return PRICE_USD.toFixed(2);
  try{
    const r = await fetch(`https://api.coinbase.com/v2/prices/${wallets[crypto].pair}/spot`);
    const d = await r.json();
    return (PRICE_USD/d.data.amount).toFixed(8);
  }catch(e){ return "0.00000000"; }
}

async function getClientIP(){
  try{
    const r = await fetch('https://ipapi.co/json/');
    return await r.json();
  }catch(e){ return {ip:"?IP?",country_name:"?Country?"}; }
}

(async function initPayPage(){
  if(!document.getElementById("orderId")) return; 
  const params = new URLSearchParams(window.location.search);
  const crypto = params.get("c");
  const email = params.get("e");
  if(!crypto||!wallets[crypto]||!email){ window.location.href="index.html"; return; }

  const orderId = generateOrderId();
  const ipInfo = await getClientIP();

  document.getElementById("cryptoName").textContent = crypto + " Payment";
  document.getElementById("orderId").textContent = orderId;
  document.getElementById("emailClient").textContent = email;
  document.getElementById("walletAddress").textContent = wallets[crypto].address;
  document.getElementById("networkInfo").textContent = "Network: "+wallets[crypto].network;
  document.getElementById("cryptoLogo").src = wallets[crypto].logo;

  const amount = await getCryptoAmount(crypto);
  document.getElementById("amountCrypto").textContent = `Send exactly ${amount} ${crypto}`;
  document.getElementById("qrCode").src = "https://api.qr-code-generator.com/v1/create?size=200x200&data="+encodeURIComponent(wallets[crypto].address);

  // Save order localStorage
  localStorage.setItem("order_"+orderId, JSON.stringify({
    oid:orderId,email:email,crypto:crypto,start:Date.now(),
    ip:ipInfo.ip,country:ipInfo.country_name,status:"pending"
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

  // Cloudflare Worker check TXID every 20s
  setInterval(async ()=>{
    try{
      const res = await fetch(`https://YOUR-WORKER.workers.dev?crypto=${crypto}&address=${wallets[crypto].address}&amount=${amount}`);
      const data = await res.json();
      if(data.paid){
        localStorage.setItem("txid_"+orderId, data.txid);
        window.location.href = `success.html?oid=${orderId}&e=${email}`;
      }
    }catch(e){}
  },20000);

})();

function copyAddress(){
  const text = document.getElementById("walletAddress").textContent;
  navigator.clipboard.writeText(text);
  alert("Wallet address copied");
}
