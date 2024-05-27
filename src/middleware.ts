import { createFactory } from "hono/factory";
import { generateCodeChallenge, generateCodeVerifier } from "./helper/utils";
import { generateOAuth2AuthLink } from "./twitter";
import { storeTokenInNotion } from "./notion";

const factory = createFactory();

const xSetupHandler = factory.createHandlers(async (c) => {
  try {
    const verifier: string = generateCodeVerifier();
    const state: string = crypto.randomUUID();
    const challenge = await generateCodeChallenge(verifier);

    const { REDIRECT_URI, CLIENT_ID, codeVerifire_kv, state_kv } = c.env;
    const { url } = await generateOAuth2AuthLink({
      callbackUrl: REDIRECT_URI,
      state: state,
      codeChallenge: challenge,
      code_challenge_method: "S256",
      scope: "tweet.read users.read follows.read follows.write",
      clientId: CLIENT_ID,
    });

    // Save verifier and state in KV storage
    console.log("storing kv values");
    let resCode = await codeVerifire_kv.put("verifier", `${verifier}`);
    let resState = await state_kv.put("state", `${state}`);
    if (!resCode || !resState) {
      console.log({
        resCode,
        resState,
      });
      console.log("failed to store kv values");
    } else {
      console.log("stored kv values");
    }
    // Retrieve and log stored values to verify
    const storedVerifier = await codeVerifire_kv.get("verifier");
    const storedState = await state_kv.get("state");
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
    const {
      TWITTER_API_BASE,
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI,
      state_kv,
      codeVerifire_kv,
    } = c.env;

    const storedState = await state_kv.get("state");
    console.log("Stored state:", storedState);

    if (!storedState || storedState !== state) {
      console.log("Received state:", state);
      console.log("Expected state:", storedState);
      return c.json({ error: "Invalid or expired state" }, 400);
    }

    const storedCodeVerifire = await codeVerifire_kv.get("verifier");
    console.log("Stored code verifier:", storedCodeVerifire);

    if (!storedCodeVerifire) {
      return c.json({ error: "Invalid or expired verifier" }, 400);
    }

    const tokenResponse = await fetch(`${TWITTER_API_BASE}/2/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code_verifier: storedCodeVerifire,
      }),
    });

    if (!tokenResponse.ok) {
      return c.json({ error: "Failed to fetch token" }, 500);
    }

    const tokenData: any = await tokenResponse.json();
    await storeTokenInNotion(tokenData);

    console.log("Callback route executed successfully");
    return c.json(tokenData);
  } catch (error) {
    console.error("Error during callback handler execution:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

const healthCheckHandler = factory.createHandlers(async (c) => {
  return c.text("Hello Hono!");
});

export { xSetupHandler, healthCheckHandler, xCallabckHandler };
