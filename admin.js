const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev";

/* ========================= */
/* COUNTRY MAP */
/* ========================= */
const COUNTRY_NAMES = {
  FR: "France", US: "United States", CA: "Canada", GB: "United Kingdom",
  DE: "Germany", ES: "Spain", IT: "Italy", BE: "Belgium", CH: "Switzerland",
  MA: "Morocco", DZ: "Algeria", TN: "Tunisia", SN: "Senegal",
  CI: "Ivory Coast", CM: "Cameroon", NG: "Nigeria",
  BR: "Brazil", IN: "India", CN: "China", RU: "Russia", JP: "Japan",
  AF: "Afghanistan", ZA: "Afrique du Sud", AL: "Albanie",
  AO: "Angola", SA: "Arabie Saoudite", AR: "Argentine", AU: "Australie",
  AT: "Autriche", AZ: "Azerbaïdjan", BS: "Bahamas", BHL: "Bahrein",
  BD: "Bangladesh",  	BY: "Bélarus", BJ: "Bénin",  	BO: "Bolivie",
  BW: "Botswana", BG: "Bulgarie",  	BF: "Burkina Faso", BI: "Burundi",
  KH: "Cambodge", CL: "Chili", CY: "Chypre", CO: "Colombie", KM: "Comores",
  
};

function countryName(code) {
  return COUNTRY_NAMES[code] || code || "-";
}

/* ========================= */
/* LOGIN */
/* ========================= */
async function login() {
  const pin = document.getElementById("pin").value.trim();
  if (!pin) return alert("PIN requis");

  const res = await fetch(WORKER_URL + "/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin })
  });

  if (!res.ok) {
    alert("PIN incorrect");
    return;
  }

  const data = await res.json();
  localStorage.setItem("adminToken", data.token);

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminBox").style.display = "block";

  loadOrders();
  setInterval(loadOrders, 15000); // auto refresh
}

/* ========================= */
/* LOAD ORDERS */
/* ========================= */
async function loadOrders() {
  const token = localStorage.getItem("adminToken");
  if (!token) return;

  const res = await fetch(WORKER_URL + "/admin/orders", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) {
    alert("Session expirée");
    localStorage.removeItem("adminToken");
    location.reload();
    return;
  }

  const orders = await res.json();
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  // Tri par date décroissante
  orders.sort((a, b) => b.createdAt - a.createdAt);

  orders.forEach(o => {
    const tr = document.createElement("tr");

    const statusClass =
      o.status === "paid" ? "status-paid" :
      o.status === "pending" ? "status-pending" :
      "status-expired";

    tr.innerHTML = `
      <td>${o.orderId}</td>
      <td>${o.email}</td>
      <td>${o.crypto}</td>
      <td>$${o.amountUSD}</td>
      <td class="${statusClass}">${o.status}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;">${o.txid || "-"}</td>
      <td>${o.ip || "-"}</td>
      <td>${countryName(o.country)}</td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
      <td>${o.paidAt ? new Date(o.paidAt).toLocaleString() : "-"}</td>
    `;

    tbody.appendChild(tr);
  });
}
