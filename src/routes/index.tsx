import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getUser();
    navigate({ to: storedUser ? "/dashboard" : "/auth" });
  }, [navigate]);

  return null;
}
