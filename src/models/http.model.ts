import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { DataTypes, ModelDefined, Optional } from "sequelize";
import { sequelize } from "../server/database.js";
type HttpAttributes = Optional<IHeartBeat, "id">;

const HttpModel: ModelDefined<IHeartBeat, HttpAttributes> = sequelize.define(
  "http_heartbeats",
  {
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
      defaultValue: 0,
    },
    message: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    reqHeaders: {
      type: DataTypes.TEXT,
    },
    resHeaders: {
      type: DataTypes.TEXT,
    },
    reqBody: {
      type: DataTypes.TEXT,
    },
    resBody: {
      type: DataTypes.TEXT,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "http_heartbeats",
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ["monitorId"],
      },
    ],
  }
) as ModelDefined<IHeartBeat, HttpAttributes>;

export { HttpModel };
