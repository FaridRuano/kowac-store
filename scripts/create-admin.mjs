import { readFile } from "node:fs/promises";
import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

async function loadLocalEnv() {
  const envFile = await readFile(".env.local", "utf8").catch(() => "");

  for (const line of envFile.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

await loadLocalEnv();

const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  throw new Error("MONGODB_URI is required.");
}

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["usuario", "admin"], default: "usuario", index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const email = (process.env.ADMIN_EMAIL || "admin@kowac.com").trim().toLowerCase();
const name = (process.env.ADMIN_NAME || "Administrador Kowac").trim();
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(10).toString("base64url");
const hashedPassword = await bcrypt.hash(password, 12);

await mongoose.connect(mongodbUri, { bufferCommands: false });

const existingUser = await User.findOne({ email }).select("+password");

if (existingUser) {
  existingUser.name = existingUser.name || name;
  existingUser.password = hashedPassword;
  existingUser.role = "admin";
  existingUser.isActive = true;
  await existingUser.save();
} else {
  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isActive: true,
  });
}

await mongoose.disconnect();

console.log("Admin listo:");
console.log(`Email: ${email}`);
console.log(`Password temporal: ${password}`);
