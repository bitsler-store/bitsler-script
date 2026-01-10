const tbody = document.getElementById("ordersTable");
Object.keys(localStorage)
  .filter(k => k.startsWith("order_"))
  .forEach(k=>{
    const o = JSON.parse(localStorage.getItem(k));
    if(!o) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.oid}</td>
      <td>${o.email}</td>
      <td>${o.crypto}</td>
      <td>${o.status}</td>
      <td>${localStorage.getItem("txid_"+o.oid)||""}</td>
      <td>${new Date(o.start).toLocaleString()}</td>
      <td>${o.ip||"?"}</td>
      <td>${o.country||"?"}</td>
    `;
    tbody.appendChild(tr);
  });
