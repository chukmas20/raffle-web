import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard"); // the proxy sends signed-out visitors on to /login
}