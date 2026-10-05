# TDC Gestión: análisis y diseño

**Versión:** 0.2  
**Estado:** prototipo frontend funcional para demostración con datos ficticios  
**Tecnologías de la entrega:** HTML, CSS y JavaScript vanilla

## 1. Resumen

Tienda Digital Colombia presta servicios de soporte y mantenimiento tecnológico, redes, repuestos, capacitación y soluciones web en Lorica, Córdoba. El propietario cuenta con más de 15 años de experiencia. Su proceso actual es manual: prepara una propuesta económica impresa, espera el visto bueno del cliente, realiza el trabajo y entrega una cuenta de cobro.

Se propone **TDC Gestión**, una aplicación web para practicar y demostrar competencias de análisis, diseño, programación y pruebas con HTML, CSS y JavaScript. El prototipo organiza ese ciclo y conserva registros de demostración en el navegador.

La necesidad operativa proviene directamente del propietario. La propuesta no afirma que el negocio ni sus clientes hayan sido validados mediante un estudio de mercado.

## 2. Emprendimiento

**Unidad de negocio:** prestación de servicios tecnológicos locales para hogares, pequeños negocios e instituciones: mantenimiento, soporte técnico, redes, repuestos, capacitación y soluciones web.

**Necesidad:** llevar control e historial de las propuestas presentadas, los trabajos aprobados, su ejecución y las cuentas de cobro entregadas.

**Propuesta de valor:** combinar la experiencia del propietario con un proceso ordenado y trazable desde la propuesta hasta el cobro.

**Usuario principal:** propietario de Tienda Digital Colombia. El cliente es receptor de documentos y servicios; no tendrá acceso al prototipo.

## 3. Referentes del mercado

