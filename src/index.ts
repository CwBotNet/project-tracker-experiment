import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  healthCheckHandler,
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
app.get("/callback", ...xCallabckHandler);

app.post("/kv-update-post", async (c) => {
  try {
    await c.env.STATE_KV.put("state", "stateUPdated");
    await c.env.CODE_VERIFIER_KV.put("verifier", "codeVerifierUPdated");

    const state = await c.env.STATE_KV.get("state");
    const codeVerifier = await c.env.CODE_VERIFIER_KV.get("verifier");
    return c.json({
      success: true,
      state: state,
      codeVerifier: codeVerifier,
    });
  } catch (error: any) {
    console.log(error?.message);
    return c.text("Error", error.message);
  }
});
app.get("/kv-update-get", async (c) => {
  try {
    await c.env.STATE_KV.put("state", "stateUPdated-get");
    await c.env.CODE_VERIFIER_KV.put("verifier", "codeVerifierUPdated-get");

    const state = await c.env.STATE_KV.get("state");
    const codeVerifier = await c.env.CODE_VERIFIER_KV.get("verifier");
    return c.json({
      success: true,
      state: state,
      codeVerifier: codeVerifier,
    });
  } catch (error: any) {
    console.log(error?.message);
    return c.text("Error", error.message);
  }
});

export default app;
