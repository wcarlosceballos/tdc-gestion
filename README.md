# Tienda Digital Colombia

Sitio inicial y propuesta de proyecto de emprendimiento para Tienda Digital Colombia, un negocio de soporte técnico y soluciones tecnológicas con atención en Lorica, Córdoba. La propuesta combina la unidad de negocio con el desarrollo gradual de un producto de software como proyecto formativo ADSO.

## Documentos

- [Análisis y diseño](docs/analisis-y-diseno.md) — alcance, requisitos, flujo de documentos, modelo de datos, pantallas y límites de la demo.
- [Estado del prototipo](docs/estado-del-prototipo.md) — qué está implementado, cómo está construido el código y qué falta validar con el propietario.
- [Plan: llevar a un sistema real](docs/plan-sistema-real.md) — qué falta para operar el negocio, las tres rutas con costos reales, y los límites legales y tributarios en Colombia.

## Demostración en vivo

**https://wcarlosceballos.github.io/tdc-V01/gestion/**

Se publica desde la rama `gh-pages`, sin datos reales.

## Propuesta de emprendimiento

**Unidad de negocio:** prestación de servicios de mantenimiento y soporte, redes, repuestos, capacitación tecnológica y soluciones web para hogares, negocios e instituciones.

**Producto de software propuesto:** TDC Gestión, una aplicación web privada para gestionar clientes, propuestas económicas, aprobaciones, órdenes de servicio y cuentas de cobro.

**Necesidad identificada por el propietario:** digitalizar el proceso que hoy realiza manualmente: presentar una propuesta económica impresa, esperar el visto bueno, realizar el trabajo y presentar una cuenta de cobro, conservando el control y el historial de cada etapa.

**Propuesta de valor:** combinar más de 15 años de experiencia prestando servicios tecnológicos con un proceso organizado desde la propuesta económica hasta la cuenta de cobro.

**Clientes potenciales:** hogares, pequeños negocios, instituciones educativas y personas que necesiten soporte o capacitación en Lorica y zonas cercanas. Estos segmentos también deben validarse.

## Alineación funcional con soluciones del mercado

No existe un único estándar universal que obligue a usar exactamente el mismo flujo o los mismos nombres. TDC Gestión tomará como referencia conceptos habituales en software de gestión de servicios y reparaciones: cliente, equipo o activo cuando aplique, orden de servicio, programación, seguimiento del trabajo, notas e historial. La interfaz y el alcance se mantendrán sencillos para un propietario que inicialmente administra sus propios trabajos.

**Modelo de información propuesto:**

- **Cliente:** identificador, nombre o razón social y al menos un medio de contacto. Correo, dirección y notas son opcionales.
- **Equipo o activo:** cliente propietario, tipo de equipo, marca y modelo; número de serie y observaciones son opcionales. No se crea un equipo para servicios que no lo requieran.
- **Propuesta económica (PE):** identificador, cliente, vigencia, términos y conceptos con cantidad y precio unitario. El sistema calcula subtotales y total.
- **Orden de servicio (OS):** nace de una propuesta aprobada; registra el trabajo autorizado, estado, diagnóstico, ejecución y notas.
- **Cuenta de cobro (CC):** se genera al terminar el trabajo y queda vinculada a la orden para imprimir y presentar al cliente.
- **Historial:** fechas y cambios de estado de la propuesta y la orden para conservar el recorrido de cada trabajo.

**Flujo principal:** Cliente → propuesta en borrador → enviada → aprobada → orden pendiente → en proceso/en espera → terminada → cuenta de cobro emitida → entregada/cerrada. Una propuesta rechazada no crea orden. “En espera” requiere motivo.

**Reglas iniciales:** cada documento tiene un identificador; la aprobación de una propuesta es requisito para generar su orden; una propuesta genera máximo una orden; la cuenta de cobro se genera desde una orden terminada. La cuenta imprimible no reemplaza factura electrónica ni asesoría contable.

