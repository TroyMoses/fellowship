import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDatabaseSafe } from "./mongodb";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Please add Google OAuth credentials to .env.local");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Please add NEXTAUTH_SECRET to .env.local");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/drive.file",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signIn({ user, account, profile }) {
      console.log("[v0] SignIn callback", { email: user.email });

      if (account?.provider === "google") {
        try {
          const db = await getDatabaseSafe();

          // If MongoDB is unavailable, allow signin but log warning
          if (!db) {
            console.warn(
              "[v0] MongoDB unavailable, allowing signin without database save"
            );
            return true;
          }

          const usersCollection = db.collection("users");
          const accountsCollection = db.collection("accounts");

          // Check if user exists
          const existingUser = await usersCollection.findOne({
            email: user.email,
          });

          if (!existingUser) {
            const preAssignedAdmin = await usersCollection.findOne({
              email: user.email,
              role: "admin",
            });

            if (preAssignedAdmin) {
              // Update the pre-assigned admin record with full user info
              await usersCollection.updateOne(
                { email: user.email },
                {
                  $set: {
                    name: user.name,
                    image: user.image,
                    emailVerified: new Date(),
                    updatedAt: new Date(),
                  },
                }
              );
              console.log("[v0] Updated pre-assigned admin user", {
                email: user.email,
              });
            } else {
              // Create new user without role
              const newUser = {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              const result = await usersCollection.insertOne(newUser);
              console.log("[v0] Created new user", {
                userId: result.insertedId,
              });
            }

            // Save account info
            const userId =
              preAssignedAdmin?._id ||
              (await usersCollection.findOne({ email: user.email }))?._id;
            if (userId) {
              await accountsCollection.insertOne({
                userId: userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          } else {
            // Update existing user
            await usersCollection.updateOne(
              { email: user.email },
              {
                $set: {
                  name: user.name,
                  image: user.image,
                  updatedAt: new Date(),
                },
              }
            );

            // Update or create account
            await accountsCollection.updateOne(
              {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
              {
                $set: {
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  refresh_token: account.refresh_token,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  updatedAt: new Date(),
                },
              },
              { upsert: true }
            );

            console.log("[v0] Updated existing user", { email: user.email });
          }

          return true;
        } catch (error) {
          console.error("[v0] Error in signIn callback:", error);
          console.warn("[v0] Allowing signin despite database error");
          return true;
        }
      }

      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        try {
          const db = await getDatabaseSafe();

          if (db) {
            const usersCollection = db.collection("users");
            const dbUser = await usersCollection.findOne({ email: user.email });

            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role || null;
              token.institutionId = dbUser.institutionId?.toString() || null;

              if (dbUser.institutionId) {
                const institutionsCollection = db.collection("institutions");
                const institution = await institutionsCollection.findOne({
                  _id: dbUser.institutionId,
                });
                token.approvalStatus = institution?.status || null;
                console.log("[v0] JWT token created with approval status", {
                  role: token.role,
                  approvalStatus: token.approvalStatus,
                });
              } else {
                token.approvalStatus = null;
              }

              console.log("[v0] JWT token created", {
                role: token.role,
                hasInstitution: !!token.institutionId,
              });
            } else {
              token.id = user.email;
              token.role = null;
              token.institutionId = null;
              token.approvalStatus = null;
              console.log(
                "[v0] JWT token created with defaults (user not in DB)"
              );
            }
          } else {
            token.id = user.email;
            token.role = null;
            token.institutionId = null;
            token.approvalStatus = null;
            console.log(
              "[v0] JWT token created with defaults (MongoDB unavailable)"
            );
          }
        } catch (error) {
          console.error("[v0] Error fetching user in JWT callback:", error);
          token.id = user.email;
          token.role = null;
          token.institutionId = null;
          token.approvalStatus = null;
        }
      }

      if (trigger === "update" && token.email) {
        try {
          const db = await getDatabaseSafe();

          if (db) {
            const usersCollection = db.collection("users");
            const dbUser = await usersCollection.findOne({
              email: token.email,
            });

            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role || null;
              token.institutionId = dbUser.institutionId?.toString() || null;

              if (dbUser.institutionId) {
                const institutionsCollection = db.collection("institutions");
                const institution = await institutionsCollection.findOne({
                  _id: dbUser.institutionId,
                });
                token.approvalStatus = institution?.status || null;
              } else {
                token.approvalStatus = null;
              }

              console.log("[v0] JWT token updated from database", {
                role: token.role,
                hasInstitution: !!token.institutionId,
                approvalStatus: token.approvalStatus,
              });
            }
          }
        } catch (error) {
          console.error("[v0] Error updating JWT token:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-expect-error - Role
        session.user.role = token.role as string | null;
        session.user.institutionId = token.institutionId as string | null;
        // @ts-expect-error - Approval status
        session.user.approvalStatus = token.approvalStatus as string | null;

        console.log("[v0] Session created", {
          role: session.user.role,
          approvalStatus: session.user.approvalStatus,
        });
      }
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async redirect({ url, baseUrl }) {
      console.log("[v0] Redirect callback", { url, baseUrl });

      // Always redirect to dashboard after signin, middleware will handle role-based routing
      if (url.includes("/auth/signin") || url.includes("/api/auth/signin")) {
        return `${baseUrl}/dashboard`;
      }

      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
