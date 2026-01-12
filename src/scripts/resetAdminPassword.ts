import bcrypt from "bcrypt";
import { query } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

const resetAdminPassword = async () => {
  try {
    console.log("🔧 Reseteando contraseña del administrador...");

    const email = "admin@empresa.com";
    const newPassword = "Admin123!";

    // Verificar si existe
    const existingUser = await query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length === 0) {
      console.log("❌ El usuario admin no existe. Creándolo...");

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await query(
        `INSERT INTO users (email, password_hash, full_name, role, department)
         VALUES ($1, $2, $3, $4, $5)`,
        [email, passwordHash, "Administrador Sistema", "admin", "TI"]
      );

      console.log("✅ Usuario administrador creado exitosamente");
    } else {
      console.log("📝 Usuario encontrado, actualizando contraseña...");

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await query("UPDATE users SET password_hash = $1 WHERE email = $2", [
        passwordHash,
        email,
      ]);

      console.log("✅ Contraseña actualizada exitosamente");
    }

    console.log("");
    console.log("📧 Email: admin@empresa.com");
    console.log("🔑 Password: Admin123!");
    console.log("");
    console.log("⚠️  Puedes usar estas credenciales para iniciar sesión");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    process.exit(0);
  }
};

resetAdminPassword();
