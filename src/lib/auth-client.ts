import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { ac, user, admin, financeadmin, superadmin } from "./permissions";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001", // Backend API server where auth endpoints are
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
    inferAdditionalFields<typeof auth>(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

export type user = typeof authClient.$Infer.Session.user
export type session = typeof authClient.$Infer.Session.session