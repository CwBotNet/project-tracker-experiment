import { Hono } from "hono";
import { healthCheckHandler, xSetupHandler } from "./middleware";

const app = new Hono();

/*-------------------------routes-----------------------*/

/*-------------------------root-route-----------------------*/
app.get("/", ...healthCheckHandler);
/*-------------------------x-oauth2-route-----------------------*/
app.get("/oAuth2", ...xSetupHandler);

/*-------------------------x-callback-route-----------------------*/
app.get("/callback", async (c) => {});

export default app;