No hay un único estándar universal que imponga el mismo flujo a todos los sistemas. Se adoptan conceptos comunes observados en soluciones de servicios como [Odoo Field Service](https://www.odoo.com/documentation/18.0/applications/services/field_service.html), [Odoo Repair Orders](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/repairs/repair_orders.html) y [Jobber Field Service Management](https://getjobber.com/features/field-service-management-software/): cliente, propuesta, aprobación, orden de trabajo, estados, historial y documento de cobro.

El alcance se mantiene pequeño. Facturación electrónica, contabilidad, pagos en línea, inventario, portal del cliente, aplicación móvil, rutas y cuadrillas quedan fuera de esta entrega.

## 4. Flujo del negocio

```text
Cliente
  -> Propuesta económica (borrador -> enviada)
  -> Visto bueno (aprobada -> crea una orden de servicio)
     o Rechazada (no crea una orden)
  -> Trabajo (pendiente -> en proceso <-> en espera -> terminado)
  -> Cuenta de cobro imprimible
  -> Entrega / cierre
```

Una propuesta aprobada puede crear como máximo una orden. “En espera” exige un motivo. El visto bueno de este prototipo se registra cuando el propietario confirma que lo recibió; no es firma electrónica ni prueba documental de aprobación del cliente.

## 5. Alcance funcional del prototipo

- Crear y consultar clientes.
- Crear propuestas con tipo de servicio, alcance, conceptos, cantidades, precio unitario, vigencia y condiciones.
- Calcular subtotales y total automáticamente.
- Imprimir una propuesta para presentarla.
- Registrar que fue enviada, aprobada o rechazada.
- Crear automáticamente una orden al registrar una aprobación, sin duplicarla.
- Avanzar la orden, registrar diagnóstico y trabajo realizado, y dejar motivo cuando esté en espera.
- Consultar órdenes e historial por cliente, número, estado y fecha.
- Generar e imprimir una cuenta de cobro desde una orden terminada.
- Marcar manualmente la cuenta como pagada, si se usa ese control; no se procesa dinero.
- Consultar conteos y actividad reciente en el panel.
- Cargar un recorrido con datos ficticios para la demostración.

**Documento de cobro:** la cuenta imprimible sirve para control y presentación. No es factura electrónica, no certifica cumplimiento tributario y no reemplaza asesoría contable.

## 6. Estados

**Propuesta:** Borrador → Enviada → Aprobada o Rechazada. La aprobación genera una orden.

**Orden:** Pendiente → En proceso ↔ En espera → Terminado → Entregado/cerrado. Se puede cancelar antes de terminar; las transiciones se restringen para evitar estados imposibles.

**Cuenta de cobro:** Emitida → Pagada (registro manual opcional).

## 7. Requisitos

1. El propietario puede crear y consultar clientes con nombre y un medio de contacto.
2. El propietario puede registrar una propuesta con uno o más conceptos económicos.
3. El total corresponde a la suma de cantidad por precio de cada concepto.
4. La propuesta se puede imprimir y marcar enviada, aprobada o rechazada.
5. Una propuesta aprobada genera una sola orden relacionada con el cliente y la propuesta.
6. La orden permite guardar estado, diagnóstico, ejecución y motivo de espera.
7. Los cambios de estado se conservan en un historial con fecha.
8. Una orden terminada permite generar una cuenta de cobro imprimible.
9. Las listas se pueden buscar y filtrar por sus campos principales.
10. Los registros de demostración persisten al recargar el mismo navegador.

## 8. Modelo de datos lógico

| Entidad | Campos representativos | Relación |
|---|---|---|
| Cliente | id, nombre, organización, teléfono, correo, dirección | Tiene propuestas y órdenes. |
| Propuesta | id, número PE, cliente, servicio, alcance, fecha, vigencia, estado, condiciones | Incluye conceptos; puede producir una orden. |
| Concepto de propuesta | descripción, cantidad, precio unitario | Pertenece a una propuesta; el subtotal se calcula. |
| Orden de servicio | id, número OS, propuesta, cliente, estado, diagnóstico, trabajo realizado, motivo de espera, fechas | Proviene de una propuesta aprobada; tiene historial. |
| Historial de orden | estado anterior/nuevo, nota, fecha | Pertenece a una orden. |
| Cuenta de cobro | id, número CC, orden, fecha, estado de pago manual | Se produce desde una orden terminada. |

La demostración almacena estas colecciones como datos JSON bajo una única clave de `localStorage`. No es una base de datos relacional ni ofrece transacciones o sincronización.

## 9. Pantallas

- **Resumen:** indicadores del flujo, actividad reciente y accesos rápidos.
- **Propuestas:** listado, búsqueda, filtro, creación, detalle, impresión y decisión de aprobación.
- **Órdenes:** listado y detalle con estado, diagnóstico, trabajo realizado e historial.
- **Cuentas de cobro:** relación con la orden, estado manual e impresión.
- **Clientes:** contacto básico e historial de documentos relacionados.
- **Datos de emisión:** nombre comercial y datos que se imprimen en los documentos.

Las propuestas y cuentas se muestran en una vista previa integrada, con formato A4. El usuario puede imprimir en papel o elegir “Guardar como PDF” en el diálogo del navegador.

## 10. Arquitectura y límites

- **HTML:** estructura semántica del panel, formularios, navegación y diálogos.
- **CSS:** diseño adaptable, estados visuales y estilos de impresión.
- **JavaScript:** navegación, eventos, validación, cálculos, transiciones, historial, búsquedas e impresión.
- **Persistencia:** `localStorage` en el navegador actual.

La aplicación puede abrirse desde un servidor estático de Python enlazado solo a `127.0.0.1`, pero la lógica y los datos siguen siendo frontend. `localStorage` no autentica, no cifra ni sincroniza datos; el usuario puede borrarlo. **Usar solo datos ficticios para la instructora. No cargar datos personales ni usar esta versión como sistema real del negocio.**

Para uso real en varios dispositivos se necesitaría, en otra fase, un backend seguro con autenticación y una base de datos con respaldo. Esa infraestructura no forma parte de la entrega HTML/CSS/JS.

## 11. Pruebas de aceptación

- Crear cliente y conservarlo después de recargar.
- Crear propuesta con dos conceptos y comprobar los subtotales y el total.
- Imprimir la propuesta y verificar datos, condiciones y formato.
- Marcar una propuesta como rechazada y comprobar que no crea orden.
- Aprobar una propuesta y comprobar que crea exactamente una orden relacionada.
- Intentar aprobarla por segunda vez y comprobar que no duplica la orden.
- Avanzar una orden y revisar que el historial conserve fecha y estado previo/nuevo.
- Intentar poner una orden en espera sin motivo y comprobar que se valida.
- Terminar una orden, generar su cuenta de cobro e imprimirla.
- Confirmar que las búsquedas, filtros y conteos se actualizan.
- Usar el panel en móvil y escritorio; revisar que los datos no se desborden.
- Restablecer la demo y confirmar que se eliminan los registros locales.

## 12. Alineación con ADSO

1. **Análisis:** necesidad real, actores, proceso, alcance y requisitos.
2. **Diseño:** flujo, modelo lógico, pantallas y criterios de aceptación.
3. **Construcción:** separación de HTML, CSS y JavaScript; formularios y persistencia local.
4. **Pruebas:** ejecutar los casos de aceptación y documentar resultados y correcciones.
5. **Implementación:** demostración en navegador, guía de uso y limitaciones.
6. **Emprendimiento:** unidad de negocio, clientes, propuesta de valor, costos, precios y canales.

Los nombres exactos de competencias y evidencias deben revisarse con la instructora y la guía vigente de la ficha ADSO.

## 13. Pendiente de validar con el propietario

- Numeración y vigencia predeterminada de los documentos.
- Datos de emisor y cliente que deben aparecer en propuesta y cuenta.
- Términos y forma de registrar el visto bueno que hoy recibe.
- Nombres exactos de los estados usados en la práctica.
- Si conviene reflejar pagos parciales o solo marcar pagada la cuenta completa.
- Qué conceptos se cobran habitualmente: mano de obra, repuestos, visitas u otros.

El prototipo usa valores iniciales editables y datos ficticios; no supone que estas decisiones estén aprobadas o que sus documentos cumplan requisitos legales.