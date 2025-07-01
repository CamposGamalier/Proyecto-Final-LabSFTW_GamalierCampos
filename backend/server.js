const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

// Conexión a SQLite
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});

function getSessionUser(session_id, cb) {
  db.get("SELECT users.* FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.session_id = ?", [session_id], (err, row) => {
    if (err) {
      console.error("Error obteniendo usuario de sesión:", err.message);
    }
    cb(err, row);
  });
}

// Crear tablas si no existen
db.serialize(() => {
  // Estructura de usuarios
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT CHECK(role IN ('admin','user')) NOT NULL)",
    (err) => {
      if (err) console.error('Error creando tabla users:', err.message);
    }
  );

  // Estructura de sesiones
  db.run(
    "CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))",
    (err) => {
      if (err) console.error('Error creando tabla sessions:', err.message);
    }
  );

  // Tabla de categorías
  db.run(
    "CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)",
    (err) => {
      if (err) console.error('Error creando tabla categories:', err.message);
    }
  );

  // Tabla de videos
  db.run(
    "CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL, category_id INTEGER REFERENCES categories(id))",
    (err) => {
      if (err) console.error('Error creando tabla videos:', err.message);
    }
  );
});
// Insertar usuario admin por defecto si no existe
db.get("SELECT * FROM users WHERE email = 'admin@example.com'", (err, row) => {
  if (err) {
    console.error("Error verificando existencia de admin:", err.message);
  } else if (!row) {
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Admin', 'admin@example.com', '1234', 'admin'],
      (err) => {
        if (err) {
          console.error("Error creando usuario admin:", err.message);
        } else {
          console.log("Usuario admin@example.com creado con contraseña 1234");
        }
      }
    );
  } else {
    console.log("El usuario admin ya existe.");
  }
});

// ===================== LOGIN =====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }
  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
    if (err) {
      console.error("Error durante login:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (row) {
      const session_id = uuidv4();
      db.run("INSERT INTO sessions (session_id, user_id) VALUES (?, ?)", [session_id, row.id], (err) => {
        if (err) {
          console.error("Error creando sesión:", err.message);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        console.log(`Login exitoso: user=${row.name}, role=${row.role}, session_id=${session_id}`);
        res.json({
          session_id,
          rol: row.role,
          nombre: row.name,
          email: row.email,
        });
      });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });
});

// ===================== LOGOUT =====================
app.put("/logout", (req, res) => {
  const { session_id } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: "Session ID requerido" });
  }
  db.run("DELETE FROM sessions WHERE session_id = ?", [session_id], function (err) {
    if (err) {
      console.error("Error durante logout:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    console.log(`Logout exitoso: session_id=${session_id}`);
    res.json({ message: "Sesión cerrada" });
  });
});

// ===================== USUARIOS =====================
app.get("/users/:session_id", (req, res) => {
  const { session_id } = req.params;
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      console.error(`Acceso denegado a /users: session_id=${session_id}, user=${user?.name}, role=${user?.role}`);
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.all("SELECT * FROM users", (err, rows) => {
      if (err) {
        console.error("Error obteniendo usuarios:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json(rows);
    });
  });
});

app.post("/user", (req, res) => {
  console.log("Datos recibidos para nuevo usuario:", req.body);
  const { session_id, name, email, password, role } = req.body;
  if (!session_id || !name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role || "user"], function (err) {
      if (err) {
        console.error("Error creando usuario:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ id: this.lastID });
    });
  });
});

app.put("/user/:id", (req, res) => {
  const { session_id, name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
  }
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?", [name, email, password, role || "user", req.params.id], function (err) {
      if (err) {
        console.error("Error actualizando usuario:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ updated: this.changes });
    });
  });
});

app.delete("/user/:id", (req, res) => {
  const { session_id } = req.body;
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
      if (err) {
        console.error("Error eliminando usuario:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ deleted: this.changes });
    });
  });
});

