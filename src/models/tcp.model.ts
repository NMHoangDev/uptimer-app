import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { sequelize } from "../server/database.js";
import { DataTypes, ModelDefined, Optional } from "sequelize";

type TCPAttributes = Optional<IHeartBeat, "id">;

const TCPModel: ModelDefined<IHeartBeat, TCPAttributes> = sequelize.define(
  "tcp_heartbeats",
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
) as ModelDefined<IHeartBeat, TCPAttributes>;

export { TCPModel };
