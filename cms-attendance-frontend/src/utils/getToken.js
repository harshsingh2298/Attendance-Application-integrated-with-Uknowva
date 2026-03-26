export const getToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("vaultex_auth") || "{}");
    return auth.accessToken || auth.token || null;
  } catch {
    return null;
  }
};