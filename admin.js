const t=document.getElementById("t");
for(let k in localStorage){
 if(k.startsWith("order_")){
  const o=JSON.parse(localStorage[k]);
  const p=localStorage.getItem("paid_"+o.orderId)?"✅ Payé":"⏳";
  t.innerHTML+=`<tr><td>${o.orderId}</td><td>${o.email}</td><td>${o.crypto}</td><td>${p}</td></tr>`;
 }
}
const t=document.getElementById("t");
for(let k in localStorage){
 if(k.startsWith("order_")){
  const o=JSON.parse(localStorage[k]);
  const p=localStorage.getItem("paid_"+o.orderId)?"✅ Payé":"⏳";
  t.innerHTML+=`<tr><td>${o.orderId}</td><td>${o.email}</td><td>${o.crypto}</td><td>${p}</td></tr>`;
 }
}
