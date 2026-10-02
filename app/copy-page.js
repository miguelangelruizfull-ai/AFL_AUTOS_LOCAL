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
  if(["PRECIO","DISPONIBILIDAD","VISITA","DOCUMENTACION","NEGOCIACION","CONTACTO","UBICACION"].includes(intent)) return "ALTA";
  if(["FOTOS_VIDEO","MOTOR_ESPECIFICACIONES"].includes(intent)) return "MEDIA";
  return "BAJA";
}
function publicPrice(v){
  if(!v) return null;
  const c=v.commercial||{}, w=v.whatsapp||{};
  if(c.catalogPrice!=null && String(c.catalogPricePolicy||"").toUpperCase()!=="OMITIR") return {value:Number(c.catalogPrice),currency:c.currency||"MXN",scope:"PUBLIC"};
  if(w.price!=null && String(w.status||"").toUpperCase()!=="OCULTO") return {value:Number(w.price),currency:c.currency||"MXN",scope:"PUBLIC"};
  return null;
}
function privatePrice(v){
  if(!v) return null;
  const c=v.commercial||{};
  const value=Number(c.priceInternal);
  if(c.priceInternal==null || c.priceInternal==="" || !Number.isFinite(value) || value<=0) return null;
  return {value:value,currency:c.currency||"MXN",scope:"PRIVATE_INTERNAL"};
}
function priceForChannel(v,channel){
  if(["MESSENGER","WHATSAPP","LLAMADA"].includes(channel)) return privatePrice(v)||publicPrice(v);
  return publicPrice(v);
}

function availability(v){
  if(!v) return null;
  const x=String((v.commercial||{}).availability||"").toUpperCase();
  return ["DISPONIBLE","NO_DISPONIBLE","VENDIDO"].includes(x)?x:null;
}
function vehicleTitle(v){ return v ? ((v.vehicle&&v.vehicle.publicTitle)||v.title||v.id) : "UNIDAD_NO_VERIFICADA"; }
function outsideMexico(p){ return p.captured && p.country && p.country!=="México" && p.country!=="NO_DETERMINADO"; }

function businessClock(){
  const cfg=CONFIG.businessHours||{};
  const timeZone=cfg.timezone||"America/Mexico_City";
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:timeZone,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
  const part=function(type){const x=parts.find(function(p){return p.type===type;});return x?x.value:"";};
  const dayMap={Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0};
  const day=dayMap[part("weekday")];
  const hour=Number(part("hour")||0), minute=Number(part("minute")||0), now=hour*60+minute;
  const parse=function(v,fallback){const a=String(v||fallback).split(":").map(Number);return (a[0]||0)*60+(a[1]||0);};
  const openAt=parse(cfg.open,"08:00"), closeAt=parse(cfg.close,"21:00");
  const days=Array.isArray(cfg.days)?cfg.days:[1,2,3,4,5,6];
  const open=days.includes(day)&&now>=openAt&&now<closeAt;
  return {open:open,timeZone:timeZone,localTime:String(hour).padStart(2,"0")+":"+String(minute).padStart(2,"0"),label:open?"DENTRO_DE_HORARIO":"FUERA_DE_HORARIO"};
}
function callAction(ctx){
  if(!ctx.phone||!ctx.phone.captured||!ctx.phone.normalized||ctx.priority!=="ALTA") return null;
  return ctx.clock&&ctx.clock.open?"LLAMAR_AHORA":"PROGRAMAR_LLAMADA";
}
function salesFollow(ctx,language){
  const en=language==="en";
  if(ctx.phone&&ctx.phone.captured&&ctx.priority==="ALTA"){
    if(ctx.clock&&ctx.clock.open) return en?" Can I call you now to resolve the remaining details and coordinate the visit?":" ¿Te llamo ahora para resolver lo que falta y coordinar la visita?";
    return en?" We can schedule a call during the next business window to coordinate the visit.":" Si te parece, programamos una llamada en el próximo horario operativo para coordinar la visita.";
  }
  if(ctx.availability==="DISPONIBLE") return en?" What day works for you to come see it?":" ¿Qué día te queda bien para venir a verla?";
  return en?" Would you like me to send the approved photos of the vehicle?":" ¿Quieres que te comparta las fotos autorizadas de la unidad?";
}
function dialUrl(ctx){
  if(!ctx.phone||!ctx.phone.normalized) return null;
  let n=String(ctx.phone.normalized).replace(/\D/g,"");
  if(ctx.phone.country==="México"&&n.length===10) n="52"+n;
  return n?"tel:+"+n:null;
}

