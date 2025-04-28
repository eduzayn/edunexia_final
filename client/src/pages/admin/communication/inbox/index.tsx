import { useEffect } from "react";
import { useLocation } from "wouter";

export default function InboxRedirectPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to the existing inbox page
    navigate("/admin/comunicacao/inbox");
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-4 text-muted-foreground">Redirecionando para caixa de entrada...</p>
    </div>
  );
} 