const fallbackUser = "admin";
const fallbackPass = "sspl@secure";

export function getCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || fallbackUser,
    password: process.env.ADMIN_PASSWORD || fallbackPass,
  };
}

export function credentialsAreValid(inputUser, inputPass) {
  if (!inputUser || !inputPass) return false;
  const { username, password } = getCredentials();
  return (
    inputUser.trim() === username.trim() &&
    inputPass === password
  );
}

function base64Encode(raw) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw, "utf-8").toString("base64");
  }
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(raw)));
  }
  throw new Error("No base64 encoder available in this environment.");
}

export function computeSessionToken() {
  const { username, password } = getCredentials();
  return base64Encode(`${username}:${password}`);
}
