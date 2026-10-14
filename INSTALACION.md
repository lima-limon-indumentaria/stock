# Puesta en marcha — Lima Limón

De cero a la aplicación andando. Una hora la primera vez.

---

## Qué vas a tener

Un control de stock, ventas y caja para Lima Limón, que se usa desde la tablet,
el celular o la computadora, con los datos en la nube.

```
negocios/lima/productos/…      el catálogo
negocios/lima/ventas/…         las ventas
negocios/lima/movimientos/…    ingresos y egresos de caja
negocios/lima/pedidos/…        los pedidos al proveedor
negocios/lima/config/general   recargos y preferencias

usuarios/…                     quiénes pueden entrar
```

Los datos cuelgan de `negocios/lima/` aunque haya un solo emprendimiento. Es a
propósito: si más adelante abre un segundo local o una segunda marca, se agrega
sin mover un solo dato de lugar.

---

## 1. Crear el proyecto

En [console.firebase.google.com](https://console.firebase.google.com), **Crear
un proyecto**. Nombre sugerido: `lima-limon-control`.

Creálo **con la cuenta de Gmail del negocio**, no con la tuya, y agregate
después desde *Configuración → Usuarios y permisos*. Si algún día se corta la
relación, la dueña no se queda sin acceso a sus datos y vos no quedás
administrando un proyecto ajeno para siempre.

Google Analytics no hace falta.

---

## 2. Habilitar el ingreso

*Compilación → Authentication → Comenzar → Correo electrónico/contraseña →
Habilitar*. Nada más.

> La persona escribe un nombre y un PIN de cuatro números. Por debajo eso se
> convierte en `nombre@usuarios.lima-limon.local` contra Firebase. Ese
> dominio no existe ni recibe mail; Firebase solo pide que el formato sea
> válido.

---

## 3. Crear la base

*Compilación → Firestore Database → Crear base de datos*.

Región `southamerica-east1` si el local está en Argentina, por latencia.
**No se puede cambiar después.**

Empezá en **modo de producción**, que deja todo cerrado. Las reglas van en el
paso 6.

---

## 4. Conectar la aplicación

*Configuración del proyecto → Tus apps → Web (`</>`)*. Registrá la app y copiá
el objeto `firebaseConfig`.

Lo que da la consola es **JavaScript**, no JSON. Para no convertirlo a mano:

```bash
node herramientas/firebase-config.mjs
```

Pegás el fragmento tal cual y listo: la herramienta corta sola al reconocer el
objeto completo, sin ninguna combinación de teclas. Queda escrito
`datos/firebase.json`.

Si preferís, guardá el fragmento en un `.txt` y pasalo como argumento:
`node herramientas/firebase-config.mjs pegado.txt`
Para revisar uno que ya exista:

```bash
node herramientas/firebase-config.mjs --verificar
```

> **Ese archivo tiene que quedar publicado con el sitio.** La aplicación lo pide
> con `fetch`: si lo agregás al `.gitignore` nunca llega y la app cae al modo
> prototipo. No es secreto; las credenciales viajan igual en el navegador.

Si algo falla, la pantalla `#usuarios` dice exactamente qué: archivo ausente,
JSON inválido, credenciales incompletas o SDK inalcanzable, con la dirección
que pidió y lo que recibió.

---

## 5. Crear el primer usuario

Es el único que se hace a mano, porque hasta que exista no hay quién cree a los
demás.

**a)** En *Authentication → Users → Agregar usuario*:

- Correo: `lima@usuarios.lima-limon.local`
- Contraseña: el PIN seguido de `::stock::`. Para el PIN `1234`, va
  `1234::stock::`

Copiá el **UID** que queda en la lista.

**b)** En *Firestore → Iniciar colección*, colección `usuarios`, ID del
documento **ese UID**, con estos campos:

| Campo | Tipo | Valor |
|---|---|---|
| `usuario` | string | `lima` |
| `nombre` | string | el nombre de la dueña |
| `rol` | string | `admin` |

Tres formas de equivocarse acá, y desde afuera se ven todas iguales:

- El **ID del documento** tiene que ser el UID, no el nombre. Copialo, no lo
  tipees.
- La colección se llama `usuarios`, en minúscula.
- El campo es `rol`, sin acento, y el valor `admin`, sin espacios.

