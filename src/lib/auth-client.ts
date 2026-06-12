import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { ac, user, admin, financeadmin, superadmin } from "./permissions";
import type { auth } from './auth';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api/auth", // Backend API server where auth endpoints are
  plugins: [
    adminClient({
      ac,
      roles: {
        user,
        admin,
        financeadmin,
        superadmin,
      },
      adminRoles: ["admin", "financeadmin", "superadmin"],
    }),
    inferAdditionalFields<typeof auth>(), // ← adds biro_id, position, phone to the type
    passkeyClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;