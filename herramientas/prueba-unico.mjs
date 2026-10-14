/* Instalación de un solo emprendimiento.
   Requiere jsdom:  npm install --no-save jsdom
   Uso:            node herramientas/prueba-unico.mjs */
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearFirebaseFalso } from './firebase-falso.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errores = [];
const dom = new JSDOM(await readFile(RAIZ+'/index.html','utf8'), { url:'https://local.test/',
  virtualConsole:new VirtualConsole().on('jsdomError', e=>errores.push(e.message)) });
Object.assign(globalThis,{window:dom.window,document:dom.window.document,
  localStorage:dom.window.localStorage,sessionStorage:dom.window.sessionStorage,
  CustomEvent:dom.window.CustomEvent,Event:dom.window.Event,Blob:dom.window.Blob});
const fake = crearFirebaseFalso();
globalThis.__SDK_FIREBASE = fake.sdk;
globalThis.fetch = async u => {
  const k = String(u).replace(/^https?:\/\/[^/]+\//,'').replace(/^\.?\//,'');
  if (k === 'datos/firebase.json') return new Response(JSON.stringify({apiKey:'x',projectId:'p'}),{status:200});
  if (k.startsWith('api/base')) return new Response('',{status:404});
  try{ return new Response(await readFile(RAIZ+'/'+k,'utf8'),{status:200}); }
  catch{ return new Response('',{status:404}); }
};

const auth = await import(RAIZ+'/js/auth.js');
const alm  = await import(RAIZ+'/js/almacen.js');
const neg  = await import(RAIZ+'/js/negocios.js');
const cfg  = await import(RAIZ+'/js/config.js');
await import(RAIZ+'/js/app.js');
await new Promise(r=>setTimeout(r,500));
const d = document;
const paso=(n,f)=>{try{f();console.log('  ok  '+n)}catch(e){console.log('  MAL '+n+' → '+e.message);errores.push(n)}};
const pasoA=async(n,f)=>{try{await f();console.log('  ok  '+n)}catch(e){console.log('  MAL '+n+' → '+e.message);errores.push(n)}};
const esperar=(ms=700)=>new Promise(r=>setTimeout(r,ms));

console.log('== hay un solo emprendimiento ==');
paso('el catálogo trae uno', ()=>{
  if(neg.NEGOCIOS.length!==1) throw new Error('son '+neg.NEGOCIOS.length);
  if(!neg.UNICO) throw new Error('no se reconoce como instalación única');
  if(neg.NEGOCIOS[0].nombre!=='Lima Limón') throw new Error(neg.NEGOCIOS[0].nombre);
});

console.log('== el ingreso lleva la marca ==');
paso('el logo está en la pantalla de ingreso', ()=>{
  const img = d.querySelector('#marca-acceso img');
  if(!img) throw new Error('no se dibujó');
  if(!img.getAttribute('src').includes('lima-limon')) throw new Error('src: '+img.getAttribute('src'));
  if(!img.getAttribute('alt')) throw new Error('sin texto alternativo');
  if(!img.getAttribute('width')) throw new Error('sin medidas propias');
});
paso('se dibuja una sola vez', ()=>{
  if(d.querySelectorAll('#marca-acceso img').length!==1) throw new Error('hay más de uno');
});
paso('el favicon es el de la marca', ()=>{
  const i=d.querySelector('link[rel="icon"]');
  if(!/favicon-lima\.png/.test(i.href)) throw new Error('href: '+i.href);
});

console.log('== entrar es directo ==');
const uid = fake.sembrarCuenta('mica@'+cfg.DOMINIO_USUARIOS, auth.claveDe('1190'));
fake.poner('usuarios', uid, {usuario:'mica',nombre:'Mica',rol:'admin',negocios:['lima']});
await pasoA('no aparece la pantalla de elección', async()=>{
  d.getElementById('ing-usuario').value='mica';
  d.getElementById('ing-clave').value='1190';
  d.getElementById('ing-entrar').click();
  await esperar(900);
  if(!d.getElementById('elegir').hidden) throw new Error('preguntó dónde entrar');
  if(d.getElementById('app').hidden) throw new Error('no entró');
  if(alm.negocio!=='lima') throw new Error('negocio: '+alm.negocio);
});
paso('no se ofrece cambiar de emprendimiento', ()=>{
  if(d.getElementById('cambiar-negocio')) throw new Error('aparece el botón en la barra lateral');
  d.querySelector('#nav button[data-vista="ajustes"]').click();
  if(d.getElementById('cambiar-negocio-2')) throw new Error('aparece el botón en Ajustes');
});
paso('pero sí se puede cerrar sesión desde Ajustes', ()=>{
  if(!d.getElementById('salir-2')) throw new Error('no está');
});
paso('la barra lateral muestra el logo y el emprendimiento', ()=>{
  if(!d.querySelector('#marca-logo img')) throw new Error('sin logo');
  if(!d.getElementById('negocio-actual').textContent.includes('Lima Limón')) throw new Error('no lo nombra');
});

console.log('== los datos cuelgan del emprendimiento ==');
await pasoA('se guardan en negocios/lima', async()=>{
  alm.datos.productos.push({id:'u1',nombre:'Media 3/4',costoC:50000,margen:100,
    precioC:100000,talles:{U:10},activo:true});
  await alm.guardarYa();
  if(!fake.leer('negocios/lima/productos','u1')) throw new Error('no está donde corresponde');
  if(fake.leer('productos','u1')) throw new Error('quedó en la raíz');
});
await pasoA('un usuario sin la lista igual entra', async()=>{
  const u2 = fake.sembrarCuenta('vendedora@'+cfg.DOMINIO_USUARIOS, auth.claveDe('2222'));
  fake.poner('usuarios', u2, {usuario:'vendedora',nombre:'Vendedora',rol:'vendedor'});
  await auth.salir();
  const r = await auth.entrar('vendedora','2222');
  if(r.error) throw new Error(r.error);
  if(!auth.puedeEntrarA('lima')) throw new Error('no la deja entrar');
  if(auth.negociosPermitidos().length!==1) throw new Error('permitidos: '+auth.negociosPermitidos());
});

console.log('\n'+(errores.length?'FALLOS: '+errores.join(', '):'sin errores'));
process.exit(errores.length?1:0);
