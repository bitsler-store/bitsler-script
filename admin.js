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
  CG: "Congo", CD: "République démocratique du Congo", KR: "République de Corée",
  CR: "Costa Rica", HR: "Croatie", CU: "Cuba", DK: "Danemark", DJ: "Djibouti",
  DO: "République dominicaine", DM: "Dominique", EG: "Égypte", SV: "El Salvador",
  AE: "Émirats arabes unis",  EC: "Équateur", EE: "Estonie", ET: "Éthiopie",
  FO: "Îles Féroé", FJ: "Fidji", FI: "Finlande",  GA: "Gabon",  GM: "Gambie",
  GE: "Géorgie", GH: "Ghana", GR: "Grèce", GL: "Groenland", GP: "Guadeloupe",
  GT: "Guatemala", GN: "Guinée", GW: "Guinée-Bissau", GQ: "Guinée équatoriale",
  GY: "Guyana", GF: "Guyane française", HT: "Haïti", HN: "Honduras", HK: "Hong Kong",
  HU: "Hongrie", ID: "Indonésie", IR: "Iran", IQ: "Irak", IE: "Irlande", IS: "Islande",
  IL: "Israël", JM: "Jamaïque", JO: "Jordanie", KZ: "Kazakhstan", KE: "Kenya", KG: "Kirghizistan",
  KW: "Koweït", LA: "Laos", LV: "Lettonie", LB: "Liban", LR: "Libéria", LY: "Libye",
  LI: "Liechtenstein", LT: "Lituanie", LU: "Luxembourg", MG: "Madagascar", MY: "Malaisie",
  MW: "Malawi", MV: "Maldives", ML: "Mali", MT: "Malte", MQ: "Martinique",
  MU: "Maurice", MR: "Mauritanie", YT: "Mayotte", MX: "Mexique", MD: "Moldavie",
  MC: "Monaco", MN: "Mongolie", ME: "Monténégro", MZ: "Mozambique",
  NA: "Namibie", NP: "Népal", NE: "Niger", NO: "Norvège", NC: "Nouvelle-Calédonie",
  NZ: "Nouvelle-Zélande", OM: "Oman", UG: "Ouganda", UZ: "Ouzbékistan",
  PK: "Pakistan", PS: "Palestine", PA: "Panama", PY: "Paraguay",
  NL: "Pays-Bas", XX: "Pays inconnu", PE: "Pérou", PH: "Philippines",
  PL: "Pologne", PF: "Polynésie française", PR: "Porto Rico", PT: "Portugal",
  QA: "Qatar", SY: "Syrie", CF: "République centrafricaine", RE: "Réunion",
  RO: "Roumanie", RW: "Rwanda", SB: "Îles Salomon", WS: "Samoa",
  AS: "Samoa américaines", RS: "Serbie", SC: "Seychelles",
  SL: "Sierra Leone", SG: "Singapour", SK: "Slovaquie", SI: "Slovénie",
  SO: "Somalie", SD: "Soudan", SS: "Soudan du Sud", LK: "Sri Lanka",
  SE: "Suède", SR: "Suriname", TJ: "Tadjikistan", TW: "Taïwan",
  TZ: "Tanzanie", TD: "Tchad", CS: "Tchécoslovaquie", CZ: "République tchèque",
  TH: "Thaïlande", TG: "Togo", TT: "Trinité-et-Tobago", TM: "Turkménistan",
  TR: "Turquie", UA: "Ukraine", UY: "Uruguay", VE: "Venezuela",
  VN: "Viêt Nam", VD: "Viêt Nam du Sud", YE: "Yémen", YU: "Yougoslavie",
  ZR: "Zaïre", ZM: "Zambie", ZW: "Zimbabwe"
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
