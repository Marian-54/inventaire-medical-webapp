
import { db } from "./firebase.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const titre = document.getElementById("titre-inventaire");
const btnAjouter = document.getElementById("btn-ajouter");
const tbody = document.querySelector("#table-produits tbody");

const labels = {pharmacie:"Pharmacie", trousse:"Trousse d’étage", rack:"Rack oxygène"};
titre.textContent = labels[type] ?? "Inventaire";

btnAjouter.onclick = ()=> window.location.href=`ajout.html?type=${type}`;

const today = new Date().toISOString().slice(0,10);

async function load(){
  tbody.innerHTML="";
  const snap = await getDocs(collection(db, type));
  snap.forEach(docSnap=>{
    const data = docSnap.data();
    const tr=document.createElement("tr");
    if(data.peremption<today || data.quantite<data.quantite_min){ tr.classList.add("table-danger"); }
    tr.innerHTML=`
      <td>${data.designation}</td>
      <td>${data.reference}</td>
      <td>${data.quantite}</td>
      <td>${data.quantite_min}</td>
      <td>${data.peremption}</td>
      <td class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" data-id="${docSnap.id}" data-action="qr">QR</button>
        ${type==="pharmacie"?'<button class="btn btn-sm btn-outline-primary" data-id="'+docSnap.id+'" data-action="transfer">Transférer</button>':""}
        <button class="btn btn-sm btn-outline-danger" data-id="${docSnap.id}" data-action="delete">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
load();

tbody.addEventListener("click", async e=>{
  const btn=e.target.closest("button");
  if(!btn) return;
  const id=btn.dataset.id;
  const action=btn.dataset.action;
  if(action==="delete"){
    await deleteDoc(doc(db,type,id));
    load();
  }else if(action==="transfer"){
    openTransferModal(id);
  }else if(action==="qr"){
    const url=`https://ton-app.web.app/produit.html?id=${id}&type=${type}`;
    const qr=new QRCode(document.body,{
      text:url,width:128,height:128
    });
    alert("QR code généré tout en bas de la page 😉");
  }
});

/* -------- TRANSFERT -------- */
const modal = new bootstrap.Modal(document.getElementById("modalTransfert"));
const formTransfert=document.getElementById("form-transfert");
let docIdCourant="";
async function openTransferModal(id){
  docIdCourant=id;
  const docSnap=await getDocs(collection(db,type)).then(s=>s.docs.find(d=>d.id===id));
  document.getElementById("transfert-info").textContent=`${docSnap.data().designation} – Stock actuel ${docSnap.data().quantite}`;
  modal.show();
}
formTransfert.addEventListener("submit", async e=>{
  e.preventDefault();
  const qte=parseInt(document.getElementById("transfert-quantite").value,10);
  const dest=document.getElementById("transfert-destination").value;
  const sourceRef=doc(db,type,docIdCourant);
  const sourceSnap=await sourceRef.get?.() ?? (await getDocs(collection(db,type))).docs.find(d=>d.id===docIdCourant);
  const data=sourceSnap.data();
  if(qte>data.quantite){ alert("Quantité trop grande"); return;}
  // mise à jour source
  await updateDoc(sourceRef,{ quantite:data.quantite-qte });
  // ajout/maj destination
  const destSnap=await getDocs(collection(db,dest));
  const same=destSnap.docs.find(d=>d.data().designation===data.designation);
  if(same){
    await updateDoc(doc(db,dest,same.id),{ quantite:same.data().quantite+qte });
  }else{
    const {designation,reference,quantite_min,peremption}=data;
    await addDoc(collection(db,dest),{designation,reference,quantite:qte,quantite_min,peremption});
  }
  modal.hide();
  load();
});
