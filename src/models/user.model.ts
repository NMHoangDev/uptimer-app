import { compare, hash } from "bcryptjs";
import { DataTypes, Model, ModelDefined, Optional } from "sequelize";
import { IUserDocument } from "../interface/user.interface.js";
import { sequelize } from "../server/database.js";

const SALT_ROUND = 10;
interface UserModelInstanceMethod extends Model {
  prototype: {
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    hashPassword(password: string): Promise<string>;
  };
}
type UserCreationAttributes = Optional<IUserDocument, "id" | "createdAt">;

const UserModel: ModelDefined<IUserDocument, UserCreationAttributes> &
  UserModelInstanceMethod = sequelize.define(
  "user",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebookID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
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
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["username"],
      },
    ],
  }
) as ModelDefined<IUserDocument, UserCreationAttributes> &
  UserModelInstanceMethod;

UserModel.addHook("beforeCreate", async (auth: Model) => {
  if (auth.dataValues.password !== undefined) {
    let { dataValues } = auth;
    const hashedPassword: string = await hash(dataValues.password, SALT_ROUND);
    dataValues = { ...dataValues, password: hashedPassword };
    auth.dataValues = dataValues;
  }
});
UserModel.prototype.comparePassword = async function (
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
};
UserModel.prototype.hashPassword = async function (
  password: string
): Promise<string> {
  return hash(password, SALT_ROUND);
};

export { UserModel };
