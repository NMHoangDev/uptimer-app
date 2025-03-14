import { Model, Op } from "sequelize";
import { IUserDocument } from "../interface/user.interface.js";
import { UserModel } from "../models/user.model.js";
import lodash from "lodash";
import logger from "../server/logger.js";

const { omit, toLower, upperFirst } = lodash;

export async function createNewUser(
  data: IUserDocument
): Promise<IUserDocument> {
  try {
    logger.info("Creating new user", data);

    // Đảm bảo createdAt là kiểu Date

    const result = await UserModel.create(data);
    const userData: IUserDocument = omit(result.toJSON(), [
      "password",
    ]) as IUserDocument;
    return userData;
  } catch (error: any) {
    logger.error("Error creating user:", error);
    throw new Error(error.message || "Error creating new user");
  }
}

export async function getUserByUsernameOrEmail(
  username: string,
  email: string
): Promise<IUserDocument | null> {
  try {
    console.log(`🔍 Kiểm tra user: username="${username}", email="${email}"`);

    const user = await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          { username: upperFirst(username.trim()) },
          { email: toLower(email.trim()) },
        ],
      },
    });

    if (!user) {
      console.log("⚠ Không tìm thấy user!");
      return null;
    }

    console.log("✅ User tìm thấy:", user);
    return user as IUserDocument;
  } catch (error) {
    console.error("❌ Lỗi khi tìm user bằng username/email:", error);
    return null;
  }
}
export async function getUserByProp(
  prop: string,
  type: string
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        ...(type === "username" && { username: upperFirst(prop) }),
        ...(type === "email" && { email: toLower(prop) }),
      },
    })) as unknown as IUserDocument | undefined;

    return user;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserBySocialId(
  socialId: string,
  email: string,
  type: String
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          {
            ...(type === "facebook" && { facebookID: socialId }),
            ...(type === "google" && { googleID: socialId }),
          },
        ],
      },
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {}
}
export async function getUserByUsername(
  prop: string,
  type: string
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          {
            ...(type === "username" && { username: upperFirst(prop) }),
            ...(type === "email" && { email: toLower(prop) }),
          },
        ],
      },
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {}
}
export async function getUserByEmail(
  email: string
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: { email: toLower(email) },
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {}
}