Si algo falla, `#usuarios` te dice cuál de las tres es y te muestra el UID
listo para copiar.

> Con un solo emprendimiento no hace falta el campo `negocios`: todos los
> usuarios entran a Lima Limón. Ese campo recién importa si algún día hay más
> de uno.

### Las vendedoras

Se crean desde la aplicación, con sesión de administrador, agregando
`#usuarios` al final de la dirección. Un **vendedor** usa el sistema; un
**administrador** además entra a esa pantalla y crea usuarios.

---

## 6. Publicar las reglas

**Esto es lo que protege los datos.** Sin este paso la base queda abierta a
cualquiera que encuentre el ID del proyecto.

```bash
npm install -g firebase-tools
firebase login
firebase init firestore      # elegí el proyecto; dejá firestore.rules
firebase deploy --only firestore:rules
```

O pegando el contenido de `firestore.rules` en *Firestore → Reglas → Publicar*.

**Comprobalo:** abrí una ventana de incógnito sin iniciar sesión y, desde la
consola del navegador, intentá leer una colección. Tiene que fallar con
`permission-denied`.

---

## 7. Publicar la aplicación

```bash
firebase init hosting        # carpeta pública: . (la raíz del proyecto)
firebase deploy --only hosting
```

Cuando pregunte si es una aplicación de una sola página, **respondé que no**.
Si respondés que sí, el servidor devuelve `index.html` para cualquier ruta que
no encuentre, incluido `datos/firebase.json`, y la aplicación recibe una página
HTML donde esperaba sus credenciales.

También sirve GitHub Pages. En cualquiera de los dos, la dirección queda en
https, que hace falta para que el ingreso funcione bien.

---

## 8. App Check

*Compilación → App Check → reCAPTCHA v3*. Bloquea las llamadas a tu proyecto
que no vengan de tu aplicación.

Importa acá más que en otros lados: un PIN de cuatro dígitos son **10.000
combinaciones**, y sin App Check se pueden probar todas contra la API desde
cualquier lado. Si el negocio maneja plata seria, subí `LARGO_PIN` a 6 en
`js/config.js`: pasa a un millón.

---

## 9. Antes de entregar

En `js/config.js`:

```javascript
export const MODO_ESTRICTO = true;
```

Con esto, si Firebase no responde la aplicación no deja entrar y dice por qué.
En `false` caería sola al modo prototipo: validaría contra un archivo público y
guardaría en el navegador. La persona vería un sistema que aparentemente anda,
cargando ventas en un lugar que no es la base del negocio.

Y que pase todo:

```bash
npm install --no-save jsdom
npm run prueba
```

---

## Cargar el stock inicial

**Productos → Importar**, y pegar las filas desde Excel.

La primera fila define las columnas. `nombre` y `costo` son obligatorias;
`categoria` y `margen`, opcionales. **Cualquier otra columna se toma como un
talle.**

| Columna | Qué es |
|---|---|
| `nombre` | Nombre del producto |
| `costo` | Precio de costo por unidad |
| `precio` | Precio de venta en efectivo |
| `categoria` | Rubro |
| `margen` | Porcentaje de ganancia |
| `minimo` | Cuándo avisar que se está por terminar |
| `reponer` | Hasta cuántas unidades sugerir al pedir |
| `precio credito`, `precio debito`, `precio transferencia`, `precio mercadopago` | Precio propio para esa forma de cobro |

```
nombre	categoria	costo	margen	minimo	precio credito	1	2	3	4
Media 3/4 lisa	Medias	3200	120	4	8500	12	10	8	5
Conjunto encaje	Lencería	9800	110	2		4	6	4	2
```

Después, en **Ajustes → Recargo por forma de cobro**, cargar cuánto más cuesta
pagar con cada medio. El mínimo de stock y la cantidad a reponer se cargan en
cada producto, desde su ficha. El precio del producto es el de efectivo; el resto sale
de ahí.

---

## Qué revisar al final

- [ ] Reglas publicadas y verificadas con `permission-denied`
- [ ] `datos/firebase.json` accesible en `tu-sitio/datos/firebase.json`
- [ ] Se entra con el usuario y el PIN, y va directo al sistema
- [ ] Los recargos por forma de cobro cargados
- [ ] `MODO_ESTRICTO` en `true`
- [ ] App Check activado
- [ ] Un respaldo descargado
