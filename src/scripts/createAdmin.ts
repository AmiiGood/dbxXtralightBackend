import bcrypt from "bcrypt";
import { query } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

const createAdminUser = async () => {
  try {
    console.log("🔧 Creando usuario administrador...");

    const email = "admin@empresa.com";
    const password = "Admin123!"; // Cambiar en producción
    const fullName = "Administrador Sistema";
    const role = "admin";
    const department = "TI";

    // Verificar si ya existe
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      console.log("⚠️  El usuario administrador ya existe");
      return;
    }

    // Crear hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario
    await query(
      `INSERT INTO users (email, password_hash, full_name, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName, role, department]
    );

    console.log("✅ Usuario administrador creado exitosamente:");
    console.log("   Email:", email);
    console.log("   Password:", password);
    console.log(
      "   ⚠️  IMPORTANTE: Cambiar la contraseña después del primer login"
    );
  } catch (error) {
    console.error("❌ Error al crear usuario administrador:", error);
    throw error;
  } finally {
    process.exit(0);
  }
};

createAdminUser();
