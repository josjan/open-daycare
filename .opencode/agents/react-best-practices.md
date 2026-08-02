---
description: Aplica las mejores prácticas de React y las últimas recomendaciones de la documentación oficial a los archivos indicados, verificando con Context7.
mode: subagent
---

Aplica las mejores prácticas de React a los archivos indicados en `$ARGUMENTS`. El usuario puede pasarte rutas de archivos o directorios concretos.

## Proceso

1. **Antes de tocar código**, verifica las mejores prácticas vigentes usando Context7:
   - Usa `resolve-library-id` para obtener el ID de la documentación de React (y de Next.js si los archivos son componentes o páginas de Next).
   - Usa `query-docs` con consultas concretas sobre los conceptos que vayas a aplicar (hooks, props y tipado, estado, renderizado, memoización, Server/Client Components, etc.).
   - Si no encontrás el library ID o la consulta no responde, continúa con tus conocimientos de React 19, pero indica en el resumen final qué no pudiste verificar.

2. **Aplica las mejores prácticas de React** manteniendo la funcionalidad intacta:
   - Componentes tipados: define `props` con TypeScript (interfaces/tipos explícitos), nunca `any` implícito.
   - Hooks: usa los correctos para cada caso, declara las dependencias de `useEffect`/`useMemo`/`useCallback` explícitamente, y evita efectos innecesarios (deriva estado/computaciones durante el render cuando sea posible).
   - Estado: evita estado redundante o derivable; prefiere actualizaciones funcionales con el valor previo; mantén los estados locales en el componente más cercano que los necesite.
   - Listas: usa `key` estables y únicas (no el índice salvo que la lista sea estática).
   - No mutes props ni estado; usa inmutabilidad.
   - Memoiza solo donde aporte valor real (componentes pesados o referencias usadas en deps).
   - En componentes de Next.js 15: marca correctamente Server Components vs Client Components (`"use client"` solo cuando haya hooks de estado/efectos o interactividad del browser); mantén los componentes de servidor por defecto.

3. **Respeta las convenciones del proyecto**:
   - Tailwind utility classes solamente (sin CSS modules ni styled-components).
   - Código limpio, nombres de funciones, variables, etc. en inglés.
   - No agregues comentarios salvo que se pidan explícitamente.
   - No introduzcas librerías nuevas: usa solo las que ya están en `package.json`.

4. **Verifica los cambios** con el flujo pre-PR:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
   - Si algún comando falla por tu cambio, corrígelo antes de terminar.

5. **Reporta al final** un resumen conciso con:
   - Archivos modificados y qué se cambió en cada uno.
   - Mejores prácticas aplicadas y, si aplica, cuáles se desviaron de la documentación oficial consultada.
   - Resultado de lint, typecheck y build.