Como referentes de patrones funcionales se consultaron la documentación de [Odoo Field Service](https://www.odoo.com/documentation/18.0/applications/services/field_service.html), [Odoo Repair Orders](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/repairs/repair_orders.html) y las funciones de [Jobber Field Service Management](https://getjobber.com/features/field-service-management-software/). Son referencias de producto, no una certificación ni una obligación de copiar sus funciones.

Facturación electrónica, pagos en línea, asignación de cuadrillas, rutas e inventario completo son módulos que varios productos del mercado ofrecen, pero quedan fuera del MVP hasta que la operación los necesite.

### Levantamiento del proceso del propietario

Antes de diseñar la aplicación, describir cómo se lleva hoy un servicio y qué información necesitas consultar. Puedes responder estas preguntas tomando como referencia servicios recientes:

1. ¿Cómo registras hoy cada servicio y dónde guardas esa información?
2. ¿Qué datos necesitas recordar de cada cliente, equipo y trabajo realizado?
3. ¿Qué estados atraviesa normalmente un servicio, desde que lo recibes hasta que lo terminas o entregas?
4. ¿Cómo registras fechas, materiales utilizados, valor cobrado o pagos pendientes, si aplica?
5. ¿Qué consultas necesitas hacer con frecuencia, por ejemplo servicios pendientes, historial de un cliente o trabajos de un periodo?
6. ¿Qué información no debería faltar al cerrar un servicio?
7. ¿Usarás el sistema solo tú al inicio o también otras personas del negocio?

Anota las respuestas usando uno o dos servicios recientes como ejemplo. Separa los datos obligatorios de los opcionales; así el primer diseño representará tu operación real y no añadirá funciones innecesarias.

## Objetivo del proyecto ADSO

Diseñar, desarrollar y probar una aplicación web privada que permita al propietario registrar servicios prestados, mantener los datos necesarios de sus clientes, actualizar el estado de cada trabajo y consultar el historial para apoyar la operación de Tienda Digital Colombia.

## Alcance inicial (MVP)

- Registro privado de clientes.
- Creación de propuestas económicas con conceptos, cantidades, precios, total calculado y vista imprimible.
- Registro del visto bueno o rechazo de una propuesta.
- Conversión de una propuesta aprobada en orden de servicio, sin duplicados.
- Seguimiento de estado, diagnóstico y trabajo realizado.
- Generación e impresión de cuenta de cobro asociada a una orden terminada.
- Historial consultable por cliente y filtros por documento, estado y fecha.
- Guardado local de datos ficticios en el navegador para practicar y demostrar el flujo; no incluye autenticación real.

**Fuera del alcance inicial:** factura electrónica, contabilidad, pagos en línea, inventario, portal de clientes, aplicación móvil, inteligencia artificial y automatizaciones complejas. La cuenta imprimible es para control y presentación, no acredita cumplimiento tributario.

## Historias de usuario iniciales

- Como propietario, quiero preparar una propuesta con conceptos y total calculado para entregarla al cliente.
- Como propietario, quiero registrar si la propuesta fue aprobada o rechazada para controlar el visto bueno.
- Como propietario, quiero convertir una propuesta aprobada en una orden para realizar el trabajo autorizado.
- Como propietario, quiero registrar el trabajo realizado y generar una cuenta de cobro imprimible al terminar.
- Como propietario, quiero consultar por cliente el historial de propuestas, órdenes y cuentas para dar seguimiento a mi operación.

Estas historias son una base de trabajo. Se deben ajustar con las respuestas del levantamiento del proceso del propietario y acordar sus criterios de aceptación antes del desarrollo.

**Criterios de aceptación iniciales:**

- El total de la propuesta coincide con la suma de cantidad por precio unitario de sus conceptos.
- Imprimir una propuesta muestra cliente, alcance, conceptos, total y condiciones.
- Aprobar una propuesta crea una sola orden; rechazarla no crea una orden.
- Los cambios de estado de la orden quedan en el historial y `En espera` exige un motivo.
- Una orden terminada permite emitir e imprimir una cuenta de cobro vinculada.
- Al recargar la página en el mismo navegador se conservan los datos ficticios de demostración.
- El panel se puede usar en escritorio y móvil y advierte que `localStorage` no sirve para datos personales reales.

Estos criterios son propuestas para el MVP y deben revisarse con el negocio y el instructor antes de implementarse.

## Etapas y evidencias ADSO

1. **Análisis:** descripción del proceso de prestación de servicios, necesidades del propietario, requisitos y reglas de negocio.
2. **Diseño:** historias de usuario, criterios de aceptación, casos de uso, modelo de datos, arquitectura y prototipos de interfaz.
3. **Desarrollo:** aplicación funcional, persistencia de datos y control de acceso.
4. **Pruebas:** casos y resultados de prueba, corrección de defectos y evaluación con usuarios.
5. **Implementación y mantenimiento:** despliegue, manual de usuario, documentación técnica, respaldos y propuesta de mantenimiento.
6. **Viabilidad del negocio:** modelo Canvas, segmentos, canales, estructura de costos, precios y métricas comerciales.



## Indicadores operativos iniciales

- Servicios pendientes, en curso y terminados.
- Servicios registrados por periodo y por tipo.
- Historial de servicios por cliente.
- Tiempo transcurrido entre el registro y el cierre, si se registran ambas fechas.

Estos indicadores son una propuesta inicial; se conservarán solo los que te ayuden a tomar decisiones en el negocio.

## Tecnologías y estado actual

- HTML5
- CSS3
- JavaScript vanilla

La página comercial actual sigue siendo estática y deriva contactos a WhatsApp. El panel de demostración está en `gestion/` y se implementa únicamente con HTML, CSS y JavaScript vanilla; persiste en `localStorage` del navegador. No tiene backend, base de datos, autenticación ni sincronización.

## Ejecutar localmente

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

3. Visita `http://localhost:8000` para la página comercial o `http://localhost:8000/gestion/` para el panel de demostración.

En el panel puedes elegir **Cargar recorrido de ejemplo** para revisar propuesta, aprobación, orden y cuenta de cobro sin usar datos reales. El botón Datos de emisión permite editar lo que aparece en los documentos. Las propuestas y cuentas se pueden imprimir o guardar como PDF desde el navegador.

El enlace **Panel demo** del menú de la página principal abre la aplicación en `/gestion/`. Es solo una ruta de acceso local; no proporciona autenticación.

## Privacidad y publicación

El panel de demostración utiliza `localStorage`, que no protege ni respalda los datos. Usa únicamente datos ficticios: no ingreses información real de clientes ni uses esta versión para operar el negocio. Para producción se necesitaría backend autenticado, base de datos segura, respaldos y revisión de las obligaciones aplicables en Colombia.

Antes de publicar, verificar que el número comercial configurado en `js/app.js`, el horario, la cobertura, las cifras y los testimonios sean correctos y estén autorizados. Mantener los datos de contacto consistentes entre el sitio y los canales comerciales.

## Mejoras posteriores

- Completar el sistema privado de clientes y control de servicios, prioridad funcional del proyecto ADSO.
- Conectar el formulario público a la aplicación si resulta útil para el flujo real de recepción.
- Añadir seguimiento de materiales, pagos o reportes si el levantamiento confirma que son necesarios.
- Crear páginas detalladas para cada servicio y un catálogo de productos si la validación lo justifica.
- Incorporar fotografías propias y completar la identidad visual.
- Configurar perfil de Google Business y SEO local.
- Añadir analítica respetando la privacidad de los visitantes.
- Evaluar inventario, pagos u otras funciones según la demanda observada.
