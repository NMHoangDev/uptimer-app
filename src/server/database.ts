import { Sequelize } from "sequelize";
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
} from "./config.js";
import logger from "./logger.js";

// Khởi tạo Sequelize trước khi import model
const port = parseInt(DB_PORT, 10);

export const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
  port: parseInt(DB_PORT, 10),
});

export async function databaseConnection(): Promise<void> {
  try {
    console.log(sequelize.models);
    await sequelize.authenticate();
    console.log("✅ Kết nối thành công.");
    await sequelize.sync({ alter: true });
    // { force: true } nếu muốn reset bảng
    console.log("✅ Đồng bộ bảng thành công.");
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log("Các bảng đã được tạo:", tables);
  } catch (error) {
    console.error("❌ Lỗi kết nối:", error);
  }
}
