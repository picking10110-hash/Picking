# Productividad Picking - Ranking 3D

Este es un proyecto web premium e interactivo diseñado para la presentación y gestión visual del ranking de productividad de preparadores de pedidos ("pickers"). Combina un diseño de interfaz de usuario futurista (Cyberpunk y Glassmorphism) con barras de progreso tridimensionales dinámicas y animaciones fluidas con GSAP.

## ✨ Características Principales

1. **Dashboard 3D de Alto Impacto**:
   - Barras de productividad tridimensionales reales construidas con transformaciones CSS 3D (`preserve-3d`).
   - Efecto de iluminación neón ambiental y brillos dinámicos en las barras según el puntaje.
   - Efecto de inclinación 3D (Tilt) interactivo al pasar el cursor sobre las filas del ranking.
   - Puestos del podio (1º, 2º y 3º) resaltados con colores metalizados (Oro, Plata, Bronce) y medallas brillantes.

2. **Panel de Administración Lateral**:
   - **Crear**: Agrega nuevos preparadores con su nombre y tasa de picks/hora.
   - **Editar**: Modifica directamente el nombre, los picks/hora o la foto de cualquier preparador mediante un modal flotante integrado.
   - **Eliminar**: Remueve preparadores con animaciones suaves de desvanecimiento de GSAP.
   - **Persistencia**: Todos los datos se guardan en el almacenamiento local (`localStorage`) del navegador, por lo que no se perderán al recargar o cerrar la página.

3. **Subida de Fotos Personalizadas**:
   - Carga imágenes o fotos reales de tus preparadores desde tu computadora. Se procesan a nivel de cliente y se guardan directamente en el navegador.
   - Selección rápida entre 4 avatares predeterminados de diseño premium de forma alternativa.

4. **Modo TV (Pantalla Completa)**:
   - Activa el modo "Pantalla Completa" para ocultar el panel de administración y escalar toda la interfaz (tamaño de textos, barras 3D y avatares) para su visualización clara en televisores o monitores grandes dentro del almacén.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica completa optimizada para accesibilidad.
- **Vanilla CSS**: Estilos a medida, glassmorphism (`backdrop-filter`) y transformaciones 3D.
- **Vanilla Javascript (ES6)**: Lógica de la aplicación, operaciones CRUD y gestión de persistencia.
- **GSAP (GreenSock Animation Platform)**:
  - Animación inicial progresiva (cascada).
  - Técnica FLIP para la transición de ordenamiento del ranking cuando cambian los puntajes.
  - Animación rodante del conteo numérico de picks y estadísticas globales.

---

## 🚀 Cómo Ejecutar el Proyecto

Este proyecto no requiere de ningún servidor backend, bases de datos complejas ni instalaciones de NodeJS. Se ejecuta directamente en el navegador web del cliente.

1. Ve a la carpeta del proyecto en tu explorador de archivos:
   `/home/eladripc/.gemini/antigravity/scratch/productividad_picking/`
2. Abre el archivo `index.html` con cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox o Safari).
3. ¡Comienza a configurar tus preparadores!
