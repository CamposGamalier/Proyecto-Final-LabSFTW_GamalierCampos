# 🎬 Gestor Multimedia - Práctica Final (Lab Ingeniería del Software)

Proyecto Cliente/Servidor con AngularJS y Node.js desarrollado como práctica final del curso "Laboratorio de Ingeniería del Software". La aplicación permite la gestión de usuarios, categorías y vídeos mediante una interfaz administrativa, y una sección de visualización pública para usuarios.

---

## 🔐 Cuentas de acceso

| Rol         | Email               | Contraseña |
|-------------|---------------------|-------------|
| Administrador | `admin@example.com` | `1234`       |
| Usuario      | `user@example.com`  | `1234`       |

---

## 🧩 Tecnologías utilizadas

### Frontend (AngularJS)
- HTML5, CSS3, Bootstrap 4.5
- AngularJS 1.8
- JQuery 3.5

### Backend (Node.js + SQLite)
- Node.js
- Express
- SQLite3
- Body-parser, UUID

---

## 📁 Estructura del proyecto

```

Proyecto-Final-LabSFTW\_GamalierCampos/
│
├── backend/
│   ├── database.db            # Base de datos SQLite (persistente)
│   └── server.js
│
├── frontend/
│   ├── index.html             # Pantalla de login
│   ├── admin.html             # Panel de administración
│   ├── user.html              # Vista pública para usuarios
│   ├── js/
│   └── css/

````

---

## ⚙️ Instrucciones para ejecutar el backend

1. Abre una terminal en la carpeta `backend/`.
2. Instala las dependencias necesarias (una sola vez):

```bash
npm install express sqlite3 body-parser uuid cors
````

3. Asegúrate de que el archivo `database.db` esté presente (incluido en el repositorio).
4. Inicia el servidor:

```bash
node app.js
```

El servidor escuchará por defecto en `http://localhost:3000`.

---

## 💡 Instrucciones para ejecutar el frontend

1. Abre `index.html` directamente desde cualquier navegador moderno.
2. Inicia sesión con las credenciales indicadas arriba.
3. Si el login es exitoso, accederás a:

   * `admin.html` si eres admin.
   * `user.html` si eres usuario.



## ✅ Funcionalidades implementadas

### Administrador

* CRUD de Usuarios
* CRUD de Categorías
* CRUD de Vídeos (con asociación a categoría)
* Filtro de búsqueda por nombre de vídeo
* Gestión por pestañas
* Logout con limpieza de sesión

### Usuario

* Login limitado al rol "user"
* Visualización de vídeos filtrables por categoría
* Protección por `session_id`

---

## 📌 Autor

**Gamalier Campos Riveros**
Práctica final para el curso de **Laboratorio de Ingeniería del Software (2024/2025)**
Universidad Politécnica de Cartagena (UPCT)


