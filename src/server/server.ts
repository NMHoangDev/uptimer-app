import express, { json, urlencoded } from "express";
import http from "http";
import cors from "cors";
import {
  CLIENT_URL,
  NODE_ENV,
  PORT,
  SECRET_KEY_ONE,
  SECRET_KEY_TWO,
} from "./config.js";
import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

import { expressMiddleware } from "@apollo/server/express4";
import cookieSession from "cookie-session";
import logger from "./logger.js";

const typeDefs = `#graphql
  type User {
    userName: String
  }
  type Query {
    user: User
  }
`;
const resolvers = {
  Query: {
    user() {
      return { userName: "DANY" };
    },
  },
};

export default class MonitorServer {
  private app: express.Application;
  private httpServer: http.Server;
  private server: ApolloServer;

  constructor(app: express.Application) {
    this.app = app;
    this.httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    this.server = new ApolloServer({
      schema,
      introspection: NODE_ENV !== "production",
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        ...(NODE_ENV === "production"
          ? [ApolloServerPluginLandingPageDisabled()]
          : [ApolloServerPluginLandingPageLocalDefault({ embed: true })]),
      ],
    });
  }

  async start(): Promise<void> {
    /**
     * Note: Nên gọi phương thức start() trên ApolloServer
     * instance before pasing  the instance to expressMiddleware
     */
    await this.server.start();
    this.standardMiddleware(this.app);
    this.startServer();
  }

  private standardMiddleware(app: express.Application): void {
    app.set("trust proxy", 1);
    app.use((req, res, next) => {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    });
    app.use(
      cookieSession({
        name: "session",
        keys: [SECRET_KEY_ONE, SECRET_KEY_TWO],
        maxAge: 24 * 7 * 3600000,
        secure: NODE_ENV !== "development",
        ...(NODE_ENV !== "development" && {
          sameSite: "none",
        }),
      })
    );
    this.graphqlRoute(app);
    this.healthRoute(app);
  }
  private graphqlRoute(app: Express): void {
    app.use(
      "/graphql",
      cors({
        origin: CLIENT_URL,
        credentials: true,
      }),
      json({ limit: "200mb" }), // ✅ Middleware hợp lệ
      urlencoded({ extended: true, limit: "200mb" }),
      expressMiddleware(this.server, {
        context: async ({ req, res }: { req: Request; res: Response }) => {
          return { req, res };
        },
      })
    );
  }
  private healthRoute(app: Express): void {
    app.get("/health", (_req: Request, res: Response) => {
      res.status(200).send("Uptimer monitor service is healthy and OK.");
    });
  }

  private async startServer(): Promise<void> {
    try {
      const SERVER_PORT: number = parseInt(PORT!, 10) || 5000;
      logger.info(`Server has started with process id ${process.pid}`);
      this.httpServer.listen(SERVER_PORT, () => {
        logger.info(`Server started with port ${SERVER_PORT}`);
      });
    } catch (error) {
      logger.error("Error in start method:", error);
    }
  }
}