// ===================== CATEGORÍAS =====================
app.get("/categories/:session_id", (req, res) => {
  const { session_id } = req.params;
  getSessionUser(session_id, (err, user) => {
    if (err || !user) {
      return res.status(403).json({ error: "Sesión inválida" });
    }
    db.all("SELECT * FROM categories", (err, rows) => {
      if (err) {
        console.error("Error obteniendo categorías:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json(rows);
    });
  });
});

app.post("/category", (req, res) => {
  console.log("Datos recibidos para nueva categoría:", req.body);
  const { session_id, name } = req.body;
  if (!session_id || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("INSERT INTO categories (name) VALUES (?)", [name], function (err) {
      if (err) {
        console.error("Error creando categoría:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ id: this.lastID });
    });
  });
});

app.put("/category/:id", (req, res) => {
  const { session_id, name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Nombre de categoría requerido" });
  }
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("UPDATE categories SET name = ? WHERE id = ?", [name, req.params.id], function (err) {
      if (err) {
        console.error("Error actualizando categoría:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ updated: this.changes });
    });
  });
});

app.delete("/category/:id", (req, res) => {
  const { session_id } = req.body;
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("DELETE FROM categories WHERE id = ?", [req.params.id], function (err) {
      if (err) {
        console.error("Error eliminando categoría:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ deleted: this.changes });
    });
  });
});

// ===================== VÍDEOS =====================
app.get("/videos/:session_id", (req, res) => {
  const { session_id } = req.params;
  getSessionUser(session_id, (err, user) => {
    if (err || !user) {
      return res.status(403).json({ error: "Sesión inválida" });
    }

    if (user.role === "admin") {
      db.all("SELECT * FROM videos", (err, rows) => {
        if (err) {
          console.error("Error obteniendo videos:", err.message);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.json(rows);
      });
      return;
    }

    db.all("SELECT * FROM categories", (err, categories) => {
      if (err) {
        console.error("Error obteniendo categorías:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      db.all("SELECT name, url, category_id FROM videos", (err, videos) => {
        if (err) {
          console.error("Error obteniendo videos:", err.message);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        const result = {};
        categories.forEach((c) => {
          result[c.name] = videos
            .filter((v) => v.category_id === c.id)
            .map((v) => ({ name: v.name, url: v.url }));
        });
        res.json(result);
      });
    });
  });
});

app.post("/video", (req, res) => {
  console.log("Datos recibidos para nuevo video:", req.body);
  const { session_id, name, url, category_id } = req.body;
  if (!session_id || !name || !url || !category_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("INSERT INTO videos (name, url, category_id) VALUES (?, ?, ?)", [name, url, category_id], function (err) {
      if (err) {
        console.error("Error creando video:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ id: this.lastID });
    });
  });
});

app.put("/video/:id", (req, res) => {
  const { session_id, name, url, category_id } = req.body;
  if (!name || !url || !category_id) {
    return res.status(400).json({ error: "Nombre, URL y categoría son requeridos" });
  }
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("UPDATE videos SET name = ?, url = ?, category_id = ? WHERE id = ?", [name, url, category_id, req.params.id], function (err) {
      if (err) {
        console.error("Error actualizando video:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ updated: this.changes });
    });
  });
});

app.delete("/video/:id", (req, res) => {
  const { session_id } = req.body;
  getSessionUser(session_id, (err, user) => {
    if (err || !user || user.role !== "admin") {
      return res.status(403).json({ error: "Sesión inválida o no autorizada" });
    }
    db.run("DELETE FROM videos WHERE id = ?", [req.params.id], function (err) {
      if (err) {
        console.error("Error eliminando video:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.json({ deleted: this.changes });
    });
  });
});

// ===================== VÍDEOS PARA USUARIOS =====================
app.get("/public/:session_id", (req, res) => {
  const { session_id } = req.params;
  getSessionUser(session_id, (err, user) => {
    if (err || !user) {
      return res.status(403).json({ error: "Sesión inválida" });
    }
    db.all("SELECT * FROM categories", (err, categories) => {
      if (err) {
        console.error("Error obteniendo categorías:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      db.all("SELECT name, url, category_id FROM videos", (err, videos) => {
        if (err) {
          console.error("Error obteniendo videos:", err.message);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        const result = categories.map((c) => ({
          category: c.name,
          videos: videos
            .filter((v) => v.category_id === c.id)
            .map((v) => ({ name: v.name, url: v.url })),
        }));
        res.json(result);
      });
    });
  });
});

// Videos por categoría para usuarios
app.get("/public/category/:category_id/:session_id", (req, res) => {
  const { session_id, category_id } = req.params;
  getSessionUser(session_id, (err, user) => {
    if (err || !user) {
      return res.status(403).json({ error: "Sesión inválida" });
    }
    db.all(
      "SELECT name, url FROM videos WHERE category_id = ?",
      [category_id],
      (err, rows) => {
        if (err) {
          console.error("Error obteniendo videos:", err.message);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.json(rows);
      }
    );
  });
});

// ===================== INICIAR SERVIDOR =====================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cerrar la base de datos al terminar
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) console.error("Error cerrando la base de datos:", err.message);
    console.log("Conexión a la base de datos cerrada");
    process.exit(0);
  });
});
