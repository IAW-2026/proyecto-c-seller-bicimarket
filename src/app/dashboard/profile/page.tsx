import { currentUser } from "@clerk/nextjs/server";
import { ProfileTab } from "../_components/profile-tab";

export default async function ProfilePage() {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.admin === true;
  return <ProfileTab isAdmin={isAdmin} />;
}
