## Purpose

Provee el feed de la familia en `/familia`: una vista propia con encabezado "TU FAMILIA", filtros por hijo y posts limitados a los hijos del usuario y los anuncios de su sala, mostrando quién publicó y en qué sala.

## ADDED Requirements

### Requirement: Feed de familia filtrado por hijos y sala

El feed de familia SHALL mostrar únicamente posts que etiquetan a alguno de los hijos del usuario, más los posts de tipo `announcement` de la sala de esos hijos.

#### Scenario: Padre ve solo los posts de sus hijos
- **WHEN** un padre vinculado al niño Mateo navega a `/familia`
- **THEN** el feed muestra los posts que etiquetan a Mateo y los anuncios de su sala

#### Scenario: Padre no ve posts de niños ajenos
- **WHEN** un padre navega a `/familia` y existen posts de otros niños no vinculados a él
- **THEN** esos posts no aparecen en su feed

### Requirement: Encabezado del feed de familia

El feed de familia SHALL mostrar el encabezado del diseño familia: label "TU FAMILIA", saludo con el primer nombre del usuario y la línea "Así va el día de hoy".

#### Scenario: Encabezado personalizado
- **WHEN** un padre navega a `/familia`
- **THEN** ve "TU FAMILIA", "Hola, {primer nombre}" y "Así va el día de hoy"

### Requirement: Filtro por hijo

El feed de familia SHALL ofrecer chips de filtro con los hijos del usuario más la opción "Todos"; seleccionar un hijo limita el feed a los posts de ese hijo (más los anuncios de su sala), y "Todos" muestra el feed completo del usuario.

#### Scenario: Filtrar por un hijo
- **WHEN** un padre selecciona el chip de uno de sus hijos
- **THEN** el feed muestra solo los posts que etiquetan a ese hijo, más los anuncios de su sala

#### Scenario: Mostrar todos
- **WHEN** un padre selecciona el chip "Todos"
- **THEN** el feed muestra todos los posts de sus hijos más los anuncios de la sala

### Requirement: Autor y sala visibles en cada post

Cada post del feed de familia SHALL mostrar el autor y la sala, en el formato "HH:MM · {autor} · Sala {sala}".

#### Scenario: Meta del post
- **WHEN** un padre ve un post en `/familia`
- **THEN** el post muestra la hora, el nombre del autor y la sala, por ejemplo "14:20 · Maestra Caro · Sala Soles"
