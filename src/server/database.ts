import { Sequelize } from "sequelize";
import { POSTGRES_DB } from "./config.js";
import logger from "./logger.js";

export const sequelize = new Sequelize(POSTGRES_DB, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    keepAlive: true,
    ssl: {
      require: true, // Yêu cầu sử dụng SSL
      rejectUnauthorized: false, // Tránh lỗi chứng chỉ tự ký
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
    await sequelize.sync();
    logger.info("✅ Database connection successfully established");
  } catch (error: any) {
    logger.error("❌ Unable to connect to database:", error.message);
    console.log(error);
  }
}
