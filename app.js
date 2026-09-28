const $=id=>document.getElementById(id);
const sourceURL="https://services.arcgis.com/rD2ylXRs80UroD90/ArcGIS/rest/services/DRCOG_Corridors_Data_Compilation_for_Analysis_WFL1/FeatureServer/102";
const places={denver:[39.739,-104.99],littleton:[39.613,-105.017],boulder:[40.015,-105.27],aurora:[39.73,-104.832],parker:[39.519,-104.762],golden:[39.756,-105.222]};
const photo={"cherry-creek-trail":{src:"https://commons.wikimedia.org/wiki/Special:FilePath/CherryCreekTrail.jpg?width=960",alt:"Cherry Creek Trail near Champa Street and Speer Boulevard in Denver",credit:"Raysonho · CC0",url:"https://commons.wikimedia.org/wiki/File:CherryCreekTrail.jpg"}};
let trails=[],snapshot=null,selected=null,map=null,routeLayer=null,markerLayer=null,userMarker=null;
let query="",lengthFilter="all",surfaceFilter="all",sortPoint=null,sortLabel="";
const markers=new Map();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function distanceKm(a,b){const d1=(b[0]-a[0])*Math.PI/180,d2=(b[1]-a[1])*Math.PI/180,x=Math.sin(d1/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(d2/2)**2;return 12742*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function filtered(){let list=trails.filter(t=>t.name.toLowerCase().includes(query)&&(lengthFilter==="all"||lengthFilter==="short"&&t.miles<5||lengthFilter==="medium"&&t.miles>=5&&t.miles<15||lengthFilter==="long"&&t.miles>=15)&&(surfaceFilter==="all"||t.surface.toLowerCase()===surfaceFilter));return sortPoint?list.sort((a,b)=>distanceKm(sortPoint,a.point)-distanceKm(sortPoint,b.point)):list}
function why(t){if(sortPoint)return `Mapped center ~${Math.round(distanceKm(sortPoint,t.point)*.621371)} mi from ${sortLabel}`;if(t.miles<5)return "A compact mapped network for a flexible ride";if(t.miles>=15)return "An extensive path network to explore";return "Room to choose your own out-and-back distance"}
function renderList(){
 const list=filtered();
 if(list.length&&selected&&!list.includes(selected)){selected=list[0];history.replaceState(null,"",`?trail=${encodeURIComponent(selected.id)}`);renderDetail();showRoute()}
 $("result-count").textContent=`${list.length} of ${trails.length} paths`;
 $("trail-list").innerHTML=list.length?list.map(t=>`<div role="listitem"><button class="trail-card ${selected?.id===t.id?"active":""}" type="button" data-trail="${esc(t.id)}" aria-pressed="${selected?.id===t.id}"><span class="trail-thumb ${photo[t.id]?"has-photo":""}">${photo[t.id]?`<img src="${photo[t.id].src}" alt="" loading="lazy">`:'<span aria-hidden="true">↗</span>'}</span><span class="card-copy"><strong>${esc(t.name)}</strong><small>${esc(why(t))}</small><span class="card-facts"><b>${t.miles} mi mapped</b><span>${esc(t.surface)}</span></span></span></button></div>`).join(""):'<div class="list-empty"><strong>No paths match those filters.</strong><p>Try another name, surface, or mapped length.</p><button type="button" id="clear-filters">Clear filters</button></div>';
 document.querySelectorAll("[data-trail]").forEach(b=>b.addEventListener("click",()=>selectTrail(b.dataset.trail)));
 $("clear-filters")?.addEventListener("click",resetFilters);
 if(map)markers.forEach((m,id)=>m.setOpacity(list.some(t=>t.id===id)?1:.18));
}
function renderDetail(){
 const t=selected,p=photo[t.id],composition=Object.entries(t.surfaceMix).filter(([,m])=>m>0).map(([label,m])=>`${esc(label)} ${m} mi`).join(" · ");
 const image=p?`<div class="photo-wrap"><img class="detail-image" src="${p.src}" alt="${esc(p.alt)}"><span class="photo-badge">PHOTOGRAPHED ON THIS TRAIL</span><a class="photo-credit" href="${p.url}" target="_blank" rel="noopener">Photo: ${esc(p.credit)} ↗</a></div>`:`<div class="route-art" role="img" aria-label="Abstract line illustration; no trail photograph available"><span class="art-line one"></span><span class="art-line two"></span><span class="art-dot"></span><span class="art-label">FIELD NOTES / ${esc(t.name.toUpperCase())}</span></div>`;
 $("detail-panel").innerHTML=`${image}<div class="detail-content"><div class="detail-eyebrow"><i></i> PATH PROFILE <span>·</span> FRONT RANGE</div><h2>${esc(t.name)}</h2><p class="detail-area">Existing off-street bicycle facility · surface profile: ${esc(t.surface.toLowerCase())}</p>
 <div class="fit-box"><span class="section-label">WHY THIS MAY FIT</span><p>${esc(why(t))}. Browse its mapped segments to choose a starting point and the distance that works for you.</p></div>
 <div class="stats-grid"><div class="stat"><strong>${t.miles}</strong><span>MAPPED MI*</span></div><div class="stat"><strong>${esc(t.surface)}</strong><span>SURFACE MIX</span></div><div class="stat"><strong>${t.segmentCount}</strong><span>MAP SEGMENTS</span></div></div>
 <p class="stat-note">*Sum of mapped segments inside this study area. Branches, gaps, or overlapping segments may be included. This is not a route length or promised ride distance.</p>
 <section class="detail-section"><h3>Know before you go</h3><p>DRCOG classifies these segments as existing off-street shared-use or unpaved paths. Surface mix in the mapped selection: ${composition}. Check the current path status with the local trail manager before riding.</p></section>
 <section class="detail-section"><h3>Explore this path</h3><p>The highlighted lines show mapped path segments, which may be disconnected. The map pin marks the approximate center of the mapped area, not a trailhead.</p><div class="detail-actions"><a class="detail-link" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${t.point[0]}&mlon=${t.point[1]}#map=13/${t.point[0]}/${t.point[1]}">Open area map ↗</a><button class="share-button" type="button" id="copy-link">Copy path link</button></div><p id="copy-status" class="copy-status" role="status"></p></section>
 <section class="detail-section provenance"><h3>Data &amp; provenance</h3><p>Regional bicycle facility inventory by <a href="${sourceURL}" target="_blank" rel="noopener">Denver Regional Council of Governments ↗</a>. Snapshot ${esc(snapshot.updated)}. Selected named paths across the Denver metro and nearby Boulder corridor. No live conditions are included.</p></section></div>`;
 $("copy-link").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);$("copy-status").textContent="Link copied."}catch{$("copy-status").textContent="Copy the address from your browser."}});
}
function icon(active){return L.divIcon({className:"",html:`<span class="trail-marker ${active?"selected":""}"></span>`,iconSize:active?[24,24]:[18,18],iconAnchor:active?[12,12]:[9,9]})}
function initMap(){
 if(!window.L){$("map-status").textContent="Interactive map unavailable. Path details and source links remain available.";return}
 map=L.map("map",{zoomControl:false,scrollWheelZoom:false,preferCanvas:true}).setView([39.74,-105.02],10);
 L.control.zoom({position:"bottomright"}).addTo(map);
 L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
 markerLayer=L.layerGroup().addTo(map);
 trails.forEach(t=>{let m=L.marker(t.point,{icon:icon(t.id===selected.id),title:t.name}).addTo(markerLayer);m.bindTooltip(t.name);m.on("click",()=>selectTrail(t.id));markers.set(t.id,m)});
 showRoute(false);
}
function showRoute(animate=true){
 if(!map)return;if(routeLayer)map.removeLayer(routeLayer);
 markers.forEach((m,id)=>m.setIcon(icon(id===selected.id)));
 routeLayer=L.geoJSON(selected.geometry,{style:{color:"#26634e",weight:5,opacity:.92,lineCap:"round",lineJoin:"round"},interactive:false}).addTo(map);
 const bounds=routeLayer.getBounds();if(bounds.isValid())map.fitBounds(bounds.pad(.14),{maxZoom:12,animate});
 $("map-status").textContent=`${selected.name} · mapped segments from DRCOG`;
}
function selectTrail(id){const t=trails.find(x=>x.id===id);if(!t)return;selected=t;history.replaceState(null,"",`?trail=${encodeURIComponent(id)}`);renderList();renderDetail();showRoute();if(innerWidth<651)$("detail-panel").scrollIntoView({behavior:"smooth",block:"start"})}
function resetFilters(){query="";lengthFilter="all";surfaceFilter="all";$("trail-search").value="";$("surface-filter").value="all";document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter==="all")));renderList()}
$("search-form").addEventListener("submit",e=>e.preventDefault());
$("trail-search").addEventListener("input",e=>{query=e.target.value.toLowerCase().trim();renderList()});
$("surface-filter").addEventListener("change",e=>{surfaceFilter=e.target.value;renderList()});
$("place-filter").addEventListener("change",e=>{sortPoint=places[e.target.value]||null;sortLabel=e.target.selectedOptions[0].textContent;renderList()});
document.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{lengthFilter=btn.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));renderList()}));
$("near-me").addEventListener("click",()=>{
 if(!navigator.geolocation){$("location-status").textContent="Location is unavailable on this device.";return}
 $("location-status").textContent="Requesting approximate location…";
 navigator.geolocation.getCurrentPosition(position=>{sortPoint=[position.coords.latitude,position.coords.longitude];sortLabel="you";$("place-filter").value="";$("location-status").textContent="Paths sorted by approximate center distance from you.";renderList();if(map){if(userMarker)map.removeLayer(userMarker);userMarker=L.circleMarker(sortPoint,{radius:7,color:"#fff",weight:3,fillColor:"#286cb4",fillOpacity:1}).addTo(map).bindTooltip("Your approximate location")}},()=>{$("location-status").textContent="Location unavailable. Choose a place instead."},{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
});
$("recenter").addEventListener("click",()=>showRoute());
async function start(){try{const response=await fetch("./data/trails.json");if(!response.ok)throw Error("Data missing");snapshot=await response.json();if(!Array.isArray(snapshot.trails)||snapshot.trails.length<20)throw Error("Catalog incomplete");trails=snapshot.trails;selected=trails.find(t=>t.id===new URLSearchParams(location.search).get("trail"))||trails[0];$("catalog-count").textContent=`${trails.length} PATHS / REGIONAL DATA`;$("snapshot-date").textContent=`Data snapshot ${snapshot.updated}`;renderList();renderDetail();initMap()}catch(e){$("result-count").textContent="Unavailable";$("trail-list").innerHTML='<p class="list-empty">The path catalog could not load. Please refresh or visit the DRCOG data source linked below.</p>';$("map-status").textContent="Path data unavailable.";$("detail-panel").innerHTML=`<div class="detail-placeholder"><h2>Path data unavailable</h2><p>Explore the <a href="${sourceURL}">DRCOG bicycle facilities inventory ↗</a>.</p></div>`;console.error(e)}}
start();
