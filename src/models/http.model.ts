import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { DataTypes, ModelDefined, Optional } from "sequelize";
import { sequelize } from "../server/database.js";
type HttpAttributes = Optional<IHeartBeat, "id">;

const HttpModel: ModelDefined<IHeartBeat, HttpAttributes> = sequelize.define(
  "http_heartbeats",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    monitorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    reqHeaders: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resHeaders: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reqBody: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resBody: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    connection: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    // Các cấu hình khác nếu cần
    tableName: "http_heartbeats", // Đảm bảo tên bảng đúng
    timestamps: false,
    indexes: [
      {
        unique: false,
        fields: ["monitorId"],
      },
    ],
  }
);
export { HttpModel };
