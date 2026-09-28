const $=id=>document.getElementById(id);
const sourceURL="https://services.arcgis.com/rD2ylXRs80UroD90/ArcGIS/rest/services/DRCOG_Corridors_Data_Compilation_for_Analysis_WFL1/FeatureServer/102";
const places={denver:[39.739,-104.99],littleton:[39.613,-105.017],boulder:[40.015,-105.27],aurora:[39.73,-104.832],parker:[39.519,-104.762],golden:[39.756,-105.222]};
const commons=name=>`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=960`;
const photo={
 "cherry-creek-trail":[
  {src:commons("CherryCreekTrail.jpg"),alt:"Cherry Creek Trail at Champa Street and Speer Boulevard, Denver",place:"Champa & Speer, Denver",credit:"Raysonho · CC0",url:"https://commons.wikimedia.org/wiki/File:CherryCreekTrail.jpg"},
  {src:commons("CherryCreekTrail2.jpg"),alt:"Cherry Creek Trail near Speer Boulevard and West Colfax Avenue, Denver",place:"Speer & Colfax, Denver",credit:"Raysonho · CC0",url:"https://commons.wikimedia.org/wiki/File:CherryCreekTrail2.jpg"}],
 "clear-creek-trail":[{src:commons("GoldenCO ClearCreekPath Oct2014.jpg"),alt:"Path beside Clear Creek in Golden, Colorado",place:"Clear Creek in Golden",credit:"Amy Aletheia Cahill · CC BY-SA 2.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:GoldenCO_ClearCreekPath_Oct2014.jpg",license:"https://creativecommons.org/licenses/by-sa/2.0/"}],
 "highline-canal-trail":[{src:commons("Marker 3174.jpg"),alt:"High Line Canal Trail mile marker 68 in Denver",place:"Mile 68, Green Valley Ranch",credit:"Nolabob · CC0",url:"https://commons.wikimedia.org/wiki/File:Marker_3174.jpg"}],
 "south-platte-river-trail":[{src:commons("ValverdeDenver.JPG"),alt:"View from a bicycle path bridge over the South Platte River in Denver",place:"Bridge over the South Platte, Denver",credit:"Jeffrey Beall · CC BY-SA 3.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:ValverdeDenver.JPG",license:"https://creativecommons.org/licenses/by-sa/3.0/"}],
 "waterton-canyon-trail":[{src:commons("Waterton Canyon Trail 825.jpg"),alt:"Deer along the Waterton Canyon segment of the Colorado Trail",place:"Wildlife in Waterton Canyon",credit:"Chris Light · CC BY-SA 4.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:Waterton_Canyon_Trail_825.jpg",license:"https://creativecommons.org/licenses/by-sa/4.0/"}],
 "bear-creek-trail":[
  {src:commons("BCTMtCarbon looking east.jpg"),alt:"Bear Creek Trail heading east along Mount Carbon in Bear Creek Lake Park",place:"Mount Carbon, Bear Creek Lake Park",credit:"Xnatedawgx · CC BY-SA 3.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:BCTMtCarbon_looking_east.jpg",license:"https://creativecommons.org/licenses/by-sa/3.0/"},
  {src:commons("BCTatKiplingStBridge.JPG"),alt:"Bear Creek Trail heading west under the Kipling Street bridge",place:"Kipling Street bridge, Lakewood",credit:"Xnatedawgx · CC BY-SA 3.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:BCTatKiplingStBridge.JPG",license:"https://creativecommons.org/licenses/by-sa/3.0/"}],
 "c-470-bikeway":[{src:commons("C-470 West Trail over Turkey Creek.jpg"),alt:"C-470 West Trail crossing Turkey Creek in Bear Creek Lake Park",place:"Western C-470 corridor, Turkey Creek",credit:"Xnatedawgx · CC BY-SA 3.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:C-470_West_Trail_over_Turkey_Creek.jpg",license:"https://creativecommons.org/licenses/by-sa/3.0/"}],
 "boulder-creek-path":[{src:commons("Boulder 0034.jpg"),alt:"Historic photograph of Boulder Creek Path",place:"Boulder Creek Path · photographed 1997",credit:"Postfachannabella · CC BY-SA 4.0 · display cropped",url:"https://commons.wikimedia.org/wiki/File:Boulder_0034.jpg",license:"https://creativecommons.org/licenses/by-sa/4.0/"}]
};
let trails=[],snapshot=null,selected=null,map=null,routeLayer=null,markerLayer=null,userMarker=null;
let query="",lengthFilter="all",surfaceFilter="all",photosOnly=false,sortPoint=null,sortLabel="";
const markers=new Map();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uiIcon=kind=>{
 const paths={route:'<path d="M5 19c4-7 8-3 10-9 1-2 2-3 4-4"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="6" r="2"/>',distance:'<path d="M3 8v8M21 8v8M3 12h18M8 9l-2 3 2 3M16 9l2 3-2 3"/>',surface:'<path d="M3 17c5-7 9 1 18-7M4 21c5-7 10 1 17-7"/><circle cx="7" cy="8" r="2"/>',segments:'<path d="m3 17 5-6 4 3 8-9M3 20h5M15 20h6"/><circle cx="8" cy="11" r="1"/>',map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',external:'<path d="M12 5h7v7M19 5l-9 9M18 15v4H5V6h4"/>'};
 return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]}</svg>`;
};
function distanceKm(a,b){const d1=(b[0]-a[0])*Math.PI/180,d2=(b[1]-a[1])*Math.PI/180,x=Math.sin(d1/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(d2/2)**2;return 12742*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function nearestMappedKm(point){let nearest=Infinity;for(const trail of trails)for(const line of trail.geometry.coordinates)for(const [lon,lat] of line)nearest=Math.min(nearest,distanceKm(point,[lat,lon]));return nearest}
function clearUserMarker(){if(map&&userMarker){map.removeLayer(userMarker);userMarker=null}}
function useDemoLocation(){clearUserMarker();sortPoint=places.denver;sortLabel="Denver";$("place-filter").value="denver";$("location-status").textContent="Showing Colorado paths near Denver as an example.";renderList()}
function locationFallback(message){sortPoint=null;sortLabel="";clearUserMarker();$("place-filter").value="";$("location-status").innerHTML=`${message} <button type="button" class="demo-location" id="demo-location">Explore near Denver ↗</button>`;$("demo-location").addEventListener("click",useDemoLocation);renderList()}
function filtered(){let list=trails.filter(t=>t.name.toLowerCase().includes(query)&&(lengthFilter==="all"||lengthFilter==="short"&&t.miles<5||lengthFilter==="medium"&&t.miles>=5&&t.miles<15||lengthFilter==="long"&&t.miles>=15)&&(surfaceFilter==="all"||t.surface.toLowerCase()===surfaceFilter)&&(!photosOnly||Boolean(photo[t.id])));return sortPoint?list.sort((a,b)=>distanceKm(sortPoint,a.point)-distanceKm(sortPoint,b.point)):list}
function why(t){if(sortPoint)return `Mapped center ~${Math.round(distanceKm(sortPoint,t.point)*.621371)} mi from ${sortLabel}`;if(t.miles<5)return "A compact mapped network for a flexible ride";if(t.miles>=15)return "An extensive path network to explore";return "Room to choose your own out-and-back distance"}
function renderList(){
 const list=filtered();
 if(list.length&&selected&&!list.includes(selected)){selected=list[0];history.replaceState(null,"",`?trail=${encodeURIComponent(selected.id)}`);renderDetail();showRoute()}
 $("result-count").textContent=`${list.length} of ${trails.length} paths`;
 $("trail-list").innerHTML=list.length?list.map((t,i)=>`<div role="listitem"><button class="trail-card ${selected?.id===t.id?"active":""}" type="button" data-trail="${esc(t.id)}" aria-pressed="${selected?.id===t.id}"><span class="trail-thumb ${photo[t.id]?"has-photo":""}">${photo[t.id]?`<img src="${photo[t.id][0].src}" alt="" loading="lazy">`:uiIcon("route")}</span><span class="card-copy"><span class="card-index">${i+1} · BIKE PATH${photo[t.id]?" · PHOTOS AVAILABLE":""}</span><strong>${esc(t.name)}</strong><span class="card-facts"><b>${t.miles} mapped mi</b><span>${esc(t.surface)} surface</span></span><small>${esc(why(t))}</small></span><span class="card-chevron" aria-hidden="true">›</span></button></div>`).join(""):'<div class="list-empty"><strong>No paths match those filters.</strong><p>Try another name, surface, or mapped length.</p><button type="button" id="clear-filters">Clear filters</button></div>';
 document.querySelectorAll("[data-trail]").forEach(b=>b.addEventListener("click",()=>selectTrail(b.dataset.trail)));
 $("clear-filters")?.addEventListener("click",resetFilters);
 if(map)markers.forEach((m,id)=>m.setOpacity(list.some(t=>t.id===id)?1:.18));
}
function renderDetail(){
 const t=selected,p=photo[t.id]||[],composition=Object.entries(t.surfaceMix).filter(([,m])=>m>0).map(([label,m])=>`${esc(label)} ${m} mi`).join(" · ");
 const media=p.length?`<div class="photo-grid ${p.length>1?"multi":""}">${p.map((item,i)=>`<figure><img src="${item.src}" alt="${esc(item.alt)}" loading="${i?"lazy":"eager"}"><figcaption><span>${esc(item.place)}</span><a href="${item.url}" target="_blank" rel="noopener">Photo: ${esc(item.credit)}</a>${item.license?` · <a href="${item.license}" target="_blank" rel="noopener">License</a>`:""}</figcaption></figure>`).join("")}</div>`:`<div class="photo-unavailable">${uiIcon("route")}<span>Verified trail photos are being sourced for this path.</span></div>`;
 $("detail-panel").innerHTML=`<div class="detail-content"><header class="profile-head"><div class="detail-eyebrow"><i></i> PATH PROFILE <span>·</span> FRONT RANGE</div><nav class="profile-nav" aria-label="Path profile navigation"><a href="#results">← Back to results</a><a href="#map">View route map ↓</a></nav><h2 id="selected-trail-title" tabindex="-1">${esc(t.name)}</h2><p class="detail-area">Existing off-street bicycle facility · ${esc(t.surface.toLowerCase())} surface profile</p></header>
 <div class="stats-grid"><div class="stat">${uiIcon("distance")}<strong>${t.miles}</strong><span>MAPPED MI*</span></div><div class="stat">${uiIcon("surface")}<strong>${esc(t.surface)}</strong><span>SURFACE MIX</span></div><div class="stat">${uiIcon("segments")}<strong>${t.segmentCount}</strong><span>MAP SEGMENTS</span></div></div>
 <p class="stat-note">*Mapped segment total in this study area. It may include branches, gaps, or overlaps; it is not a continuous ride distance.</p>
 <section class="photos-section"><div class="section-heading"><h3>On this path</h3><a href="#map" class="map-jump">${uiIcon("map")} View mapped route</a></div>${media}</section>
 <div class="fit-box"><span class="section-label">WHY THIS MAY FIT</span><p>${esc(why(t))}. Choose a starting point and a distance that works for you.</p></div>
 <section class="detail-section"><h3>Know before you go</h3><p>DRCOG classifies these segments as existing off-street shared-use or unpaved paths. Surface mix in the mapped selection: ${composition}. Check the current path status with the local trail manager before riding.</p></section>
 <section class="detail-section"><h3>Explore this path</h3><p>The highlighted lines may be disconnected. The map pin marks the approximate center of the mapped area, not a trailhead.</p><div class="detail-actions"><a class="detail-link" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${t.point[0]}&mlon=${t.point[1]}#map=13/${t.point[0]}/${t.point[1]}">${uiIcon("external")} Open area map</a><button class="share-button" type="button" id="copy-link">Copy path link</button></div><p id="copy-status" class="copy-status" role="status"></p></section>
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
 $("map-status").innerHTML=`<strong>${esc(selected.name)}</strong><span>${selected.miles} mi mapped · ${esc(selected.surface)} · DRCOG segments</span>`;
}
function selectTrail(id){const t=trails.find(x=>x.id===id);if(!t)return;selected=t;history.replaceState(null,"",`?trail=${encodeURIComponent(id)}`);renderList();renderDetail();showRoute();if(matchMedia("(max-width:700px)").matches){$("selected-trail-title").focus({preventScroll:true});$("detail-panel").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"})}}
function resetFilters(){query="";lengthFilter="all";surfaceFilter="all";photosOnly=false;$("trail-search").value="";$("surface-filter").value="all";$("photo-filter").setAttribute("aria-pressed","false");document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter==="all")));renderList()}
$("search-form").addEventListener("submit",e=>{e.preventDefault();$("results").scrollIntoView({behavior:"smooth",block:"nearest"})});
$("trail-search").addEventListener("input",e=>{query=e.target.value.toLowerCase().trim();renderList()});
$("surface-filter").addEventListener("change",e=>{surfaceFilter=e.target.value;renderList()});
$("photo-filter").addEventListener("click",e=>{photosOnly=e.currentTarget.getAttribute("aria-pressed")!=="true";e.currentTarget.setAttribute("aria-pressed",String(photosOnly));renderList()});
$("reset-all").addEventListener("click",resetFilters);
$("place-filter").addEventListener("change",e=>{clearUserMarker();sortPoint=places[e.target.value]||null;sortLabel=e.target.selectedOptions[0].textContent;$("location-status").textContent=sortPoint?`Showing Colorado paths near ${sortLabel}.`:"";renderList()});
document.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{lengthFilter=btn.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));renderList()}));
$("near-me").addEventListener("click",()=>{
 if(!navigator.geolocation){locationFallback("Location is unavailable here. This demo covers Colorado’s Front Range.");return}
 $("location-status").textContent="Requesting approximate location…";
 navigator.geolocation.getCurrentPosition(position=>{const point=[position.coords.latitude,position.coords.longitude];if(nearestMappedKm(point)>160){locationFallback("You’re outside this demo’s Colorado Front Range coverage. The 30 paths remain available to explore.");return}sortPoint=point;sortLabel="you";$("place-filter").value="";$("location-status").textContent="Paths sorted by approximate center distance from you.";renderList();if(map){clearUserMarker();userMarker=L.circleMarker(sortPoint,{radius:7,color:"#fff",weight:3,fillColor:"#286cb4",fillOpacity:1}).addTo(map).bindTooltip("Your approximate location")}},()=>locationFallback("Location wasn’t available. This demo covers Colorado’s Front Range."),{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
});
$("recenter").addEventListener("click",()=>showRoute());
async function start(){try{const response=await fetch("./data/trails.json");if(!response.ok)throw Error("Data missing");snapshot=await response.json();if(!Array.isArray(snapshot.trails)||snapshot.trails.length<20)throw Error("Catalog incomplete");trails=snapshot.trails;selected=trails.find(t=>t.id===new URLSearchParams(location.search).get("trail"))||trails[0];$("catalog-count").textContent=`${trails.length} PATHS / REGIONAL DATA`;$("snapshot-date").textContent=`Data snapshot ${snapshot.updated}`;renderList();renderDetail();initMap()}catch(e){$("result-count").textContent="Unavailable";$("trail-list").innerHTML='<p class="list-empty">The path catalog could not load. Please refresh or visit the DRCOG data source linked below.</p>';$("map-status").textContent="Path data unavailable.";$("detail-panel").innerHTML=`<div class="detail-placeholder"><h2>Path data unavailable</h2><p>Explore the <a href="${sourceURL}">DRCOG bicycle facilities inventory ↗</a>.</p></div>`;console.error(e)}}
start();
