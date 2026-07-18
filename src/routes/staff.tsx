import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff — EduPulse" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: () => { throw redirect({ to: "/auth" }); },
  component: () => null,
});
