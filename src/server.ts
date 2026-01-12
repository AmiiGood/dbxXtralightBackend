import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";

// Importar rutas
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import defectsRoutes from "./routes/defects";
import auditRoutes from "./routes/audit";
import shiftsRoutes from "./routes/shifts";
import modulesRoutes from "./routes/modules";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y utilidades
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas de salud
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/defects", defectsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/modules", modulesRoutes);

// Ruta 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejador de errores global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error no manejado:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : err.message,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📝 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa rechazada no manejada:", promise, "razón:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error);
  process.exit(1);
});

export default app;
