import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UsersRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/pessoas/usuarios", { replace: true });
  }, [navigate]);

  return null;
} 