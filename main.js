
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function openInventaire(type){
  window.location.href = `inventaire.html?type=${type}`;
}
window.openInventaire = openInventaire;

const inventories = [
  {key:"pharmacie", label:"Pharmacie"},
  {key:"trousse", label:"Trousse d’étage"},
  {key:"rack", label:"Rack oxygène"}
];

const alertContainer = document.getElementById("alertes");
const today = new Date().toISOString().slice(0,10);

Promise.all(inventories.map(async inv=>{
  const snapshot = await getDocs(collection(db, inv.key));
  snapshot.forEach(doc=>{
    const data = doc.data();
    const isExpired = data.peremption && data.peremption < today;
    const isLow = data.quantite < data.quantite_min;
    if(isExpired || isLow){
      const div=document.createElement("div");
      div.className="alert alert-danger";
      div.textContent=`${inv.label} – ${data.designation} (${data.quantite}) ${isExpired?"périmé":""} ${isLow?"sous seuil":""}`.trim();
      alertContainer.appendChild(div);
      if(Notification && Notification.permission==="granted"){
        new Notification("Inventaire en défaut", { body: div.textContent });
      }
    }
  });
}));

if("Notification" in window && Notification.permission!=="granted"){
  Notification.requestPermission();
}
