import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://keycloak:8080";
const REALM = process.env.KEYCLOAK_REALM || "restaurant-realm";

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

  const userId = await getUserIdByEmail(email, adminToken);
  const userRole = await getRole(adminToken, "client");
  await assignRoleToUser(userId, userRole, adminToken);
}

async function getUserIdByEmail(email, token) {
  const res = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${email}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data[0]?.id;
}

async function getRole(token, roleName) {
  const res = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${roleName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

async function assignRoleToUser(userId, role, token) {
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`,
    [role],
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function updateKeycloakUser(currentEmail, { email, name, password }) {
  const adminToken = await getAdminToken();
  const userId = await getUserIdByEmail(currentEmail, adminToken);

  if (!userId) throw new Error('User not found in Keycloak');

  await axios.put(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`,
    { 
      firstName: name,
      email: email //Actualizar usuario
    },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  await axios.put(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/reset-password`,
    { type: 'password', value: password, temporary: false },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function deleteKeycloakUser(email) {
  const adminToken = await getAdminToken();
  const userId = await getUserIdByEmail(email, adminToken);
  
  if (!userId) throw new Error('User not found in Keycloak');

  await axios.delete(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
}