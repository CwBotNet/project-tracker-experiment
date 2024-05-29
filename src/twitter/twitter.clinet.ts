import { getBasicAuthHeader } from "../helper/utils";

/**
 * Generates an OAuth2 authorization link for Twitter.
 * @param callbackUrl The callback URL to redirect to after authorization.
 * @param state The state parameter for CSRF protection.
 * @param codeChallenge The code challenge for PKCE (Proof Key for Code Exchange).
 * @param code_challenge_method The method used to generate the codeChallenge.
 * @param scope The scope of the authorization.
 * @param clientId The client ID for the Twitter API.
 * @returns The authorization URL.
 * Official Doc : https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
 */
async function generateOAuth2AuthLink({
  callbackUrl,
  state,
  codeChallenge,
  code_challenge_method,
  scope,
  clientId,
}: {
  callbackUrl: string;
  state: string;
  codeChallenge: string;
  code_challenge_method: string;
  scope: string[] | string;
  clientId: string;
}) {
  const finalScope = Array.isArray(scope) ? scope.join(" ") : scope;

  const url = new URL(`https://twitter.com/i/oauth2/authorize`);

  url.searchParams.append("response_type", "code");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", callbackUrl);
  url.searchParams.append("scope", finalScope);
  url.searchParams.append("state", state);
  url.searchParams.append("code_challenge", codeChallenge);
  url.searchParams.append("code_challenge_method", code_challenge_method);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  console.log("------generateOAuth2Link------");
  console.log(response);
  console.log("------------------------------");

  const result = {
    url: response.url,
  };
  return result;
}

/**
 * Logs in the user with OAuth2 for Twitter and gives a access token.
 * @param code The code returned from the OAuth2 authorization.
 * @param codeVerifier The code verifier for PKCE.
 * @param redirectUri The redirect URI used in the OAuth2 authorization.
 * @param clientId The client ID for the Twitter API.
 * @param clientSecret The client secret for the Twitter API.
 * @returns The access token and refresh token for the user.
 *
 * Official Doc : https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
 */
async function loginWithOauth2({
  code,
  codeVerifier,
  redirectUri,
  clientId,
  clientSecret,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
  const grantType = "authorization_code";
  const url = new URL("https://api.twitter.com/2/oauth2/token");
  const params = {
    code,
    grant_type: grantType,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_secret: clientSecret,
  };

  const body = new URLSearchParams(params);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const responseDate = (await response.json()) as any;
  const result = {
    accessToken: responseDate.access_token,
    refreshToken: responseDate.refresh_token,
  };
  return { result, response };
}

interface AccessToken {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}
async function getAccessToken({
  code,
  clientId,
  codeVerifier,
  redirectUri,
  clientSecret,
}: AccessToken) {
  const url = "https://api.twitter.com/2/oauth2/token";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: getBasicAuthHeader({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  };
  const body = {
    code: code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_secret: clientSecret,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      const errorResponse: any = await response.json();
      console.error("Error response: ", errorResponse);
      throw new Error(
        `API Error: ${errorResponse.error_description || response.statusText}`
      );
    }

    const ContentType = response.headers.get("Content-Type");
    let tokenData: any;
    if (ContentType === "application/json") {
      tokenData = await response.json();
    } else {
      tokenData = await response.text();
    }

    console.log(tokenData);
    return tokenData;
  } catch (error: any) {
    console.error("Failed to fetch token:", error.message);
  }
}

/**
 * Refreshes the OAuth2 token for Twitter.
 * @param refreshToken The refresh token for the user.
 * @param clientId The client ID for the Twitter API.
 * @returns The new access token and refresh token.
 *
 * Official Doc : https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
 */
async function refreshOAuth2Token({
  refreshToken,
  clientId,
}: {
  refreshToken: string;
  clientId: string;
}) {
  const grantType = "refresh_token";
  const url = new URL("https://api.twitter.com/2/oauth2/token");
  const params = {
    refresh_token: refreshToken,
    grant_type: grantType,
    client_id: clientId,
  };
  const body = new URLSearchParams(params);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const responseData = (await response.json()) as any;
  const result = {
    accessToken: responseData.access_token,
    refreshToken: responseData.refresh_token,
  };
  return result;
}

/**
 * Tweets a message to Twitter.
 * @param tweet The tweet message.
 * @param accessToken The access token for the user.
 * @returns The response from the Twitter API.
 *
 * Official Doc : https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
 */
async function tweet({
  tweet,
  accessToken,
}: {
  tweet: string;
  accessToken: string;
}) {
  const url = new URL("https://api.twitter.com/2/tweets");
  const params = {
    text: tweet,
  };
  const body = JSON.stringify(params);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body,
  });
  const responseData = (await response.json()) as any;
  return responseData;
}

// get x Tweet by post id

interface Xpost {
  tweetId: string;
  accessToken: string;
}
async function getXtweet(post: Xpost) {
  const { tweetId, accessToken } = post;
  const getTweetEndPoint = "https://api.twitter.com/2/tweets?ids=";

  const params = {
    ids: `${tweetId}`,
    "tweet.fields": "lang,author_id",
    "user.fields": "created_at",
  };

  try {
    // const response = await fetch(getTweetEndPoint, {
    //   method: "GET",
    //   headers: {
    //     "Content-type": "application/json",
    //     Authorization: "Bearer " + accessToken,
    //   },
    //   body: JSON.stringify(params),
    // });

    const response = await fetch(`${getTweetEndPoint}${tweetId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    if (!response) {
      console.log("post fetch error");
    }
    const result: any = response.json();
    return result;
  } catch (error: any) {
    console.error("Failed to fetch post:", error.message);
  }
}
async function postXtweet() {}
export {
  generateOAuth2AuthLink,
  loginWithOauth2,
  refreshOAuth2Token,
  tweet,
  getAccessToken,
  getXtweet,
};