function responseType(channel,intent,verified){
  if(channel==="WHATSAPP") return "WHATSAPP_PRIVADA";
  if(channel==="MESSENGER") return "INBOX_MESSENGER_PRIVADA";
  if(channel==="LLAMADA") return "LLAMADA_PRIVADA";
  if(["UBICACION","FINANCIAMIENTO","CAMBIO_TOMA_A_CUENTA"].includes(intent)) return "PUBLICA";
  return verified?"PUBLICA":"PUBLICA_SEGURA_CON_CONTINUIDAD_PRIVADA";
}

function responseES(ctx){
  if(outsideMexico(ctx.phone)) return "Gracias. Ya tenemos registrado tu contacto; no necesitas volver a enviarlo. AFL AUTOS realiza la venta de sus vehículos en México. ¿La compra la realizarías en México?";
  if(ctx.intent==="UBICACION") return "Estamos en "+CONFIG.publicLocation+" ¿Te interesa coordinar una visita?";
  if(ctx.intent==="FINANCIAMIENTO") return "Por el momento AFL AUTOS trabaja únicamente venta de contado; no manejamos financiamiento.";
  if(ctx.intent==="CAMBIO_TOMA_A_CUENTA") return "Por el momento AFL AUTOS no toma vehículos a cuenta.";
  if(ctx.intent==="PRECIO"){
    if(ctx.price){
      const amount=new Intl.NumberFormat("es-MX",{style:"currency",currency:ctx.price.currency,maximumFractionDigits:0}).format(ctx.price.value);
      if(ctx.channel==="COMENTARIO") return vehicleTitle(ctx.vehicle)+" tiene un precio público vigente de "+amount+". Si te interesa, te envío por inbox la información confirmada de la unidad.";
      const follow=salesFollow(ctx,"es");
      return "El precio vigente confirmado de "+vehicleTitle(ctx.vehicle)+" es "+amount+"."+follow;
    }
    if(ctx.channel==="COMENTARIO" && privatePrice(ctx.vehicle)) return "Te mando por inbox el precio vigente y la información confirmada de "+vehicleTitle(ctx.vehicle)+".";
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
  if(ctx.intent==="CONTACTO"){
    if(ctx.phone.captured) return ctx.clock&&ctx.clock.open ? "Ya tenemos registrado tu contacto; no necesitas volver a enviarlo. ¿Te llamo ahora para continuar?" : "Ya tenemos registrado tu contacto; no necesitas volver a enviarlo. Podemos programar una llamada en el próximo horario operativo.";
    return "Podemos continuar por este medio y pasar a llamada o WhatsApp solo si ayuda a avanzar la venta.";
  }
  return "Gracias por tu mensaje. Voy a verificar la unidad y la información vigente para responderte correctamente.";
}

function responseEN(ctx){
  if(outsideMexico(ctx.phone)) return "Thank you. We already have your contact information, so you do not need to send it again. AFL AUTOS sells its vehicles in Mexico. Will the purchase be completed in Mexico?";
  if(ctx.intent==="UBICACION") return "We are located at "+CONFIG.publicLocation+" Would you like to arrange a visit?";
  if(ctx.intent==="FINANCIAMIENTO") return "AFL AUTOS currently works with cash sales only; we do not offer financing.";
  if(ctx.intent==="CAMBIO_TOMA_A_CUENTA") return "AFL AUTOS does not currently accept trade-ins.";
  if(ctx.intent==="PRECIO"){
    if(ctx.price){
      const amount=new Intl.NumberFormat("en-US",{style:"currency",currency:ctx.price.currency,maximumFractionDigits:0}).format(ctx.price.value);
      if(ctx.channel==="COMENTARIO") return vehicleTitle(ctx.vehicle)+" has a current public price of "+amount+". I can send you the confirmed vehicle information by inbox.";
      const follow=salesFollow(ctx,"en");
      return "The current confirmed price of "+vehicleTitle(ctx.vehicle)+" is "+amount+"."+follow;
    }
    if(ctx.channel==="COMENTARIO" && privatePrice(ctx.vehicle)) return "I’ll send you the current price and confirmed information for "+vehicleTitle(ctx.vehicle)+" by inbox.";
    return "I’m confirming the current price of that exact vehicle before giving you a figure.";
  }
  if(ctx.intent==="DISPONIBILIDAD") return ctx.availability==="DISPONIBLE" ? "Yes, the vehicle is currently listed as available. I can share the confirmed information and approved media." : "I’m confirming the vehicle’s current availability before I assure you it is available.";
  if(ctx.intent==="FOTOS_VIDEO") return ctx.vehicle && ctx.vehicle.media && Number(ctx.vehicle.media.whatsappSelectedPhotos||0)>0 ? "Yes, we have approved media for that vehicle. I can share the available photos." : "I’m checking which approved photos or videos are available for that vehicle.";
  if(ctx.intent==="VISITA") return "We can arrange a visit. I’ll first confirm the exact vehicle and its availability.";
  if(ctx.intent==="NEGOCIACION") return "Any discount or special negotiation must be reviewed directly with an advisor after the vehicle and current terms are confirmed.";
  if(ctx.intent==="DOCUMENTACION") return "I’m confirming the authorized documentation information for that exact vehicle before giving you the details.";
  if(ctx.intent==="MOTOR_ESPECIFICACIONES") return "I’m verifying the exact vehicle before confirming engine, transmission, or drivetrain details.";
  if(ctx.intent==="CONTACTO"){
    if(ctx.phone.captured) return ctx.clock&&ctx.clock.open ? "We already have your contact information. Can I call you now to continue?" : "We already have your contact information. We can schedule a call during the next business window.";
    return "We can continue here and move to a call or WhatsApp only when it helps advance the sale.";
  }
  return "Thank you for your message. I’m verifying the exact vehicle and current information so I can answer correctly.";
}

function nextAction(ctx){
  if(outsideMexico(ctx.phone)) return "CONFIRMAR_COMPRA_EN_MEXICO";
  if(ctx.intent==="NEGOCIACION") return callAction(ctx)||"ESCALAR_NEGOCIACION_HUMANA";
  if(ctx.intent==="VISITA") return "PROPONER_VISITA";
  if(ctx.intent==="FOTOS_VIDEO") return ctx.vehicle&&ctx.vehicle.media&&Number(ctx.vehicle.media.whatsappSelectedPhotos||0)>0 ? "ENVIAR_FOTOS" : "PREPARAR_FOTOS";
  if(ctx.intent==="PRECIO"){
    if(ctx.price){
      if(ctx.channel==="COMENTARIO") return "RESPONDER_PRECIO_PUBLICO";
      if(ctx.availability==="DISPONIBLE") return callAction(ctx)||"PROPONER_VISITA";
      if(ctx.vehicle&&ctx.vehicle.media&&Number(ctx.vehicle.media.whatsappSelectedPhotos||0)>0) return "ENVIAR_FOTOS";
      return "RESPONDER_EN_CANAL";
    }
    if(ctx.channel==="COMENTARIO" && privatePrice(ctx.vehicle)) return "MOVER_A_INBOX_PRECIO";
    return "CONFIRMAR_PRECIO";
  }
  if(ctx.intent==="DISPONIBILIDAD"){
    if(ctx.availability==="DISPONIBLE") return callAction(ctx)||"PROPONER_VISITA";
    return ctx.availability?"RESPONDER_DISPONIBILIDAD":"CONFIRMAR_DISPONIBILIDAD";
  }
  if(ctx.intent==="DOCUMENTACION") return "CONFIRMAR_DOCUMENTACION";
  if(ctx.intent==="MOTOR_ESPECIFICACIONES") return ctx.vehicle?"RESPONDER_ESPECIFICACIONES_CONFIRMADAS":"CONFIRMAR_UNIDAD";
  if(ctx.intent==="CONTACTO") return callAction(ctx)||"RESPONDER_EN_CANAL";
  if(ctx.intent==="UBICACION") return "PROPONER_VISITA";
  return ctx.vehicle?"RESPONDER_EN_CANAL":"CONFIRMAR_UNIDAD";
}

function routeFor(action,ctx){
  const id=ctx.vehicle&&ctx.vehicle.id;
  const vehicleUrl=id?"index.html?vehicle="+encodeURIComponent(id)+"#prompt-menu":"index.html";
  if(["ENVIAR_FOTOS","PREPARAR_FOTOS","ENVIAR_VIDEO","PREPARAR_VIDEO"].includes(action)) return {label:"Abrir Multimedia",url:"MULTIMEDIA.html"};
  if(action==="LLAMAR_AHORA"&&dialUrl(ctx)) return {label:"Llamar al lead",url:dialUrl(ctx)};
  if(["PROPONER_VISITA","PROGRAMAR_SEGUIMIENTO","PROGRAMAR_LLAMADA"].includes(action)) return {label:"Abrir Programador",url:"PROGRAMADOR.html"};
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
  channel.append(option("COMENTARIO","Comentario público"),option("MESSENGER","Inbox / Messenger"),option("WHATSAPP","WhatsApp"),option("LLAMADA","Llamada"));
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
  ["NO REPETIR DATOS","VERIFICAR UNIDAD","PRECIO SEGÚN CANAL","PII PRIVADA","VENTA EN MÉXICO","NO AUTOENVÍO"].forEach(function(x,i){badges.append(element("span","copy-badge "+(i<2?"ok":"info"),x));});
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
    const price=priceForChannel(vehicleData,channel.value), avail=availability(vehicleData);
    const verified=Boolean(price||avail||(vehicleData&&intent==="MOTOR_ESPECIFICACIONES"));
    const ctx={channel:channel.value,message:raw,lang:lang,phone:phoneCtx,intent:intent,vehicle:vehicleData,price:price,availability:avail};
    ctx.clock=businessClock();
    ctx.type=responseType(ctx.channel,intent,verified);
    ctx.priority=priority(intent);
    ctx.stage=["VISITA","NEGOCIACION"].includes(intent)?"LEAD_CALIFICADO":(phoneCtx.captured&&ctx.priority==="ALTA"?"CONVERSACION_PRIORITARIA":"CONVERSACION");
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
      ["Horario AFL",ctx.clock.label+" · "+ctx.clock.localTime+" · "+ctx.clock.timeZone],
      ["Prioridad venta",ctx.priority==="ALTA"?"CLIENTE / VENTA":"FLUJO NORMAL"],
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
    if(ctx.priority==="ALTA") notes.push("Prioridad operativa: cliente/venta antes que publicación u organización interna.");
    if(ctx.phone.captured&&ctx.priority==="ALTA") notes.push(ctx.clock.open?"Dentro de horario: la llamada puede ejecutarse ahora si es la siguiente acción.":"Fuera de horario: programar llamada para la siguiente ventana operativa.");
    if(!ctx.vehicle && ["PRECIO","DISPONIBILIDAD","DOCUMENTACION","MOTOR_ESPECIFICACIONES"].includes(ctx.intent)) notes.push("La unidad exacta no está verificada.");
    if(outsideMexico(ctx.phone)) notes.push("Lead fuera de México: confirmar si la compra se realizará en México.");
    if(ctx.price && ctx.price.scope==="PRIVATE_INTERNAL") notes.push("Precio interno vigente autorizado para canal privado; no convertirlo en precio de catálogo ni publicación.");
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
    if(["PROPONER_VISITA","PROGRAMAR_SEGUIMIENTO","PROGRAMAR_LLAMADA"].includes(ctx.next)) og.append(link("Programador","PROGRAMADOR.html",false));
    if(ctx.next==="LLAMAR_AHORA"&&dialUrl(ctx)) og.append(link("Llamar ahora",dialUrl(ctx),false));
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
