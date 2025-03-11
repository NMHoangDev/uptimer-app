import { Model, ModelDefined, Optional } from "sequelize";
import { IUserDocumnet } from "src/interface/user.interface.js";
import { sequelize } from "src/server/database.js";

const SALT_ROUND = 10;
interface UserModelInstanceMethod extends Model {
  prototype: {
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    hashPassword(password: string): Promise<string>;
  };
}
type UserCreationAttributes = Optional<IUserDocumnet, "id" | "createdAt">;

const UserModel: ModelDefined<IUserDocumnet, UserCreationAttributes> &
  UserModelInstanceMethod = sequelize.define("user", {}) as ModelDefined<
  IUserDocumnet,
  UserCreationAttributes
> &
  UserModelInstanceMethod;
export { UserModel };
