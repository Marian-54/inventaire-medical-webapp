
import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const params=new URLSearchParams(window.location.search);
const type=params.get("type")||"pharmacie";
const form=document.getElementById("form-ajout");
form.addEventListener("submit", async e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(form).entries());
  // transformation types
  data.quantite = parseInt(data.quantite,10);
  data.quantite_min = parseInt(data.quantite_min,10);
  await addDoc(collection(db,type), data);
  alert("Produit ajouté !");
  window.location.href=`inventaire.html?type=${type}`;
});
