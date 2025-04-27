import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PoloEnrollmentsRedirectPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to the existing polo enrollments page
    navigate("/admin/enrollments/polo-list");
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-4 text-muted-foreground">Redirecionando para matrículas do polo...</p>
    </div>
  );
} 