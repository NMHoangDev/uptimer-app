import { GraphQLError } from "graphql";
import { Request } from "express";
import pkgLodash from "lodash";

import {
  IUserDocument,
  IUserResponse,
} from "../../interface/user.interface.js";
import { AppContext } from "../../interface/monitor.interface.js";
import {
  createNotificationGroup,
  getAllNotificationGroups,
} from "../../services/notification.service.js";
import {
  createNewUser,
  getUserByProp,
  getUserBySocialId,
  getUserByUsernameOrEmail,
} from "../../services/user.service.js";

import { JWT_TOKEN } from "../../server/config.js";
import pkgJsonWebToken from "jsonwebtoken";
import logger from "../../server/logger.js";
import { authenticateGraphQLRoute, isEmail } from "../../utils/utils.js";
import { UserModel } from "../../models/user.model.js";
import {
  UserLoginRules,
  UserRegisterationRules,
} from "../../validations/index.js";
const { sign } = pkgJsonWebToken;

const { toLower, upperFirst } = pkgLodash;

export const UserResolver = {
  Query: {
    async checkCurrentUser(
      _: undefined,
      __: undefined,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      logger.info(req.currentUser);
      //TODO: validate jwt token
      const notifications = await getAllNotificationGroups(req.currentUser!.id);
      return {
        user: {
          id: req.currentUser!.id,
          username: req.currentUser?.name,
          email: req.currentUser?.email,
          createdAt: new Date(),
        },
        notifications,
      };
    },
  },
  Mutation: {
    async registerUser(
      _: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;
      await UserRegisterationRules.validate(user, { abortEarly: false });
      logger.info("User pass into argus", args);
      //TODO: add data validation(add du lieu duoc xac thuc)
      const { username, password, email } = user;
      const checkIfUserExists: IUserDocument | null =
        await getUserByUsernameOrEmail(username!, email!);
      if (checkIfUserExists) {
        throw new GraphQLError("Invalid credentials. Email or Username");
      }
      const authData: IUserDocument = {
        username: upperFirst(username),
        email: toLower(email),
        password,
      } as IUserDocument;
      const result: IUserDocument | undefined = await createNewUser(authData);
      if (!result || !result.id) {
        throw new GraphQLError("User creation failed");
      }
      console.log(result);
      const response: IUserResponse = await userReturnValue(
        req,
        result,
        "register"
      );
      return response;
    },
    async loginUser(
      _: undefined,
      argus: { username: string; password: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { username, password } = argus;
      await UserLoginRules.validate(
        { username, password },
        { abortEarly: false }
      );
      //TODO: validate
      const isValidEmail = isEmail(username);
      const type = !isValidEmail ? "username" : "email";
      const existingUser: IUserDocument | undefined = await getUserByProp(
        username,
        type
      );
      if (!existingUser) {
        throw new GraphQLError("Invalid crendetials");
      }
      const passwordMatch = await UserModel.prototype.comparePassword(
        password,
        existingUser.password!
      );
      if (!passwordMatch) {
        throw new GraphQLError("Password is incorrect");
      }
      const response: IUserResponse = await userReturnValue(
        req,
        existingUser,
        "login"
      );
      return response;
    },
    async authSocialUser(
      _: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;
      await UserRegisterationRules.validate(user, { abortEarly: false });

      //TODO: add data validation(add du lieu duoc xac thuc)
      const { username, email, socialId, type } = user;
      const checkIfUserExists: IUserDocument | undefined =
        await getUserBySocialId(socialId!, email!, type);
      if (checkIfUserExists) {
        const response: IUserResponse = await userReturnValue(
          req,
          checkIfUserExists,
          "login"
        );
        return response;
      } else {
      }
      const authData: IUserDocument = {
        username: upperFirst(username),
        email: toLower(email),
        ...(type === "facebook" && {
          facebookID: socialId,
        }),
        ...(type === "google" && {
          googleID: socialId,
        }),
      } as IUserDocument;
      const result: IUserDocument | undefined = await createNewUser(authData);
      if (!result || !result.id) {
        throw new GraphQLError("User creation failed");
      }
      console.log(result);
      const response: IUserResponse = await userReturnValue(
        req,
        result,
        "register"
      );
      return response;
    },
    logout(_: undefined, __: undefined, contextValue: AppContext) {
      const { req } = contextValue;
      req.session = null;
      req.currentUser = undefined;
      return null;
    },
  },
};
async function userReturnValue(
  req: Request,
  result: IUserDocument,
  type: string
): Promise<IUserResponse> {
  let notifications: any = [];
  let emails: any = [];
  if (type === "register" && result && result.id && result.email) {
    console.log("Result:", result);
    const notification = await createNotificationGroup({
      userId: result.id,
      groupName: "Default Contact Group",
      emails: JSON.stringify(result.email!),
    });
    console.log("Notification:", notification);
    notifications.push({
      ...notification,

      // Nếu null, trả về mảng rỗng
    });
  } else if (type === "login" && result && result.id && result.email) {
    notifications = await getAllNotificationGroups(result.id);
  }
  const userJwt: string = sign(
    {
      id: result.id,
      email: result.email,
      username: result.username,
    },
    JWT_TOKEN
  );
  req.session = { jwt: userJwt, enableAutomaticRefresh: true };
  const user: IUserDocument = {
    id: result.id,
    email: result.email,
    username: result.username,
    createdAt: result.createdAt,
  } as IUserDocument;
  console.log("Notifications:", notifications);
  return {
    user,
    notifications: notifications || [],
  };
}
