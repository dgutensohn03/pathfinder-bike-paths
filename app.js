const trails = [
  {id:"mary-carter",name:"Mary Carter Greenway",query:"Mary Carter Greenway",area:"Littleton · South Platte River",miles:8.5,delta:8,point:[39.593,-105.023],kind:"Riverside",intro:"Follow the South Platte corridor through South Platte Park and north toward Englewood. A strong first pick for a longer, connected greenway ride.",tags:["River corridor","Regional connection","Out & back"],source:"https://trails.colorado.gov/trails/mary-carter-greenway-20384",photo:"assets/river-ride.webp"},
  {id:"columbine",name:"Columbine Trail",query:"Columbine Trail",area:"Littleton · West side",miles:2.57,delta:46,point:[39.614,-105.043],kind:"Neighborhood",intro:"A shorter trail option near Littleton that can work as a quick ride or a piece of a longer day out.",tags:["Short ride","Neighborhood link","Flexible distance"],source:"https://www.ssprd.org/Parks-Trails/Trails/Trail-Map",photo:"assets/greenway-ride.webp"},
  {id:"high-line",name:"High Line Canal Trail",query:"High Line Canal",area:"South metro · Canal corridor",miles:9.01,delta:7,point:[39.604,-104.957],kind:"Canal path",intro:"Explore the canal corridor and its many neighborhood connections. The distance here covers only the South Suburban district portion.",tags:["Canal corridor","Longer ride","Many access points"],source:"https://www.ssprd.org/Parks-Trails/Trails/Trail-Map",photo:"assets/greenway-ride.webp"},
  {id:"lee-gulch",name:"Lee Gulch Trail",query:"Lee Gulch Trail",area:"Littleton · East-west link",miles:4.56,delta:337,point:[39.593,-105.004],kind:"Connector",intro:"An east-west connection through the Littleton trail network. Its endpoint difference is greater than the other three featured paths.",tags:["Connected route","Short-to-medium","More climbing"],source:"https://www.ssprd.org/Parks-Trails/Trails/Trail-Map",photo:"assets/river-ride.webp"}
];
const geometryBase="https://services5.arcgis.com/ttNGmDvKQA7oeDQ3/arcgis/rest/services/COTREX_Trails_Populated_2026/FeatureServer/54/query";
const $=id=>document.getElementById(id);
let selected=trails.find(t=>t.id===new URLSearchParams(location.search).get("trail"))||trails[0];
let filter="all",query="",userPoint=null,map=null,markerLayer=null,routeLayer=null,routeRequest=0;
const markers=new Map();

