import { createFactory } from "hono/factory";
import { generateCodeChallenge, generateCodeVerifier } from "./helper/utils";
import { generateOAuth2AuthLink, loginWithOauth2 } from "./twitter";
import { storeTokenInNotion } from "./notion";

const factory = createFactory();

const xSetupHandler = factory.createHandlers(async (c) => {
  try {
    const verifier: string = generateCodeVerifier();
    const state: string = crypto.randomUUID();
    const challenge = await generateCodeChallenge(verifier);

    const { REDIRECT_URI, CLIENT_ID, CODE_VERIFIER_KV, STATE_KV } = c.env;
    const { url } = await generateOAuth2AuthLink({
      callbackUrl: REDIRECT_URI,
      state: state,
      codeChallenge: challenge,
      code_challenge_method: "S256",
      scope: "tweet.read users.read follows.read follows.write",
      clientId: CLIENT_ID,
    });
    // Save verifier and state in KV storage
    console.log("Storing KV values");
    await c.env.CODE_VERIFIER_KV.put("verifier", verifier);
    await c.env.STATE_KV.put("state", state);

    console.log("KV values stored successfully");

    // Retrieve and log stored values to verify
    const storedVerifier = await c.env.CODE_VERIFIER_KV.get("verifier");
    const storedState = await c.env.STATE_KV.get("state");
    console.log({
      url: url,
      codeVerifier: storedVerifier,
      state: storedState,
    });

    return c.redirect(url);
  } catch (error) {
    console.error("Error during setup handler execution:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

const xCallabckHandler = factory.createHandlers(async (c) => {
  try {
    const { code, state } = c.req.query();
    const { TWITTER_API_BASE, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = c.env;

    const storedState = await c.env.STATE_KV.get("state");
    console.log("Stored state:", storedState);

    if (!storedState || storedState !== state) {
      console.log("Received state:", state);
      console.log("Expected state:", storedState);
      return c.json({ error: "Invalid or expired state" }, 400);
    }

    const storedCodeVerifire = await c.env.CODE_VERIFIER_KV.get("verifier");
    console.log("Stored code verifier:", storedCodeVerifire);

    if (!storedCodeVerifire) {
      return c.json({ error: "Invalid or expired verifier" }, 400);
    }

    // const tokenResponse = await fetch(`${TWITTER_API_BASE}/2/oauth2/token`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams({
    //     code,
    //     grant_type: "authorization_code",
    //     client_id: CLIENT_ID,
    //     redirect_uri: REDIRECT_URI,
    //     code_verifier: storedCodeVerifire,
    //     client_secret: CLIENT_SECRET,
    //   }),
    // });

    const tokenResponse = await loginWithOauth2({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      code: code,
      codeVerifier: storedCodeVerifire,
      redirectUri: REDIRECT_URI,
    });

    console.log(await tokenResponse);

    if (!tokenResponse.accessToken) {
      return c.json({ error: "Failed to fetch token" }, 500);
    }

    // const { NOTION_DATABASE_ID, NOTION_TOKEN } = c.env;
    // const currentDate = Date.now();
    // await storeTokenInNotion({
    //   AccessToken: tokenResponse.accessToken,
    //   refreshToken: tokenResponse.refreshToken,
    //   Name: "xClinet",
    //   date: currentDate.toString(),
    //   notion: {
    //     apiKey: NOTION_TOKEN,
    //     databaseId: NOTION_DATABASE_ID,
    //   },
    // });

    console.log("Callback route executed successfully", tokenResponse);
    return c.json(
      {
        accessToken: tokenResponse.accessToken,
        refreshtoken: tokenResponse.refreshToken,
      },
      200
    );
  } catch (error) {
    console.error("Error during callback handler execution:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

const healthCheckHandler = factory.createHandlers(async (c) => {
  return c.text("Hello Hono!");
});

export { xSetupHandler, healthCheckHandler, xCallabckHandler };
