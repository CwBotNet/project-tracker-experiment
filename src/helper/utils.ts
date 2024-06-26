import { Buffer } from "buffer";
export async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

export function base64UrlEncode(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const generateCodeVerifier = () => {
  const array = new Uint32Array(56 / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
    ""
  );
};

export const generateCodeChallenge = async (verifier: string) => {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
};

export function getBasicAuthHeader({
  client_id,
  client_secret,
}: {
  client_id: string;
  client_secret: string;
}) {
  const credentials = `${client_id}:${client_secret}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}
