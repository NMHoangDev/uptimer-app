import { Sequelize } from "sequelize";
import { POSTGRES_DB } from "./config.js";
import logger from "./logger.js";

export const sequelize: Sequelize = new Sequelize(POSTGRES_DB, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    mutipleStatements: true,
  },
});
export async function databaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (error) {
    logger.error("Unable to connect to database", error);
  }
}
