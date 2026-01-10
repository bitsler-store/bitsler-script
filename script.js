const PRICE_USD = 10;
const EXPIRATION_MIN = 15;

const wallets = {
  BTC:{addr:"bc1XXXX", pair:"BTC-USD", net:"Bitcoin"},
  ETH:{addr:"0xXXXX", pair:"ETH-USD", net:"Ethereum"},
  LTC:{addr:"ltc1XXXX", pair:"LTC-USD", net:"Litecoin"},
  DOGE:{addr:"DXXXX", pair:"DOGE-USD", net:"Dogecoin"},
  USDT_TRON:{addr:"TXXXX", fixed:true, net:"TRC20"},
  USDT_BEP20:{addr:"0xXXXX", fixed:true, net:"BEP20"}
};

function uid(){return "ORD-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)}

async function getIP(){
  try{
    const r=await fetch("https://ipapi.co/json/");
    return await r.json();
  }catch{ return {ip:"?",country_name:"?"} }
}

async function getAmount(crypto){
  if(wallets[crypto].fixed) return PRICE_USD.toFixed(2);
  const r=await fetch(`https://api.coinbase.com/v2/prices/${wallets[crypto].pair}/spot`);
  const d=await r.json();
  return (PRICE_USD / d.data.amount).toFixed(8);
}
