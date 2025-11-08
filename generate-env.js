import fs from "fs";

// Path to your downloaded service account JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

const { project_id, client_email, private_key } = serviceAccount;

const envContent = `
# Firebase Admin SDK
FIREBASE_PROJECT_ID=${project_id}
FIREBASE_CLIENT_EMAIL=${client_email}
FIREBASE_PRIVATE_KEY="${private_key.replace(/\n/g, "\\n")}"
`;

fs.writeFileSync(".env.local", envContent.trim() + "\n");

console.log("✅ Generated .env.local successfully!");
