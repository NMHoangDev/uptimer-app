import { Request } from "express";
import { GraphQLError } from "graphql";
import pkg from "jsonwebtoken";

import { IAuthPayload } from "../interface/user.interface.js";
import { JWT_TOKEN } from "../server/config.js";

/**
 *
 * Email validator
 * @returns {boolean}
 */
export const isEmail = (email: string): boolean => {
  const regexExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  return regexExp.test(email);
};
/**
 * Authenticates user access to protected routes
 * @param {req}
 * @returns {void}
 */

export const authenticateGraphQLRoute = (req: Request): void => {
  if (!req.session?.jwt) {
    throw new GraphQLError("Please login again");
  }
  const { verify } = pkg;
  try {
    const payload: IAuthPayload = verify(
      req.session?.jwt,
      JWT_TOKEN
    ) as IAuthPayload;
    req.currentUser = payload;
  } catch (error: any) {
    throw new GraphQLError(error);
  }
};
