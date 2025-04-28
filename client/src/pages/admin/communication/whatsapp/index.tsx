import { useEffect } from "react";
import { useLocation } from "wouter";

export default function WhatsappRedirectPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to the existing whatsapp page
    navigate("/admin/comunicacao/whatsapp");
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-4 text-muted-foreground">Redirecionando para WhatsApp...</p>
    </div>
  );
} 