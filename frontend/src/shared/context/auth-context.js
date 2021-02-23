import { createContext } from "react";

export const AuthContext = createContext({
  // all this properties will be assigned in App.js
  isLoggedIn: false,
  token: null,
  userId: null,
  login: () => {},
  logout: () => {},
});