function distanceKm(a,b){const R=6371,d1=(b[0]-a[0])*Math.PI/180,d2=(b[1]-a[1])*Math.PI/180,s=Math.sin(d1/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(d2/2)**2;return 2*R*Math.atan2(Math.sqrt(s),Math.sqrt(1-s))}
function visibleTrails(){let list=trails.filter(t=>(filter==="all"||filter==="short"&&t.miles<5||filter==="long"&&t.miles>=5)&&[t.name,t.area,t.kind].join(" ").toLowerCase().includes(query));return userPoint?list.sort((a,b)=>distanceKm(userPoint,a.point)-distanceKm(userPoint,b.point)):list}
function renderList(){
  const items=visibleTrails();$("result-count").textContent=items.length+" "+(items.length===1?"trail":"trails");
  $("trail-list").innerHTML=items.length?items.map(t=>`<div role="listitem"><button class="trail-card ${selected.id===t.id?"active":""}" type="button" data-trail="${t.id}" aria-pressed="${selected.id===t.id}"><img class="trail-thumb" src="${t.photo}" alt=""><span><h3>${t.name}</h3><div class="area">${t.area}</div><div class="meta"><span>${t.miles} MI</span><small>${t.kind}</small></div></span></button></div>`).join(""):'<p class="list-empty">No paths match that search. Try a trail name or remove the length filter.</p>';
  document.querySelectorAll("[data-trail]").forEach(btn=>btn.addEventListener("click",()=>selectTrail(btn.dataset.trail)));
}
function renderDetail(){
  const t=selected;
  $("detail-panel").innerHTML=`<div class="photo-wrap"><img class="detail-image" src="${t.photo}" alt="Concept image showing the atmosphere of a Colorado bike ride"><span class="photo-badge">CONCEPT IMAGERY · NOT THIS TRAIL</span></div><div class="detail-content">
    <div class="detail-eyebrow"><i></i> FEATURED PATH / ${t.kind.toUpperCase()}</div><h2>${t.name}</h2><p class="detail-area">⌖ &nbsp;${t.area}</p>
    <div class="stats-grid"><div class="stat"><strong>${t.miles}</strong><span>MILES · DISTRICT</span></div><div class="stat"><strong>${t.delta} ft</strong><span>ENDPOINT Δ</span></div><div class="stat"><strong>${t.kind}</strong><span>PATH TYPE</span></div></div>
    <p class="stat-note">Published district trail length; endpoint difference is not total elevation gain.</p>
    <section class="detail-section"><h3>The ride</h3><p>${t.intro}</p><div class="feature-pills">${t.tags.map(tag=>`<span>${tag}</span>`).join("")}</div></section>
    <section class="detail-section"><h3>Along the way</h3><div class="gallery"><img src="assets/river-ride.webp" alt="Concept view of a riverside cycling path"><img src="assets/greenway-ride.webp" alt="Concept view of a tree lined greenway"></div><p class="caption">Atmosphere studies for the demo. On-trail photos are a future content task.</p></section>
    <section class="detail-section"><h3>Before you roll</h3><div class="notice">Trail conditions and detours can change. Check the managing agency’s latest notices before heading out.</div><a class="detail-link" href="${t.source}" target="_blank" rel="noopener">Open official trail details ↗</a><p class="source-line">Length and endpoint elevations: South Suburban Parks & Recreation. Map overlay: Colorado Parks & Wildlife COTREX trail service, when available.</p></section>
  </div>`;
}
function markerIcon(active){return L.divIcon({className:"",html:`<div class="trail-marker ${active?"selected":""}"></div>`,iconSize:active?[24,24]:[19,19],iconAnchor:active?[12,12]:[9,9]})}
function initMap(){
  if(!window.L){$("map-status").textContent="Map library unavailable. Trail details and official links remain available.";return}
  map=L.map("map",{zoomControl:false,scrollWheelZoom:false}).setView([39.611,-105.011],11);
  L.control.zoom({position:"bottomright"}).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
  markerLayer=L.layerGroup().addTo(map);
  trails.forEach(t=>{const marker=L.marker(t.point,{icon:markerIcon(t.id===selected.id),title:t.name}).addTo(markerLayer);marker.on("click",()=>selectTrail(t.id));marker.bindTooltip(t.name,{direction:"top"});markers.set(t.id,marker)});
  showRoute();
}
async function showRoute(){
  if(!map)return;
  const request=++routeRequest;
  if(routeLayer){map.removeLayer(routeLayer);routeLayer=null}
  markers.forEach((marker,id)=>marker.setIcon(markerIcon(id===selected.id)));
  map.setView(selected.point,12,{animate:true});
  $("map-status").textContent="Loading official trail geometry…";
  const params=new URLSearchParams({where:"name LIKE '%"+selected.query.replaceAll("'","''")+"%'",outFields:"name,bike,surface,length_mi_rounded",outSR:"4326",returnGeometry:"true",f:"geojson",resultRecordCount:"100"});
  try{
    const response=await fetch(geometryBase+"?"+params,{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error("Service unavailable");
    const data=await response.json();
    if(request!==routeRequest)return;
    const features=(data.features||[]).filter(f=>["LineString","MultiLineString"].includes(f.geometry?.type));
    if(!features.length)throw new Error("No line geometry");
    routeLayer=L.geoJSON({type:"FeatureCollection",features},{style:{color:"#316f55",weight:6,opacity:.95,lineCap:"round"}}).addTo(map);
    const bounds=routeLayer.getBounds();if(bounds.isValid()&&distanceKm([bounds.getSouth(),bounds.getWest()],[bounds.getNorth(),bounds.getEast()])<35)map.fitBounds(bounds.pad(.2),{maxZoom:13,animate:true});
    $("map-status").textContent="Official mapped segments · COTREX / Colorado Parks & Wildlife";
  }catch{
    if(request!==routeRequest)return;
    $("map-status").innerHTML='Route overlay unavailable. <a href="'+selected.source+'" target="_blank" rel="noopener">View official map ↗</a>';
  }
}
function selectTrail(id){
  const next=trails.find(t=>t.id===id);if(!next)return;selected=next;
  const url=new URL(location.href);url.searchParams.set("trail",id);history.replaceState(null,"",url);
  renderList();renderDetail();showRoute();
  if(innerWidth<651)$("detail-panel").scrollIntoView({behavior:"smooth",block:"start"});
}
$("search-form").addEventListener("submit",e=>e.preventDefault());
$("trail-search").addEventListener("input",e=>{query=e.target.value.toLowerCase().trim();renderList()});
document.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{filter=btn.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));renderList()}));
$("near-me").addEventListener("click",()=>{
  if(!navigator.geolocation){$("near-me").textContent="Location unavailable · search instead";return}
  $("near-me").textContent="Finding nearby paths…";
  navigator.geolocation.getCurrentPosition(position=>{
    userPoint=[position.coords.latitude,position.coords.longitude];
    $("near-me").textContent="◎ Sorted near you (approx.)";
    renderList();
    if(map){L.circleMarker(userPoint,{radius:7,color:"#fff",weight:3,fillColor:"#286cb4",fillOpacity:1}).addTo(map).bindTooltip("Your approximate location");map.setView(userPoint,11)}
  },()=>{$("near-me").textContent="Location unavailable · search instead"},{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
});
$("recenter").addEventListener("click",()=>{if(map)map.setView([39.611,-105.011],11)});
renderList();renderDetail();initMap();
