import { redirect } from "next/navigation";

// Taska's UI lives at /taska. managa opens installed apps at the root of their
// allocated port, so send visitors straight to the task lists instead of the
// old app-manager landing page.
export default function Home() {
  redirect("/taska");
}
