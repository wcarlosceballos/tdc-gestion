# Plan: llevar TDC Gestión a un sistema real

**Fecha:** 16 de octubre de 2026
**Propósito:** decidir con números qué hace falta para que este prototipo deje de ser
una demostración y pueda sostener el negocio.

---

## 1. El punto de partida honesto

El prototipo está **completo como entregable de formación**: modelo de datos, flujo de
documentos, reglas de negocio, impresión y persistencia. La parte difícil ya está hecha.

Lo que no tiene es infraestructura. Y aquí conviene ser claro sobre una cosa antes de
invertir meses:

> **Ningún sistema de gestión reemplaza la factura electrónica.**

La "cuenta de cobro" que imprime la aplicación **no es una factura** y el propio
documento lo advierte. Si el negocio supera el umbral de la DIAN, seguirás necesitando
una factura electrónica válida, venga del sistema que venga.

---

## 2. Los tres umbrales que deciden todo

No son detalles técnicos. Son los que definen si conviene construir o contratar.

### 2.1 Facturación electrónica (DIAN)

- La UVT 2026 quedó en **COP 52.374**.
- Para personas naturales, el umbral de referencia es **3.500 UVT ≈ COP 183 millones
  anuales**. También aplica si eres responsable de IVA, aunque no llegues a ese monto.
- **La DIAN tiene un servicio gratuito** de facturación electrónica para micro y pequeñas
  empresas: <https://facturaciongratuita.dian.gov.co>
- Alternativas comerciales como Alegra tienen plan gratuito y planes desde ~COP 150.000/año.

**Conclusión:** no escribas un módulo de facturación. Usa el de la DIAN o el de un
proveedor. Es obligatorio, regulado y caro de hacer bien.

> Verifica tu situación fiscal concreta con un contador. Lo anterior es orientación
> general, no asesoría tributaria.

### 2.2 Protección de datos personales (Ley 1581 de 2012)

Aplica a **cualquier entidad privada** que trate datos personales. Un negocio con clientes
es exactamente eso.

Obligaciones que te alcanzan:

| Obligación | Qué implica |
|---|---|
| **Consentimiento** | El cliente debe autorizar el tratamiento de sus datos, previo, libre e informado. |
| **Aviso de privacidad** | Debes informar qué datos guardas, para qué y cómo se protegen. |
| **Principio de necesidad** | Solo puedes guardar lo estrictamente necesario. Nada de datos "por si acaso". |
| **Derechos del titular** | El cliente puede pedir que le muestres, corrijas o elimines sus datos. |
| **Registro Nacional de Bases de Datos** | Lo administra la SIC. |
| **Transferencia internacional** | El artículo 26 prohíbe transferir datos a países sin nivel adecuado de protección. |

**El punto que casi nadie menciona:** si usas Supabase, Firebase o AWS, **los datos
de tus clientes salen de Colombia**. Eso es una transferencia internacional y tiene
implicaciones bajo el artículo 26. Un servidor en Colombia evita esa discusión entera.

> Consulta con un abogado o con la SIC sobre si tu caso exige registro en el RNBD y
> qué documentos necesitas. El umbral exacto de obligación debe confirmarse.

### 2.3 El tamaño del negocio

Esto es lo que decide si construir tiene sentido. Para un negocio unipersonal con un
volumen bajo de operaciones, **el tiempo que toma mantener un sistema propio puede costar
más que contratarlo**.

---

## 3. Las tres rutas, con números reales

TRM de referencia del 16 de octubre de 2026: **≈ COP 3.175 por dólar**.

### Ruta A — Contratar (no construir)

| | |
|---|---|
| **Qué** | Alegra, Wave, u otro software de gestión con facturación electrónica DIAN |
| **Costo** | desde gratis / ~COP 150.000 al año |
| **Tiempo** | días |
| **Riesgos** | Dependencia del proveedor; no aprendes a construir |
| **Legal** | Los proveedores locales suelen resolver datos y facturación |

**Es la ruta correcta si la prioridad es operar el negocio.**

### Ruta B — Supabase (Supabase Pro)

| | |
|---|---|
| **Qué** | Postgres + autenticación gestionados. El frontend sigue siendo tu HTML/JS |
| **Costo** | USD 25/mes ≈ **COP 79.000/mes** |
| **Tiempo** | 4–8 semanas |

**Ventajas:** no operas servidor, aprendes SQL y políticas RLS, la ruta más corta.

**Inconvenientes:**
- **El plan gratuito pausa el proyecto a los 7 días de inactividad.** No sirve para producción.
- El plan Pro **no incluye copias de seguridad automáticas en los primeros niveles** que necesitas para un negocio; los backups diarios se activan según el plan y la retención.
- El crédito de cómputo incluido ($10) **solo cubre una instancia Micro**. Si el proyecto crece, el costo sube.
- **Los datos salen de Colombia** → artículo 26.
- Tarjeta en el extranjero, cobro en USD.

### Ruta C — VPS en Colombia (recomendada si vas a construir)

