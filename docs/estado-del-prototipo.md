# TDC Gestión — estado del prototipo

**Fecha de este registro:** 16 de octubre de 2026
**Alcance:** describe el estado real del código, para no depender del mensaje del commit de publicación.

## Qué hay y qué no hay

El commit de publicación dice "prototipo". El código va bastante más allá:
el flujo de documentos está completo y las reglas de negocio están implementadas,
no solo documentadas.

| Funcionalidad | Estado |
|---|---|
| Clientes: alta y consulta | ✅ |
| Propuestas: conceptos, subtotales y total automático | ✅ |
| Impresión de propuesta en A4 | ✅ |
| Visto bueno: aprobar / rechazar | ✅ |
| Orden generada automáticamente al aprobar | ✅ |
| Sin duplicar orden si se aprueba dos veces | ✅ |
| Orden: diagnóstico, trabajo, motivo de espera | ✅ |
| Transiciones de estado restringidas | ✅ |
| Historial con fecha y estado previo/nuevo | ✅ |
| Cuenta de cobro desde orden terminada | ✅ |
| Búsqueda, filtros y contadores | ✅ |
| Recorrido de ejemplo con datos ficticios | ✅ |

**Fuera de alcance, por decisión propia:** backend, base de datos,
autenticación, sincronización, factura electrónica, inventario y pagos.

## Cómo se implementa en el código

Tres decisiones que sostienen el diseño y conviene conocer antes de modificarlo:

1. **La tabla de transiciones** vive en `orderTransitions()` y devuelve a qué estados
   se puede saltar desde el actual. Agregar un estado nuevo exige tocar esa tabla;
   si no, el estado queda inalcanzable.

2. **La creación de la orden está en `approveProposal()`**, y su primera línea es la
   que evita duplicados:
   ```js
   if (!proposal || !["draft", "sent"].includes(proposal.state)) return;
   ```
   Por eso aprobar dos veces la misma propuesta no crea dos órdenes. Cualquier
   nueva vía de aprobación debe pasar por aquí.

3. **`escapeHtml()` se aplica en toda interpolación** de HTML. Si agregas una vista
   nueva, úsalo también: los datos vienen de formularios del usuario.

## Persistencia

`localStorage`, bajo la clave `tdc.gestion.frontend.v1`, en formato JSON.

Consecuencias que hay que tener presentes:

- Los datos **no se sincronizan** entre dispositivos ni navegadores.
- El usuario puede borrarlos desde el navegador sin aviso.
- **No usar con datos reales de clientes.** Solo datos ficticios.

Para uso real se necesita backend con autenticación y base de datos con respaldo.
Está fuera de esta entrega.

## Cómo probarlo

```bash
cd gestion
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre `http://localhost:8000/gestion/` y usa **Cargar recorrido de ejemplo**
para ver propuesta → aprobación → orden → cuenta de cobro sin datos reales.

Los 12 casos de aceptación están enumerados en la sección 11 de
[`docs/analisis-y-diseno.md`](docs/analisis-y-diseno.md).

## Pendiente de validar con el propietario

Antes de que esto sea el sistema real del negocio hay que confirmar, con el
propietario: numeración y vigencia de los documentos, qué datos de emisor deben
imprimirse, la forma real de registrar el visto bueno, los nombres exactos de los
estados, si hay pagos parciales, y qué conceptos se cobran habitualmente.

Mientras eso no se valide, el prototipo no debe usarse para operar el negocio.

## Licencia y publicación

Material de formación del programa ADSO. La demostración en vivo se publica
desde la rama `gh-pages` y no incluye datos reales.