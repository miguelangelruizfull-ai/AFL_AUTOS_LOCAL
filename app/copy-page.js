import { getJSON, element } from "./api.js";

const mount = document.getElementById("copyPage");
let CONFIG = {};
let VEHICLES = [];

function text(v){ return String(v || "").trim(); }
function norm(v){ return text(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

const LANG = {
  es:["hola","precio","cuanto","tienes","camioneta","troca","donde","ubicacion","quiero","informacion","gracias","disponible","factura","papeles","motor","fotos","visita"],
  en:["hello","price","how much","available","truck","where","location","interested","information","thanks","engine","photos","visit","title"],
  pt:["ola","preco","quanto","disponivel","caminhonete","onde","informacao","obrigado","motor","fotos"],
  fr:["bonjour","prix","combien","disponible","voiture","ou","information","merci","moteur","photos"],
  id:["harga","berapa","tersedia","mobil","dimana","informasi","terima kasih","mesin","foto"]
};
const LANG_LABEL={es:"Español",en:"English",pt:"Português",fr:"Français",id:"Bahasa Indonesia",ar:"Árabe",und:"No determinado"};

function detectLanguage(message){
  const raw=text(message);
  if(!raw) return {code:"und",label:LANG_LABEL.und,confidence:"BAJA"};
  if(/[\u0600-\u06ff]/.test(raw)) return {code:"ar",label:LANG_LABEL.ar,confidence:"ALTA"};
  const n=norm(raw);
  const ranked=Object.keys(LANG).map(function(code){
    let score=0;
    LANG[code].forEach(function(word){ if(n.indexOf(norm(word))>=0) score++; });
    return {code:code,score:score};
  }).sort(function(a,b){return b.score-a.score;});
  const best=ranked[0];
  if(!best || best.score===0) return {code:"und",label:LANG_LABEL.und,confidence:"BAJA"};
  return {code:best.code,label:LANG_LABEL[best.code],confidence:best.score>=3?"ALTA":best.score>=2?"MEDIA":"BAJA"};
}

function phoneCandidates(message){
  const matches=text(message).match(/(?:\+?\d[\d\s().-]{8,}\d)/g)||[];
  return matches.map(function(raw){ return {raw:raw,digits:raw.replace(/\D/g,"")}; })
    .filter(function(x){return x.digits.length>=10 && x.digits.length<=15;});
}
function normalizePhone(raw){ return text(raw).replace(/\D/g,""); }

function detectPhone(inputPhone,message){
  const candidates=[];
  if(text(inputPhone)) candidates.push({raw:inputPhone,digits:normalizePhone(inputPhone)});
  phoneCandidates(message).forEach(function(x){candidates.push(x);});
  const c=candidates.find(function(x){return x.digits.length>=10 && x.digits.length<=15;});
  if(!c) return {captured:false,normalized:null,country:null,area:null,region:null,repeated:false};

  let digits=c.digits, country="NO_DETERMINADO", national=digits, area=null, region=null;
  if(digits.startsWith("52") && digits.length>=12){
    country="México"; national=digits.slice(2);
    const a2=national.slice(0,2), a3=national.slice(0,3);
    area=CONFIG.mexicoLada[a2]?a2:a3; region=CONFIG.mexicoLada[area]||null;
  }else if(digits.length===10 && (CONFIG.mexicoLada[digits.slice(0,2)] || CONFIG.mexicoLada[digits.slice(0,3)])){
    country="México"; national=digits;
    const a2=national.slice(0,2), a3=national.slice(0,3);
    area=CONFIG.mexicoLada[a2]?a2:a3; region=CONFIG.mexicoLada[area]||null;
  }else if(digits.startsWith("1")&&digits.length===11){
    country="EE. UU./Canadá (NANP)";
    national=digits.slice(1);
    area=national.slice(0,3); region=CONFIG.nanpArea[area]||null;
  }else if(digits.length===10){
    const nanp=digits.slice(0,3);
    if(CONFIG.nanpArea[nanp]){
      country="EE. UU./Canadá (NANP)";
      area=nanp; region=CONFIG.nanpArea[area]||null; digits="1"+digits;
    }else{
      country="PAIS_PENDIENTE";
      area=digits.slice(0,3);
    }
  }else if(digits.startsWith("34")) country="España";
  else if(digits.startsWith("57")) country="Colombia";
  else if(digits.startsWith("54")) country="Argentina";
  else if(digits.startsWith("51")) country="Perú";
  else if(digits.startsWith("502")) country="Guatemala";
  else if(digits.startsWith("503")) country="El Salvador";
  else if(digits.startsWith("504")) country="Honduras";

  const count=candidates.filter(function(x){return normalizePhone(x.digits)===normalizePhone(c.digits);}).length;
  return {captured:true,normalized:digits,country:country,area:area,region:region,repeated:count>1};
}

function detectIntent(message){
  const n=norm(message);
  const rules=[
    ["NEGOCIACION",/(lo menos|ultimo precio|te doy|oferta|descuento|lowest|best price|offer|discount)/],
    ["PRECIO",/(precio|cuanto|cuesta|vale|price|how much)/],
    ["VISITA",/(verla|visita|puedo ir|cita|come see|visit|appointment)/],
    ["DISPONIBILIDAD",/(disponible|aun la tienes|todavia|available|still have)/],
    ["FOTOS_VIDEO",/(foto|fotos|video|videos|pictures|photos)/],
    ["DOCUMENTACION",/(factura|titulo|pedimento|papeles|documentos|documents|title)/],
    ["MOTOR_ESPECIFICACIONES",/(motor|engine|4x4|4x2|transmision|transmission|cabina|cilindros|v8|v6)/],
    ["FINANCIAMIENTO",/(financ|credito|mensualidad|credit|finance|payment plan)/],
    ["CAMBIO_TOMA_A_CUENTA",/(toma a cuenta|cambio por|trade.in|trade my)/],
    ["UBICACION",/(ubicacion|donde estan|where are|location)/],
    ["CONTACTO",/(whatsapp|telefono|llamada|phone|call me|contact)/]
  ];
  for(const pair of rules){ if(pair[1].test(n)) return pair[0]; }
  return "OTRA_PREGUNTA";
}
function priority(intent){
  if(["PRECIO","DISPONIBILIDAD","VISITA","DOCUMENTACION","NEGOCIACION","CONTACTO"].includes(intent)) return "ALTA";
  if(["FOTOS_VIDEO","MOTOR_ESPECIFICACIONES","UBICACION"].includes(intent)) return "MEDIA";
  return "BAJA";
}
function publicPrice(v){
  if(!v) return null;
  const c=v.commercial||{}, w=v.whatsapp||{};
  if(c.catalogPrice!=null && String(c.catalogPricePolicy||"").toUpperCase()!=="OMITIR") return {value:c.catalogPrice,currency:c.currency||"MXN"};
  if(w.price!=null && String(w.status||"").toUpperCase()!=="OCULTO") return {value:w.price,currency:c.currency||"MXN"};
  return null;
}
function availability(v){
  if(!v) return null;
  const x=String((v.commercial||{}).availability||"").toUpperCase();
  return ["DISPONIBLE","NO_DISPONIBLE","VENDIDO"].includes(x)?x:null;
}
function vehicleTitle(v){ return v ? ((v.vehicle&&v.vehicle.publicTitle)||v.title||v.id) : "UNIDAD_NO_VERIFICADA"; }
function outsideMexico(p){ return p.captured && p.country && p.country!=="México" && p.country!=="NO_DETERMINADO"; }

function responseType(channel,intent,verified){
  if(channel==="WHATSAPP") return "WHATSAPP_PRIVADA";
  if(channel==="MESSENGER") return "INBOX_PRIVADA";
  if(["UBICACION","FINANCIAMIENTO","CAMBIO_TOMA_A_CUENTA"].includes(intent)) return "PUBLICA";
  return verified?"PUBLICA":"PUBLICA_SEGURA_CON_CONTINUIDAD_PRIVADA";
}

function responseES(ctx){
  if(outsideMexico(ctx.phone)) return "Gracias. Ya tenemos registrado tu contacto; no necesitas volver a enviarlo. AFL AUTOS realiza la venta de sus vehículos en México. ¿La compra la realizarías en México?";
  if(ctx.intent==="UBICACION") return "Estamos en "+CONFIG.publicLocation+" ¿Te interesa coordinar una visita?";
  if(ctx.intent==="FINANCIAMIENTO") return "Por el momento AFL AUTOS trabaja únicamente venta de contado; no manejamos financiamiento.";
  if(ctx.intent==="CAMBIO_TOMA_A_CUENTA") return "Por el momento AFL AUTOS no toma vehículos a cuenta.";
  if(ctx.intent==="PRECIO"){
    if(ctx.price) return vehicleTitle(ctx.vehicle)+" tiene un precio vigente publicable de "+new Intl.NumberFormat("es-MX",{style:"currency",currency:ctx.price.currency,maximumFractionDigits:0}).format(ctx.price.value)+".";
    return "Voy a confirmar el precio vigente de esa unidad antes de darte una cifra para asegurar que recibas la información correcta.";
  }
  if(ctx.intent==="DISPONIBILIDAD"){
    if(ctx.availability==="DISPONIBLE") return "Sí, la unidad está registrada como disponible. Si gustas, te comparto la información confirmada y el material autorizado.";
    if(ctx.availability==="NO_DISPONIBLE"||ctx.availability==="VENDIDO") return "Esa unidad no aparece disponible actualmente. Puedo orientarte con otras unidades vigentes.";
    return "Voy a confirmar la disponibilidad vigente de esa unidad antes de asegurártelo.";
  }
  if(ctx.intent==="FOTOS_VIDEO"){
    if(ctx.vehicle && ctx.vehicle.media && Number(ctx.vehicle.media.whatsappSelectedPhotos||0)>0) return "Sí, tenemos material de esa unidad. Te puedo compartir las fotos autorizadas.";
    return "Voy a revisar qué fotos o video autorizados tenemos disponibles de esa unidad.";
  }
  if(ctx.intent==="VISITA") return "Sí podemos coordinar una visita. Primero voy a confirmar la unidad y su disponibilidad para proponerte el horario correcto.";
  if(ctx.intent==="NEGOCIACION") return "Cualquier ajuste o negociación se revisa directamente con un asesor después de confirmar la unidad y sus condiciones vigentes.";
  if(ctx.intent==="DOCUMENTACION") return "Voy a confirmar la documentación autorizada de esa unidad antes de darte el dato.";
  if(ctx.intent==="MOTOR_ESPECIFICACIONES"){
    if(ctx.vehicle && ctx.vehicle.vehicle && ctx.vehicle.vehicle.configuration){
      const c=ctx.vehicle.vehicle.configuration;
      const facts=[c.engine,c.transmission,c.drivetrain].filter(function(x){return x && String(x).toUpperCase()!=="PENDIENTE";});
      if(facts.length) return "Datos confirmados de la unidad seleccionada: "+facts.join(" · ")+".";
    }
    return "Voy a verificar la unidad exacta antes de confirmarte motor, transmisión o tracción.";
  }
  if(ctx.intent==="CONTACTO") return ctx.phone.captured ? "Ya tenemos registrado tu contacto; no necesitas volver a enviarlo. Continúo con el siguiente paso de tu solicitud." : "Podemos continuar por este medio y, si facilita el siguiente paso, pasar la atención a WhatsApp.";
  return "Gracias por tu mensaje. Voy a verificar la unidad y la información vigente para responderte correctamente.";
}
function responseEN(ctx){
  if(outsideMexico(ctx.phone)) return "Thank you. We already have your contact information, so you do not need to send it again. AFL AUTOS sells its vehicles in Mexico. Will the purchase be completed in Mexico?";
  if(ctx.intent==="UBICACION") return "We are located at "+CONFIG.publicLocation+" Would you like to arrange a visit?";
  if(ctx.intent==="FINANCIAMIENTO") return "AFL AUTOS currently works with cash sales only; we do not offer financing.";
  if(ctx.intent==="CAMBIO_TOMA_A_CUENTA") return "AFL AUTOS does not currently accept trade-ins.";
  if(ctx.intent==="PRECIO") return ctx.price ? vehicleTitle(ctx.vehicle)+" has a current publishable price of "+new Intl.NumberFormat("en-US",{style:"currency",currency:ctx.price.currency,maximumFractionDigits:0}).format(ctx.price.value)+"." : "I’m confirming the current price of that exact vehicle before giving you a figure.";
  if(ctx.intent==="DISPONIBILIDAD") return ctx.availability==="DISPONIBLE" ? "Yes, the vehicle is currently listed as available. I can share the confirmed information and approved media." : "I’m confirming the vehicle’s current availability before I assure you it is available.";
  if(ctx.intent==="FOTOS_VIDEO") return ctx.vehicle && ctx.vehicle.media && Number(ctx.vehicle.media.whatsappSelectedPhotos||0)>0 ? "Yes, we have approved media for that vehicle. I can share the available photos." : "I’m checking which approved photos or videos are available for that vehicle.";
  if(ctx.intent==="VISITA") return "We can arrange a visit. I’ll first confirm the exact vehicle and its availability.";
  if(ctx.intent==="NEGOCIACION") return "Any discount or special negotiation must be reviewed directly with an advisor after the vehicle and current terms are confirmed.";
  if(ctx.intent==="DOCUMENTACION") return "I’m confirming the authorized documentation information for that exact vehicle before giving you the details.";
  if(ctx.intent==="MOTOR_ESPECIFICACIONES") return "I’m verifying the exact vehicle before confirming engine, transmission, or drivetrain details.";
  if(ctx.intent==="CONTACTO") return ctx.phone.captured ? "We already have your contact information, so you do not need to send it again. I’ll continue with the next step." : "We can continue here and move to WhatsApp only if it helps with the next step.";
  return "Thank you for your message. I’m verifying the exact vehicle and current information so I can answer correctly.";
}

function nextAction(ctx){
  if(outsideMexico(ctx.phone)) return "CONFIRMAR_COMPRA_EN_MEXICO";
  if(ctx.intent==="NEGOCIACION") return "ESCALAR_NEGOCIACION_HUMANA";
  if(ctx.intent==="VISITA") return "PROPONER_VISITA";
  if(ctx.intent==="FOTOS_VIDEO") return ctx.vehicle&&ctx.vehicle.media&&Number(ctx.vehicle.media.whatsappSelectedPhotos||0)>0 ? "ENVIAR_FOTOS" : "PREPARAR_FOTOS";
  if(ctx.intent==="PRECIO") return ctx.price?"RESPONDER_PRECIO":"CONFIRMAR_PRECIO";
  if(ctx.intent==="DISPONIBILIDAD") return ctx.availability?"RESPONDER_DISPONIBILIDAD":"CONFIRMAR_DISPONIBILIDAD";
  if(ctx.intent==="DOCUMENTACION") return "CONFIRMAR_DOCUMENTACION";
  if(ctx.intent==="MOTOR_ESPECIFICACIONES") return ctx.vehicle?"RESPONDER_ESPECIFICACIONES_CONFIRMADAS":"CONFIRMAR_UNIDAD";
  if(ctx.intent==="CONTACTO" && ctx.channel!=="WHATSAPP") return ctx.phone.captured?"ABRIR_WHATSAPP_CLIENTE":"RESPONDER_EN_CANAL";
  if(ctx.intent==="UBICACION") return "ENVIAR_UBICACION";
  return ctx.vehicle?"RESPONDER_EN_CANAL":"CONFIRMAR_UNIDAD";
}
function routeFor(action,ctx){
  const id=ctx.vehicle&&ctx.vehicle.id;
  const vehicleUrl=id?"index.html?vehicle="+encodeURIComponent(id)+"#prompt-menu":"index.html";
  if(["ENVIAR_FOTOS","PREPARAR_FOTOS","ENVIAR_VIDEO","PREPARAR_VIDEO"].includes(action)) return {label:"Abrir Multimedia",url:"MULTIMEDIA.html"};
  if(["PROPONER_VISITA","PROGRAMAR_SEGUIMIENTO"].includes(action)) return {label:"Abrir Programador",url:"PROGRAMADOR.html"};
  if(["CONFIRMAR_UNIDAD","CONFIRMAR_PRECIO","CONFIRMAR_DISPONIBILIDAD","CONFIRMAR_DOCUMENTACION","RESPONDER_ESPECIFICACIONES_CONFIRMADAS"].includes(action)) return {label:id?"Abrir vehículo":"Abrir ROOT / inventario",url:vehicleUrl};
  if(action==="ABRIR_WHATSAPP_CLIENTE" && ctx.phone.captured && ctx.phone.normalized) return {label:"Abrir WhatsApp del lead",url:"https://wa.me/"+ctx.phone.normalized};
  return null;
}
function learning(ctx){
  if(ctx.phone.repeated) return "DATO_REPETIDO_EN_CONTEXTO → FIELD_LOCK_TELEFONO";
  if(ctx.phone.captured) return "FIELD_LOCK_TELEFONO_ACTIVO → NO_VOLVER_A_PREGUNTAR";
  if(!ctx.vehicle && ["PRECIO","DISPONIBILIDAD","MOTOR_ESPECIFICACIONES","DOCUMENTACION"].includes(ctx.intent)) return "UNIDAD_NO_VERIFICADA → NO_AFIRMAR_DATO";
  return "SIN_CANDIDATO_NUEVO";
}

function option(value,label){ const o=element("option","",label); o.value=value; return o; }
function field(label,node,full){ const w=element("label","copy-field"+(full?" full":"")); w.append(element("span","",label),node); return w; }
function button(label,primary){ const b=element("button",primary?"btn primary":"btn",label); b.type="button"; return b; }
function link(label,url,primary){ const a=element("a",primary?"btn primary":"btn",label); a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; return a; }
function copy(value,status){ navigator.clipboard.writeText(value).then(function(){status.textContent="Copiado";}).catch(function(){status.textContent="No se pudo copiar automáticamente";}); }

async function loadVehicle(id){
  if(!id) return null;
  const summary=VEHICLES.find(function(v){return v.id===id;});
  if(!summary) return null;
  if(!summary.detail) return summary;
  try{return await getJSON(summary.detail);}catch{return summary;}
}

function render(){
  const layout=element("section","copy-layout");
  const left=element("div","copy-form"), right=element("div","copy-results");

  const formPanel=element("article","copy-panel");
  formPanel.append(element("div","eyebrow","Entrada"),element("h2","","Generar respuesta"));
  const grid=element("div","copy-form-grid");
  const channel=element("select");
  channel.append(option("COMENTARIO","Comentario público"),option("MESSENGER","Inbox / Messenger"),option("WHATSAPP","WhatsApp"));
  const vehicle=element("select");
  vehicle.append(option("","Unidad no seleccionada / verificar"));
  VEHICLES.forEach(function(v){vehicle.append(option(v.id,v.id+" · "+v.title));});
  const phone=element("input"); phone.type="tel"; phone.placeholder="Opcional · no se guarda en HOME/repo";
  const message=element("textarea"); message.placeholder="Pega el comentario, mensaje o conversación. Se detecta idioma, intención y teléfono si aparece.";
  grid.append(field("Canal",channel),field("Vehículo",vehicle),field("Teléfono si ya está capturado",phone),field("Mensaje / conversación",message,true));
  const run=button("Analizar y generar",true), reset=button("Limpiar",false);
  const actions=element("div","actions"); actions.append(run,reset);
  formPanel.append(grid,actions,element("p","copy-note","PII permanece solo en esta sesión del navegador. No se escribe en JSON, localStorage ni URLs del HOME."));

  const rules=element("article","copy-panel");
  rules.append(element("div","eyebrow","Reglas activas"),element("h2","","Guardrails"));
  const badges=element("div","copy-badges");
  ["NO REPETIR DATOS","VERIFICAR UNIDAD","PRECIO PUBLICABLE","PII PRIVADA","VENTA EN MÉXICO","NO AUTOENVÍO"].forEach(function(x,i){badges.append(element("span","copy-badge "+(i<2?"ok":"info"),x));});
  rules.append(badges);

  function emptyPanel(msg){
    const p=element("article","copy-panel");
    p.append(element("div","eyebrow","Resultado"),element("h2","","Esperando mensaje"),element("p","copy-note",msg||"Genera una respuesta para mostrar clasificación, idioma, LADA/área y siguiente acción."));
    return p;
  }
  right.append(emptyPanel());

  async function analyze(){
    const raw=text(message.value);
    if(!raw){right.replaceChildren(emptyPanel("Escribe o pega un mensaje antes de analizar."));return;}
    const lang=detectLanguage(raw), phoneCtx=detectPhone(phone.value,raw), intent=detectIntent(raw);
    const vehicleData=await loadVehicle(vehicle.value);
    const price=publicPrice(vehicleData), avail=availability(vehicleData);
    const verified=Boolean(price||avail||(vehicleData&&intent==="MOTOR_ESPECIFICACIONES"));
    const ctx={channel:channel.value,message:raw,lang:lang,phone:phoneCtx,intent:intent,vehicle:vehicleData,price:price,availability:avail};
    ctx.type=responseType(ctx.channel,intent,verified);
    ctx.priority=priority(intent);
    ctx.stage=phoneCtx.captured&&ctx.priority==="ALTA"?"LEAD_CALIFICADO":"CONVERSACION";
    ctx.next=nextAction(ctx);
    ctx.response=lang.code==="en"?responseEN(ctx):responseES(ctx);
    ctx.route=routeFor(ctx.next,ctx);
    ctx.learning=learning(ctx);
    renderResult(ctx);
  }

  function renderResult(ctx){
    right.replaceChildren();
    const summary=element("article","copy-panel");
    summary.append(element("div","eyebrow","Clasificación"),element("h2","","Resultado operativo"));
    const meta=element("div","copy-result-grid");
    [
      ["Idioma",ctx.lang.label+" · "+ctx.lang.confidence],
      ["Intención",ctx.intent],["Tipo",ctx.type],["Prioridad",ctx.priority],["Etapa",ctx.stage],
      ["Unidad",vehicleTitle(ctx.vehicle)],
      ["Teléfono",ctx.phone.captured?"CAPTURADO · BLOQUEADO PARA REPREGUNTA":"NO DETECTADO"],
      ["LADA / Área",ctx.phone.area||"NO APLICA"],["País",ctx.phone.country||"NO DETERMINADO"],["Región probable",ctx.phone.region||"NO DETERMINADA"]
    ].forEach(function(pair){const box=element("div");box.append(element("span","",pair[0]),element("strong","",pair[1]));meta.append(box);});
    summary.append(meta);

    const response=element("article","copy-panel");
    response.append(element("div","eyebrow","Respuesta para lead"),element("h2","","Copy listo"));
    const box=element("div","copy-response",ctx.response), status=element("div","copy-status-line","");
    const copyBtn=button("Copiar respuesta",true); copyBtn.addEventListener("click",function(){copy(ctx.response,status);});
    const ra=element("div","actions"); ra.append(copyBtn); response.append(box,ra,status);

    const action=element("article","copy-panel copy-action");
    action.append(element("div","eyebrow","Recomendado ahora"),element("h3","",ctx.next));
    const notes=[];
    if(ctx.phone.captured) notes.push("Contacto ya capturado: no volver a pedirlo.");
    if(!ctx.vehicle && ["PRECIO","DISPONIBILIDAD","DOCUMENTACION","MOTOR_ESPECIFICACIONES"].includes(ctx.intent)) notes.push("La unidad exacta no está verificada.");
    if(outsideMexico(ctx.phone)) notes.push("Lead fuera de México: confirmar si la compra se realizará en México.");
    if(notes.length) action.append(element("p","copy-note",notes.join(" ")));
    const aa=element("div","actions");
    if(ctx.route) aa.append(link("Ir a siguiente acción · "+ctx.route.label,ctx.route.url,true));
    else aa.append(element("span","copy-status-line","La siguiente acción se ejecuta en el mismo canal; copia la respuesta y continúa."));
    action.append(aa);

    const learn=element("article","copy-panel");
    learn.append(element("div","eyebrow","Aprendizaje"),element("h2","","Candidato / guardrail"),element("div","copy-status-line",ctx.learning));

    const options=element("article","copy-panel");
    options.append(element("div","eyebrow","Opciones"),element("h2","","Continuar"));
    const og=element("div","copy-options");
    og.append(link("ROOT / vehículos","index.html",false));
    if(ctx.vehicle&&ctx.vehicle.id) og.append(link("Abrir unidad","index.html?vehicle="+encodeURIComponent(ctx.vehicle.id)+"#prompt-menu",false));
    if(ctx.intent==="FOTOS_VIDEO"||["ENVIAR_FOTOS","PREPARAR_FOTOS"].includes(ctx.next)) og.append(link("Multimedia","MULTIMEDIA.html",false));
    if(ctx.next==="PROPONER_VISITA"||ctx.next==="PROGRAMAR_SEGUIMIENTO") og.append(link("Programador","PROGRAMADOR.html",false));
    og.append(link("Nuevo vehículo","NUEVO_VEHICULO.html",false));
    options.append(og);
    right.append(summary,response,action,learn,options);
  }

  run.addEventListener("click",analyze);
  reset.addEventListener("click",function(){message.value="";phone.value="";vehicle.value="";channel.value="COMENTARIO";right.replaceChildren(emptyPanel());});
  left.append(formPanel,rules); layout.append(left,right); mount.replaceChildren(layout);
}

async function init(){
  try{
    const data=await Promise.all([getJSON("data/copy-page.json"),getJSON("data/vehicles/index.json")]);
    CONFIG=data[0]||{}; VEHICLES=(data[1]&&Array.isArray(data[1].vehicles))?data[1].vehicles:[];
    render();
  }catch(error){mount.replaceChildren(element("div","error","No se pudo cargar Copy Page: "+error.message));}
}
init();
