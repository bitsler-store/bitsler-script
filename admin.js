const WORKER_URL = "https://crypto-backend.bijamalala.workers.dev"; // ← CHANGE

async function login() {
  const pin = document.getElementById("pin").value;

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
}

async function loadOrders() {
  const token = localStorage.getItem("adminToken");
  if (!token) return;

  const res = await fetch(WORKER_URL + "/admin/orders", {
    headers: {
      "Authorization": "Bearer " + token
    }
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

  orders.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.orderId}</td>
      <td>${o.email}</td>
      <td>${o.crypto}</td>
      <td>${o.amountUSD}</td>
      <td>${o.status}</td>
      <td>${o.txid || "-"}</td>
      <td>${o.ip || "-"}</td>
      <td>${o.country || "-"}</td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
      <td>${o.paidAt ? new Date(o.paidAt).toLocaleString() : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}
