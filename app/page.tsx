import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import Planner from "./planner";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return <Planner user={user ? { name: user.displayName, email: user.email } : null} signInPath={chatGPTSignInPath("/")} signOutPath={chatGPTSignOutPath("/")} />;
}
