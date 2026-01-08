const PRICE_USD = 30;
const WORKER_URL = "https://crypto-pay-worker.bijamalala.workers.dev/check";

const wallets = {
  BTC:{addr:"bc1XXXX",net:"Bitcoin",pair:"BTC-USD"},
  ETH:{addr:"0xXXXX",net:"ERC20",pair:"ETH-USD"},
  LTC:{addr:"ltc1XXXX",net:"Litecoin",pair:"LTC-USD"},
  DOGE:{addr:"DXXXX",net:"Dogecoin",pair:"DOGE-USD"},
  USDT_TRON:{addr:"TXXXX",net:"TRC20",fixed:true},
  USDT_BEP20:{addr:"0xXXXX",net:"BEP20",fixed:true}
};

const p=new URLSearchParams(location.search);
const crypto=p.get("crypto");
const email=p.get("email");
if(!wallets[crypto]) location.href="index.html";

const orderId="ORD-"+Date.now();
localStorage.setItem("order_"+orderId,JSON.stringify({orderId,email,crypto,start:Date.now()}));

document.getElementById("cryptoName").innerText=crypto;
document.getElementById("orderId").innerText=orderId;
document.getElementById("email").innerText=email;
document.getElementById("address").innerText=wallets[crypto].addr;
document.getElementById("network").innerText="⚠️ Réseau : "+wallets[crypto].net;

async function loadAmount(){
  let amt;
  if(wallets[crypto].fixed){
    amt=PRICE_USD.toFixed(2);
  }else{
    const r=await fetch(`https://api.coinbase.com/v2/prices/${wallets[crypto].pair}/spot`);
    const d=await r.json();
    amt=(PRICE_USD/d.data.amount).toFixed(8);
  }
  document.getElementById("amount").innerText=`Envoyer ${amt} ${crypto}`;
  document.getElementById("qr").src=
   `https://api.qrserver.com/v1/create-qr-code/?data=${wallets[crypto].addr}`;
}
loadAmount();

function copyAddress(){
  navigator.clipboard.writeText(wallets[crypto].addr);
  alert("Adresse copiée");
}

// TIMER
let t=900;
setInterval(()=>{
  let m=Math.floor(t/60),s=t%60;
  document.getElementById("timer").innerText=`${m}:${s<10?"0":""}${s}`;
  if(--t<0) location.href="expired.html";
},1000);

// ======= DÉTECTION AUTO =======
function success(txid){
  localStorage.setItem("paid_"+orderId,txid);
  location.href=generateDownload();
}

function generateDownload(){
  const token=Math.random().toString(36).slice(2);
  localStorage.setItem("dl_"+token,JSON.stringify({
    fp:navigator.userAgent,
    exp:Date.now()+3600000,
    used:false
  }));
  return `success.html?token=${token}`;
}

// USDT via Worker
async function checkUSDT(){
  const r=await fetch(`${WORKER_URL}?order=${orderId}&crypto=${crypto}`);
  const d=await r.json();
  if(d.paid) success(d.txid);
}

// BTC/ETH/LTC/DOGE via API publiques (simplifié)
setInterval(()=>{
  if(crypto.startsWith("USDT")) checkUSDT();
},30000);
