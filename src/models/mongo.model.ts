import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { DataTypes, ModelDefined, Optional } from "sequelize";
import { sequelize } from "../server/database.js";

type MongoAttributes = Optional<IHeartBeat, "id">;

const MongoModel: ModelDefined<IHeartBeat, MongoAttributes> = sequelize.define(
  "mongo_heartbeats",
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
      type: DataTypes.DATE,
      allowNull: false,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    connection: {
      type: DataTypes.STRING,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ["monitorId"],
      },
    ],
  }
) as ModelDefined<IHeartBeat, MongoAttributes>;

export { MongoModel };
