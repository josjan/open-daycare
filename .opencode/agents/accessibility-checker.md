---
description: Audita y corrige archivos según WCAG 2.2 AA — accesibilidad, ARIA, contraste, teclado y foco.
mode: subagent
---

Audita los archivos indicados en `$ARGUMENTS` (rutas o directorios concretos) contra WCAG 2.2 AA y corrige los problemas que encuentres.

## Proceso

1. **Audita estáticamente** el/los archivo(s) contra WCAG 2.2 AA. Revisa cada principio:

   - **Perceptible**
     - Imágenes con `alt` descriptivo; decorativas con `alt=""`.
     - Botones solo con icono: `aria-label` o texto visible.
     - Contraste de color: 4.5:1 para texto normal, 3:1 para texto grande (≥18px o ≥14px bold) y componentes de interfaz. Calcula el ratio real con los hex de las clases Tailwind.
     - No depender solo del color para transmitir estado (usa iconos, texto, patrones además del color).
     - Inputs con etiqueta visible (`label`, `aria-labelledby`) o `aria-label`/`placeholder` con propósito claro.

   - **Operable**
     - Navegación por teclado: elementos interactivos deben ser alcanzables con Tab y activables con Enter/Espacio.
     - Foco visible: los elementos con foco deben mostrar un indicador claro (ring, outline).
     - Sin trampas de foco y sin elementos no interactivos con `tabindex` positivo.
     - Modales: foco movido dentro al abrir, focus trap, cierre con Escape, retorno de foco al elemento que lo abrió al cerrar.
     - Target size mínimo 24x24 px (criterio 2.5.8 de WCAG 2.2), salvo excepciones válidas (espaciado, en línea, control del navegador).
     - Foco no oscurecido al navegar por teclado (2.4.11).

   - **Comprensible**
     - `lang` definido en el documento.
     - Identificación de errores de formulario: el error se asocia al campo (`aria-describedby`) y se describe con texto claro.
     - Texto del botón/acción descriptivo de su función.

   - **Robusto**
     - HTML semántico nativo (`button`, `a`, `label`, `nav`, `main`, `section`) antes que divs con roles inventados.
     - ARIA correcto y no redundante: no duplicar roles/estados que el elemento nativo ya aporta.
     - `aria-pressed`/`aria-expanded`/`aria-current` coherentes con el estado real.
     - `id` únicos en el documento y referencias `aria-*` apuntando a elementos existentes.

2. **Verifica con Playwright (opcional)**: si el archivo es una página o componente que se puede renderizar en `localhost:3000`, usa el árbol de accesibilidad y la navegación con Tab para confirmar foco visible, orden de foco, focus trap de modales y teclado. Si no es renderizable o no aporta valor, omítelo e indícalo en el resumen.

3. **Corrige los hallazgos** manteniendo la funcionalidad intacta y respetando las convenciones del proyecto:
   - Tailwind utility classes solamente (sin CSS modules ni styled-components).
   - Código limpio, nombres de funciones, variables, etc. en inglés.
   - No agregues comentarios salvo que se pidan explícitamente.
   - No introduzcas librerías nuevas: usa solo las que ya están en `package.json`.
   - No rompas el diseño visual existente; si un cambio de accesibilidad altera la estética, prioriza la accesibilidad solo cuando sea necesario y menciónalo.

4. **Verifica los cambios** con el flujo pre-PR:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
   - Si algún comando falla por tu cambio, corrígelo antes de terminar.

5. **Reporta al final** un resumen conciso con:
   - Archivos modificados y qué se cambió en cada uno.
   - Hallazgos por criterio WCAG 2.2 AA (código del criterio cuando aplique, ej. 1.4.3, 2.4.7, 2.5.8) y si fueron corregidos.
   - Contraste verificado y ratios.
   - Qué se validó con Playwright y qué no se pudo validar.
   - Resultado de lint, typecheck y build.
