# panel-separation Specification

## Purpose

Separa la aplicación en dos paneles independientes por rol —staff y familia— con layouts, navegación y control de acceso propios, de modo que cada rol solo vea y alcance las pantallas de su área.

## Requirements

### Requirement: Redirección por rol tras autenticación

El sistema SHALL enrutar a cada usuario autenticado al panel de su rol: staff/admin al panel del staff (raíz `/`) y padres al panel de familia (`/familia`).

#### Scenario: Login de un padre
- **WHEN** un usuario con rol `parent` inicia sesión o accede a la raíz `/`
- **THEN** es redirigido a `/familia`

#### Scenario: Login de staff
- **WHEN** un usuario con rol `staff` o `admin` inicia sesión o accede a `/familia`
- **THEN** es redirigido a la raíz `/`

### Requirement: Acceso a rutas restringidas por rol

El sistema SHALL impedir que un usuario acceda a rutas que no pertenecen a su panel, redirigiéndolo a su propia raíz.

#### Scenario: Padre intenta entrar a una ruta del staff
- **WHEN** un usuario con rol `parent` navega a una ruta del panel staff (`/kids`, `/kids/[id]`, `/avisos`, `/cuenta`)
- **THEN** es redirigido a `/familia`

#### Scenario: Staff intenta entrar a una ruta de familia
- **WHEN** un usuario con rol `staff` o `admin` navega a una ruta bajo `/familia`
- **THEN** es redirigido a la raíz `/`

### Requirement: Layout del panel staff

El panel staff SHALL presentar un sidebar con el scope "Sala {sala}", un botón "Nueva publicación", la navegación Feed, Niños, Avisos y Mi cuenta, y el footer de perfil con la etiqueta de rol y la sala ("Personal · Soles").

#### Scenario: Navegación del staff
- **WHEN** un usuario staff ve cualquier página del panel staff
- **THEN** el sidebar muestra las entradas Feed, Niños, Avisos y Mi cuenta, y el botón "Nueva publicación"

#### Scenario: Identidad del staff en el footer
- **WHEN** un usuario staff ve el footer del sidebar
- **THEN** se muestra su nombre y la etiqueta de rol con su sala ("Personal · Soles")

### Requirement: Layout del panel familia

El panel familia SHALL presentar un sidebar con el scope "Familia", sin botón de crear publicación, la navegación Feed y Mi cuenta, y el footer de perfil con el parentesco ("Mamá de Mateo").

#### Scenario: Navegación de la familia
- **WHEN** un usuario padre ve cualquier página del panel familia
- **THEN** el sidebar muestra las entradas Feed y Mi cuenta, y no muestra el botón "Nueva publicación"

#### Scenario: Identidad de la familia en el footer
- **WHEN** un usuario padre ve el footer del sidebar
- **THEN** se muestra su nombre y el parentesco con su hijo ("Mamá de Mateo")

### Requirement: Páginas del staff reubicadas

Las páginas existentes del staff (feed, gestión de niños y perfil de niño) SHALL estar disponibles bajo el panel staff con las mismas URLs y comportamiento que hoy.

#### Scenario: El feed del staff se mantiene en la raíz
- **WHEN** un usuario staff navega a `/`
- **THEN** ve el feed completo del staff con su encabezado y el flujo de crear publicación
