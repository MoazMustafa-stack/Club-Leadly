import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}

export function useIsOrganiser() {
  const { isOrganiser } = useContext(AuthContext);
  return isOrganiser;
}