| | |
|---|---|
| **Qué** | Servidor propio en Colombia con Postgres y una API ligera |
| **Costo** | desde **COP 41.930** el primer mes, **COP 59.900** la renovación (2 vCPU, 3 GB, 60 GB SSD) |
| **Tiempo** | 8–12 semanas |

Referencia de precio: Conexcol, datacenter en Colombia. Plan de 3 vCPU / 4 GB / 100 GB:
COP 83.930 primer mes, COP 119.900 renovación.

**Ventajas:**
- **Los datos no salen de Colombia.** Se evita el artículo 26.
- Pagas en pesos, con factura DIAN, sin tarjeta extranjera.
- Sin dependencia de proveedor: te puedes mudar cuando quieras.
- Control real de las copias de seguridad.
- **Es el mejor ejercicio posible de ADSO**: base de datos, API, autenticación, despliegue.

**Inconvenientes:** tú te encargas de las actualizaciones, el monitoreo y los respaldos.
Un error de configuración puede dejar la aplicación caída.

---

## 4. Recomendación

**Separa las dos cosas, porque las respuestas son diferentes:**

### Para la SENA → el prototipo ya está listo

No cambies nada. Entrega el prototipo con `docs/analisis-y-diseno.md` y
`docs/estado-del-prototipo.md`, que ya documentan el alcance y los límites. Es un
entregable completo y honesto.

### Para el negocio → construye solo si el volumen lo justifica

Si decides construir, **la Ruta C es la mejor opción** por tres razones concretas:
los datos quedan en Colombia, el costo es menor que Supabase Pro en pesos, y el
aprendizaje es mucho mayor.

**Pero antes de escribir código, responde esto:**

1. ¿Cuántos clientes y cuántos servicios al mes maneja hoy el negocio?
2. ¿Cuánto tiempo al día dedicas al control de Propuestas y órdenes?
3. ¿Qué parte del trabajo actual es la que más molesta? (¿Perderse seguimientos? ¿No saber qué se facturó?)
4. ¿Cuánto estás dispuesto a invertir al mes?

Si la respuesta a la 4 es cero, la **Ruta A** gana sin discusión.

---

## 5. Si eliges construir, el orden de las fases

Cada fase deja el sistema usable. **No empieces por el backend.**

### Fase 1 — Seguridad y datos reales en el servidor (1–2 semanas)
- Levantar el VPS, PostgreSQL, usuario de aplicación
- Script de **respaldo automático diario** y prueba de restauración
- **Aviso de privacidad** y consentimiento de clientes

> Esta fase es la más urgente. Sin respaldos probados, cualquier sistema es un riesgo.

### Fase 2 — Migración de los datos (1 semana)
- Tablas reales según el modelo de datos que ya definiste
- Script que migra lo que está hoy en `localStorage`
- El prototipo pasa a ser solo una fuente de datos de arranque

### Fase 3 — Autenticación (1 semana)
- Inicio de sesión, contraseñas con hash
- **Un solo usuario**: no construyas multiusuario todavía
- Sesiones y cierre seguro

### Fase 4 — La API (2–3 semanas)
- Endpoints para clientes, propuestas, órdenes y cuentas
- **Reutiliza la lógica de negocio que ya tienes.** No la reescribas
- Los documentos imprimibles siguen igual

### Fase 5 — Facturación (fuera de tu alcance)
- Integración con el proveedor de factura electrónica que elijas
- Esto es un proyecto aparte. No lo mezcles con las fases anteriores

---

## 6. Lo que no debes hacer

- ❌ **No guardes datos reales de clientes en `localStorage`.** No hay respaldo ni cifrado.
- ❌ **No construyas facturación electrónica.** Usa la DIAN o un proveedor.
- ❌ **No construyas multiusuario** hasta que haya una segunda persona real usándolo.
- ❌ **No migres al plan Pro de Supabase** pensando que resuelve el problema: pausa por
  inactividad, backups limitados y datos fuera del país.
- ❌ **No publiques datos de prueba con nombres reales** en ninguna demo.
- ❌ **No confíes en un respaldo que nunca has restaurado.** Un respaldo sin
  prueba de restauración no es un respaldo.

---

## 7. Resumen en una línea

| Pregunta | Respuesta |
|---|---|
| ¿El prototipo está listo? | Sí, como entregable de formación. |
| ¿Sirve para operar el negocio hoy? | No. Falta servidor, respaldo y autenticación. |
| ¿Construyo o contrato? | Depende de cuántos clientes tengas y de lo que estés dispuesto a invertir al mes. |
| Si construyo, ¿qué ruta? | VPS en Colombia (Ruta C). |
| ¿Construyo facturación? | No. Usa la DIAN. |

---

**Las cifras de precios y el TRM se consultaron el 16 de octubre de 2026 y cambian.**
Los apartados 2.1 y 2.2 son orientación general, no asesoría legal ni tributaria:
confírmalos con un contador y con la SIC antes de operar con datos reales.