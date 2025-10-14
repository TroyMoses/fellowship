import "next-auth";
import "next-auth/jwt";
import type { ObjectId } from "mongodb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "admin" | "fellow" | "root_admin" | null;
      institutionId?: string | null;
      approvalStatus?: "pending" | "approved" | "rejected" | null;
    };
  }

  interface User {
    role?: "admin" | "fellow" | "root_admin" | null;
    institutionId?: ObjectId | null;
    approvalStatus?: "pending" | "approved" | "rejected" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "fellow" | "root_admin" | null;
    institutionId?: string | null;
    approvalStatus?: "pending" | "approved" | "rejected" | null;
  }
}
