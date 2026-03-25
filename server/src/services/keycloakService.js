import axios from "axios";

const KEYCLOAK_URL = "http://localhost:8080";
const REALM = "restaurant-realm";

async function getAdminToken() {
  const response = await axios.post(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    new URLSearchParams({
      username: "admin",
      password: "admin123",
      grant_type: "password",
      client_id: "admin-cli",
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return response.data.access_token;
}

export async function createKeycloakUser({ email, password, name }) {
  const adminToken = await getAdminToken();

  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
    {
      username: email,
      email,
      enabled: true,
      firstName: name,
      credentials: [
        {
          type: "password",
          value: password,
          temporary: false,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}