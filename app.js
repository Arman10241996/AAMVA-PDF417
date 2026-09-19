(() => {
  const LF="\n", RS=String.fromCharCode(30), CR="\r", VERSION="08";
  const $=id=>document.getElementById(id);

  const mandatory = [
    ["DCA","Jurisdiction-specific vehicle class","text","C"],
    ["DCB","Jurisdiction-specific restriction codes","text","NONE"],
    ["DCD","Jurisdiction-specific endorsement codes","text","NONE"],
    ["DBA","Document Expiration Date","date","2027-11-25"],
    ["DCS","Customer Family Name","text","PUBLIC"],
    ["DAC","Customer First Name","text","JOHN"],
    ["DAD","Customer Middle Name(s)","text","NONE"],
    ["DBD","Document Issue Date","date","2022-04-11"],
    ["DBB","Date of Birth","date","1993-11-25"],
    ["DBC","Physical Description – Sex","select-sex","1"],
    ["DAY","Physical Description – Eye Color","select-eye","BRO"],
    ["DAU","Physical Description – Height","text","072 IN"],
    ["DAG","Address – Street 1","text","12918 SHERMAN WAY"],
    ["DAI","Address – City","text","NORTH HOLLYWOOD"],
    ["DAJ","Address – Jurisdiction Code","text","CA"],
    ["DAK","Address – Postal Code","text","91605000"],
    ["DAQ","Customer ID Number","text","SAMPLE8423"],
    ["DCF","Document Discriminator","text","QA/11/2022/40ZK3/CCFD/27"],
    ["DCG","Country Identification","text","USA"],
    ["DDE","Family name truncation","select-trunc","N"],
    ["DDF","First name truncation","select-trunc","N"],
    ["DDG","Middle name truncation","select-trunc","N"]
  ];

  const optional = [
    ["DAH","Address – Street 2","text",""],
    ["DAZ","Hair color","select-hair","BRO"],
    ["DCI","Place of birth","text",""],
    ["DCJ","Audit information","text",""],
    ["DCK","Inventory control number","text","QA22101SAMPLE0401"],
    ["DBN","Alias / AKA Family Name","text",""],
    ["DBG","Alias / AKA Given Name","text",""],
    ["DBS","Alias / AKA Suffix Name","text",""],
    ["DCU","Name Suffix","text",""],
    ["DCE","Physical Description – Weight Range","text",""],
    ["DCL","Race / ethnicity","text",""],
    ["DCM","Standard vehicle classification","text",""],
    ["DCN","Standard endorsement code","text",""],
    ["DCO","Standard restriction code","text",""],
    ["DCP","Jurisdiction-specific vehicle classification description","text",""],
    ["DCQ","Jurisdiction-specific endorsement code description","text",""],
    ["DCR","Jurisdiction-specific restriction code description","text",""],
    ["DDA","Compliance Type","text","N"],
    ["DDB","Card Revision Date","date","2017-08-29"],
    ["DDC","HAZMAT Endorsement Expiration Date","date",""],
    ["DDD","Limited Duration Document Indicator","text",""],
    ["DAW","Weight (pounds)","text","125"],
    ["DAX","Weight (kilograms)","text",""],
    ["DDH","Under 18 Until","date",""],
    ["DDI","Under 19 Until","date",""],
    ["DDJ","Under 21 Until","date",""],
    ["DDK","Organ Donor Indicator","text","0"],
    ["DDL","Veteran Indicator","text",""]
  ];

  const profiles={
    generic:{name:"Generic AAMVA v8",defaults:{DAJ:"CA",DCG:"USA",jurVersion:"00"}},
    ca:{name:"California QA profile",defaults:{DAJ:"CA",DCG:"USA",jurVersion:"01",DCA:"C"}}
  };

  const subfiles = [
    {type:"DL", dataMode:"primary", custom:""},
    // ZC is generated dynamically from the selected eye/hair colors so it never goes stale.
    {type:"ZC", dataMode:"auto-color", custom:"ZCC\nZCD"},
    {type:"", dataMode:"custom", custom:""},
    {type:"", dataMode:"custom", custom:""},
    {type:"", dataMode:"custom", custom:""}
  ];

  function zcEyeCode(day){
    const map={BLK:"BLK",BLU:"BLU",BRO:"BRN",GRN:"GRN",GRY:"GRY",HAZ:"HZL"};
    return map[sanitize(day)] || sanitize(day);
  }

  function zcHairCode(daz){
    const map={BLK:"BLK",BLN:"BLN",BRO:"BRN",GRY:"GRY",RED:"RED",WHI:"WHI"};
    return map[sanitize(daz)] || sanitize(daz);
  }

  function buildZCBody(extra=""){
    // Always derive jurisdiction color fields from the values entered above.
    // DAY (eye color) -> ZCZCA..., DAZ (hair color) -> ZCB...
    const eye = val("DAY");
    const hair = val("DAZ");
    const lines=[];
    if(eye) lines.push("ZCA"+zcEyeCode(eye));
    if(hair) lines.push("ZCB"+zcHairCode(hair));
    String(extra||"").split(/\r?\n/).map(sanitize).filter(Boolean).forEach(line=>{
      // Prevent manually-entered ZCA/ZCB values from overriding the synchronized ones.
      if(!/^ZC[AB]/.test(line)) lines.push(line);
    });
    return lines.join(LF)+CR;
  }

  function makeInput(def){
    const [id,desc,type,val]=def;
    let el;
    if(type==="date"){
      el=document.createElement("input"); el.type="date"; el.value=val;
    }else if(type==="select-sex"){
      el=document.createElement("select");
      [["1","1 — Male"],["2","2 — Female"],["9","9 — Not specified"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;el.appendChild(o)}); el.value=val;
    }else if(type==="select-eye"){
      el=document.createElement("select"); ["BLK","BLU","BRO","GRN","GRY","HAZ"].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;el.appendChild(o)}); el.value=val;
    }else if(type==="select-hair"){
      el=document.createElement("select"); ["BLK","BLN","BRO","GRY","RED","WHI"].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;el.appendChild(o)}); el.value=val;
    }else if(type==="select-trunc"){
      el=document.createElement("select"); [["N","N — No"],["T","T — Truncated"],["U","U — Unknown"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;el.appendChild(o)}); el.value=val;
    }else{
      el=document.createElement("input"); el.type="text"; el.value=val;
    }
    el.id=id; el.dataset.fieldId=id; el.addEventListener("input",updateAll); el.addEventListener("change",updateAll);
    return el;
  }

  function renderFields(containerId, defs){
    const c=$(containerId); c.innerHTML="";
    defs.forEach(def=>{
      const row=document.createElement("div"); row.className="field-row";
      const meta=document.createElement("div");
      const code=document.createElement("div"); code.className="field-code"; code.textContent=def[0]+":";
      const desc=document.createElement("div"); desc.className="field-desc"; desc.textContent=def[1];
      meta.append(code,desc);
      const wrap=document.createElement("div"); wrap.className="field-input-wrap"; wrap.appendChild(makeInput(def));
      row.append(meta,wrap); c.appendChild(row);
    });
  }

  function sanitize(v){return String(v??"").replace(/[\r\n\x1e]/g," ").trim().toUpperCase()}
  function mmddyyyy(v){if(!v)return"";const p=v.split("-");return p.length===3?p[1]+p[2]+p[0]:""}
  function val(id){
    const el=$(id); if(!el)return"";
    const def=[...mandatory,...optional].find(x=>x[0]===id);
    return def && def[2]==="date" ? mmddyyyy(el.value) : sanitize(el.value);
  }

  function buildPrimaryBody(){
    // Scanner-oriented field order matching common decoded AAMVA displays.
    // Values remain user-editable QA/test data.
    const order=[
      "DAQ","DCS","DDE","DAC","DDF","DAD","DDG",
      "DCA","DCB","DCD","DBD","DBB","DBA","DBC",
      "DAU","DAY","DAG","DAI","DAJ","DAK","DCF","DCG",
      "DAW","DAZ","DCK","DDA","DDB",
      "DAH","DCI","DCJ","DBN","DBG","DBS","DCU","DCE","DCL","DCM","DCN","DCO","DCP","DCQ","DCR","DDC","DDD","DAX","DDH","DDI","DDJ","DDK","DDL"
    ];
    const known=new Set([...mandatory,...optional].map(x=>x[0]));
    const lines=[];
    order.forEach(id=>{
      if(!known.has(id)) return;
      const v=val(id);
      if(v!=="") lines.push(id+v);
    });
    document.querySelectorAll(".jur-row").forEach(row=>{
      const id=sanitize(row.querySelector(".jur-id").value);
      const v=sanitize(row.querySelector(".jur-value").value);
      if(/^[A-Z0-9]{3}$/.test(id) && v) lines.push(id+v);
    });
    return lines.join(LF)+CR;
  }

  function activeSubfiles(){
    return subfiles.filter((s,i)=>i===0 || /^[A-Z0-9]{2}$/.test(s.type));
  }

  function buildPayload(){
    const iin=sanitize($("iin").value), jur=sanitize($("jurVersion").value).padStart(2,"0");
    if(!/^\d{6}$/.test(iin)) throw new Error("Issuer Identification Number must be exactly 6 digits.");
    if(!/^\d{2}$/.test(jur)) throw new Error("Jurisdiction Version Number must be exactly 2 digits.");

    const active=activeSubfiles();
    if(!active.length) throw new Error("At least one subfile is required.");
    const count=String(active.length).padStart(2,"0");
    const fixed="@" + LF + RS + CR + "ANSI " + iin + VERSION + jur + count;
    const designatorBytes=active.length*10;
    let offset=fixed.length+designatorBytes;

    const payloadSubs=active.map((s,idx)=>{
      let body;
      if(idx===0) body=buildPrimaryBody();
      else if(s.type==="ZC" && s.dataMode==="auto-color") body=buildZCBody(s.custom);
      else body=String(s.custom||"").split(/\r?\n/).map(sanitize).filter(Boolean).join(LF)+CR;
      const type=idx===0 ? (s.type || "DL") : s.type;
      const full=type+body;
      const item={type,offset,length:full.length,full};
      offset+=full.length;
      return item;
    });

    const designators=payloadSubs.map(s=>s.type+String(s.offset).padStart(4,"0")+String(s.length).padStart(4,"0")).join("");
    const payload=fixed+designators+payloadSubs.map(s=>s.full).join("");
    return {payload,fixed,payloadSubs,count};
  }

  function renderSubfiles(){
    const c=$("subfileRows"); c.innerHTML="";
    subfiles.forEach((s,i)=>{
      const row=document.createElement("div"); row.className="subfile-row";
      const typeLab=document.createElement("label"); typeLab.textContent=i===0?"Primary type":"Subfile type";
      const type=document.createElement("input"); type.maxLength=2; type.value=s.type; type.placeholder="DL"; type.disabled=i===0;
      type.addEventListener("input",()=>{s.type=sanitize(type.value).slice(0,2);updateAll()});
      typeLab.appendChild(type);

      const offLab=document.createElement("label"); offLab.textContent="Offset";
      const off=document.createElement("input"); off.className="auto"; off.disabled=true; off.id="sfOff"+i; off.value="0000"; offLab.appendChild(off);

      const lenLab=document.createElement("label"); lenLab.textContent="Length";
      const len=document.createElement("input"); len.className="auto"; len.disabled=true; len.id="sfLen"+i; len.value="0000"; lenLab.appendChild(len);

      const dataLab=document.createElement("label"); dataLab.textContent=i===0?"Data":(s.dataMode==="auto-color"?"Extra ZC data (eye/hair auto-sync)":"Custom subfile data");
      const data=document.createElement(i===0?"input":"textarea"); data.value=s.custom; data.disabled=i===0; data.placeholder=i===0?"Built from Builder fields":(s.dataMode==="auto-color"?"ZCA/ZCB are automatic; add extra ZC lines here":"One element per line");
      data.addEventListener("input",()=>{s.custom=data.value;updateAll()}); dataLab.appendChild(data);

      row.append(typeLab,offLab,lenLab,dataLab); c.appendChild(row);
    });
  }

  function addJurField(id="",value=""){
    const row=document.createElement("div"); row.className="jur-row";
    const a=document.createElement("input"); a.className="jur-id"; a.maxLength=3; a.placeholder="Suffix / ID"; a.value=id;
    const b=document.createElement("input"); b.className="jur-value"; b.placeholder="Insert data…"; b.value=value;
    const del=document.createElement("button"); del.type="button"; del.textContent="×";
    [a,b].forEach(x=>x.addEventListener("input",updateAll));
    del.addEventListener("click",()=>{row.remove();updateAll()});
    row.append(a,b,del); $("jurFields").appendChild(row);
  }

  function validate(){
    const issues=[];
    if(!/^\d{6}$/.test($("iin").value.trim())) issues.push("Issuer Identification Number must contain 6 digits.");
    if(!/^\d{2}$/.test($("jurVersion").value.trim())) issues.push("Jurisdiction Version Number must contain 2 digits.");
    mandatory.forEach(def=>{ if(!val(def[0])) issues.push(def[0]+" is required."); });
    if($("jurPreset").value==="ca"){
      if(val("DAJ")!=="CA") issues.push("California QA preset expects DAJ = CA.");
      if(val("DCG")!=="USA") issues.push("California QA preset expects DCG = USA.");
    }
    const list=$("validationList"); list.innerHTML="";
    if(!issues.length){const li=document.createElement("li");li.textContent="All mandatory field checks passed.";list.appendChild(li)}
    else issues.slice(0,10).forEach(x=>{const li=document.createElement("li");li.textContent=x;list.appendChild(li)});
    return issues;
  }

  function tokenized(s){return s.replace(/\x1e/g,"<RS>").replace(/\r/g,"<CR>\n").replace(/\n/g,"<LF>\n")}
  function untokenized(s){return s.replace(/<RS>/g,RS).replace(/<CR>\n?/g,CR).replace(/<LF>\n?/g,LF)}

  function inspect(b){
    const p=b.payload;
    $("iCompliance").textContent=p[0]||"—";
    $("iFileType").textContent=p.slice(4,9)||"—";
    $("iIIN").textContent=p.slice(9,15)||"—";
    $("iVersion").textContent=p.slice(15,17)||"—";
    $("iJurVersion").textContent=p.slice(17,19)||"—";
    $("iEntries").textContent=p.slice(19,21)||"—";

    const sf=$("subfileInspector"); sf.innerHTML="";
    b.payloadSubs.forEach(s=>{
      const tr=document.createElement("tr");
      [s.type,String(s.offset).padStart(4,"0"),String(s.length).padStart(4,"0")].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});
      sf.appendChild(tr);
    });

    const tbody=$("elementTable"); tbody.innerHTML="";
    const primary=b.payloadSubs[0]?.full||"";
    primary.slice(2).replace(/\r/g,"\n").split("\n").filter(Boolean).forEach(line=>{
      if(line.length<3)return;
      const tr=document.createElement("tr"),td1=document.createElement("td"),td2=document.createElement("td");
      td1.textContent=line.slice(0,3);td2.textContent=line.slice(3);tr.append(td1,td2);tbody.appendChild(tr);
    });
  }

  function renderBarcode(payload){
    if(typeof bwipjs==="undefined") throw new Error("Barcode engine failed to load.");
    bwipjs.toCanvas("barcodeCanvas",{bcid:"pdf417",text:payload,scale:3,height:12,columns:7,eclevel:5,includetext:false,paddingwidth:8,paddingheight:8});
    $("downloadBtn").disabled=false;$("printBtn").disabled=false;
  }

  function updateAll(){
    validate();
    try{
      const b=buildPayload();
      $("entryCount").value=b.count;
      $("entriesMetric").textContent=b.count;
      $("totalMetric").textContent=b.payload.length;
      $("primaryMetric").textContent=b.payloadSubs[0]?.type||"—";
      $("rawPayload").value=tokenized(b.payload);
      b.payloadSubs.forEach((s,i)=>{if($("sfOff"+i))$("sfOff"+i).value=String(s.offset).padStart(4,"0");if($("sfLen"+i))$("sfLen"+i).value=String(s.length).padStart(4,"0")});
      for(let i=b.payloadSubs.length;i<5;i++){if($("sfOff"+i))$("sfOff"+i).value="0000";if($("sfLen"+i))$("sfLen"+i).value="0000"}
      inspect(b);
    }catch(e){}
  }

  function generate(){
    try{
      const issues=validate();
      const b=buildPayload();
      renderBarcode(b.payload); inspect(b);
      $("rawPayload").value=tokenized(b.payload);
      $("status").textContent=issues.length ? "Barcode generated with validation warnings." : "AAMVA v8 PDF417 generated successfully.";
      $("status").className=issues.length?"status":"status ok";
      updateAll();
    }catch(e){$("status").textContent=e.message;$("status").className="status bad"}
  }

  function applyPreset(){
    const p=profiles[$("jurPreset").value]||profiles.generic;
    Object.entries(p.defaults).forEach(([id,v])=>{if($(id))$(id).value=v});
    updateAll();
    $("status").textContent=p.name+" loaded.";$("status").className="status";
  }

  renderFields("mandatoryFields",mandatory);
  renderFields("optionalFields",optional);
  renderSubfiles();
  addJurField();

  document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tabpage").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");$(btn.dataset.tab).classList.add("active");
    updateAll();
  }));

  $("jurPreset").addEventListener("change",applyPreset);
  $("iin").addEventListener("input",updateAll);$("jurVersion").addEventListener("input",updateAll);
  $("addJurFieldBtn").addEventListener("click",()=>addJurField());
  $("generateBtn").addEventListener("click",generate);
  $("resetBtn").addEventListener("click",()=>location.reload());
  $("rebuildRawBtn").addEventListener("click",updateAll);
  $("renderRawBtn").addEventListener("click",()=>{try{const p=untokenized($("rawPayload").value);renderBarcode(p);$("status").textContent="Raw payload rendered.";$("status").className="status ok"}catch(e){$("status").textContent=e.message;$("status").className="status bad"}});
  $("copyRawBtn").addEventListener("click",async()=>{try{const p=buildPayload().payload;if(navigator.clipboard)await navigator.clipboard.writeText(p);$("status").textContent="Raw payload copied.";$("status").className="status ok"}catch(e){$("status").textContent="Copy unavailable. Use the Raw payload tab.";$("status").className="status bad"}});
  $("downloadBtn").addEventListener("click",()=>{const a=document.createElement("a");a.download="aamva-v8-pdf417.png";a.href=$("barcodeCanvas").toDataURL("image/png");a.click()});
  $("printBtn").addEventListener("click",()=>window.print());

  window.addEventListener("load",()=>{
    applyPreset();
    if(typeof bwipjs==="undefined"){$("status").textContent="Barcode engine failed to load. Internet access is required for the included CDN build.";$("status").className="status bad";return}
    $("status").textContent="Barcode engine ready.";$("status").className="status";
    generate();
  });
})();