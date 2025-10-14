import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL || "admin@fellowship.com";
const ROOT_ADMIN_NAME = process.env.ROOT_ADMIN_NAME || "Root Administrator";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function seedRootAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔌 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("fellowship_platform");
    const usersCollection = db.collection("users");

    // Check if root admin already exists
    const existingRootAdmin = await usersCollection.findOne({
      email: ROOT_ADMIN_EMAIL,
    });

    if (existingRootAdmin) {
      console.log("⚠️  Root admin already exists:", ROOT_ADMIN_EMAIL);

      // Update to ensure they have root_admin role
      if (existingRootAdmin.role !== "root_admin") {
        await usersCollection.updateOne(
          { email: ROOT_ADMIN_EMAIL },
          {
            $set: {
              role: "root_admin",
              updatedAt: new Date(),
            },
          }
        );
        console.log("✅ Updated existing user to root_admin role");
      } else {
        console.log("✅ Root admin role already set");
      }

      return;
    }

    // Create root admin user
    const rootAdmin = {
      email: ROOT_ADMIN_EMAIL,
      name: ROOT_ADMIN_NAME,
      role: "root_admin",
      cohortIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(rootAdmin);
    console.log("✅ Root admin created successfully!");
    console.log("📧 Email:", ROOT_ADMIN_EMAIL);
    console.log("👤 Name:", ROOT_ADMIN_NAME);
    console.log("🆔 User ID:", result.insertedId.toString());
    console.log(
      "\n⚠️  IMPORTANT: The root admin must sign in with Google using this email address."
    );
    console.log(
      "   Make sure to add this email to your Google OAuth allowed users if needed."
    );
  } catch (error) {
    console.error("❌ Error seeding root admin:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

seedRootAdmin();
