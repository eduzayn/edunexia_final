import { useEffect } from "react";
import { useLocation } from "wouter";

export default function StudentsRedirectPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Temporary redirect for backwards compatibility
    // We're redirecting back to the English route structure
    navigate("/admin/people/students");
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-4 text-muted-foreground">Redirecting to students page...</p>
    </div>
  );
} 