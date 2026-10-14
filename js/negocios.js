/* --------------------------------------------------------------------------
   NEGOCIOS

   Esta instalación atiende un solo emprendimiento, pero la estructura admite
   más: los datos cuelgan de `negocios/{id}/…` y cada uno tendría su paleta y
   su logo.

   Con uno solo, la aplicación se simplifica sola: la pantalla de ingreso
   muestra la marca, no hay pantalla de elección y no aparece el botón de
   cambiar de emprendimiento. Con dos o más, esas tres cosas aparecen.

   El `id` queda escrito en la ruta de los datos y en el permiso de cada
   usuario, así que no se cambia una vez que hay información cargada.
   -------------------------------------------------------------------------- */

export const NEGOCIOS = [
  {
    id: 'lima',
    nombre: 'Lima Limón',
    detalle: 'Lencería y medias',
    favicon: 'marca/favicon-lima.png',
    logo: { src: 'marca/lima-limon.png', ancho: 320, alto: 320, forma: 'insignia' },
    barra: { claro: '#DFE5B8', oscuro: '#12150C' }
  }
];

/* Verdadero cuando hay un solo emprendimiento: de eso dependen el logo en el
   ingreso y que no haga falta elegir. */
export const UNICO = NEGOCIOS.length === 1;

export const NEGOCIO_POR_DEFECTO = NEGOCIOS[0].id;
export const CLAVE_NEGOCIO = 'indumentaria.negocio';

export const buscarNegocio = id => NEGOCIOS.find(n => n.id === id) || NEGOCIOS[0];
export const esNegocioValido = id => NEGOCIOS.some(n => n.id === id);

export function negocioRecordado(){
  try{
    const g = localStorage.getItem(CLAVE_NEGOCIO);
    return esNegocioValido(g) ? g : NEGOCIO_POR_DEFECTO;
  }catch(e){ return NEGOCIO_POR_DEFECTO; }
}

export function recordarNegocio(id){
  try{ localStorage.setItem(CLAVE_NEGOCIO, id); }catch(e){}
}
