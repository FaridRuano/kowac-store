import { getServerSession } from "next-auth/next";

import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/next-auth";
import { isInternalRole, normalizeUserRole } from "@/lib/roles";
import User from "@/models/User";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  try {
    await connectDB();

    const user = await User.findOne({
      _id: userId,
      isActive: true,
    }).lean();

    if (!user) {
      return null;
    }

    const role = normalizeUserRole(user.role);

    return {
      customerId: user.customer?.toString() || null,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role,
      isInternal: isInternalRole(role),
    };
  } catch (error) {
    return null;
  }
}

export async function getCurrentInternalUser() {
  const user = await getCurrentUser();

  return user?.isInternal ? user : null;
}
