import { compare, hash } from "bcryptjs";
import { DataTypes, Model, ModelDefined, Optional } from "sequelize";
import { INotificationDocument } from "../interface/notification.interface.js";
import { IUserDocument } from "../interface/user.interface.js";
import { sequelize } from "../server/database.js";
import { UserModel } from "./user.model.js";

const SALT_ROUND = 10;
interface UserModelInstanceMethod extends Model {
  prototype: {
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    hashPassword(password: string): Promise<string>;
  };
}
type NotificationAttributes = Optional<
  INotificationDocument,
  "id" | "createdAt"
>;

const NotificationModel: ModelDefined<
  INotificationDocument,
  NotificationAttributes
> = sequelize.define(
  "notifications",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserModel,
        key: "id",
      },
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    googleID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebookID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emails: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    indexes: [
      {
        fields: ["userId"],
      },
    ],
  }
) as ModelDefined<INotificationDocument, NotificationAttributes>;

export { NotificationModel };
