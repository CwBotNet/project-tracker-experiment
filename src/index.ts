import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getXtweetHandler,
  healthCheckHandler,
  postXtweethandler,
  xCallabckHandler,
  xSetupHandler,
} from "./middleware";
import { KVNamespace } from "@cloudflare/workers-types";
type Bindings = {
  TWITTER_API_BASE: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  REDIRECT_URI: string;
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
  STATE_KV: KVNamespace;
  CODE_VERIFIER_KV: KVNamespace;
  X_ACCESS_TOKEN: KVNamespace;
  X_REFRESH_TOKEN: KVNamespace;
  // [key: string]: KVNamespace | string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("/*", cors());

/*-------------------------routes-----------------------*/

/*-------------------------root-route-----------------------*/
app.get("/", ...healthCheckHandler);
/*-------------------------x-oauth2-route-----------------------*/

app.get("/oAuth2", ...xSetupHandler);

/*-------------------------x-callback-route-----------------------*/

// app.get("/x-Callback", async (c) => {
//   try {
//     const { code, state } = c.req.query();

//     const body={
//       code: code,
//       Client_id: c.env.CLIENT_ID,
//       redirect_uri: c.env.REDIRECT_URI,
//       Client_secret

//     }

//   } catch (error) {
//     return null;
//   }
// });

app.get("/callback", ...xCallabckHandler);

/*-------------------------testing-routes-----------------------*/
app.get("/x-tweets", ...getXtweetHandler);
app.post("/x-tweets", ...postXtweethandler);

export default app;
