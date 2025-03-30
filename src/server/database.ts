import { Sequelize } from "sequelize";
import { POSTGRES_DB } from "./config.js";
import logger from "./logger.js";

// Khởi tạo Sequelize trước khi import model
export const sequelize = new Sequelize(POSTGRES_DB, {
  dialect: "postgres",
  logging: false, // Hiển thị SQL logs để kiểm tra
  dialectOptions: {
    keepAlive: true,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function databaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();

    await sequelize.sync({ alter: true }); // Hoặc force: true nếu cần xóa & tạo lại bảng

    console.log("✅ Database synchronized");
  } catch (error: any) {
    console.error("❌ Unable to connect to database:", error.message);
  }
}
