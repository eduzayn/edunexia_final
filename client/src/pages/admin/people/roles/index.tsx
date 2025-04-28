import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RolesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/pessoas/roles", { replace: true });
  }, [navigate]);

  return null;
}