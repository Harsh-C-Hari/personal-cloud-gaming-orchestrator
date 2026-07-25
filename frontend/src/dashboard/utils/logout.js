import { clearToken } from "../../api/client.js";

export function logout() {
  clearToken();
  window.location.reload();
}
