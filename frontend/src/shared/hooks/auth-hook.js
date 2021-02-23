import { useState, useCallback, useEffect } from "react";

let logOutTimer;

export const useAuth = () => {
  const [token, setToken] = useState(null);
  const [tokenExpirationDate, setTokenExpirationDate] = useState();
  const [userId, setUserId] = useState(null);

  const login = useCallback((uid, token, expirationDate) => {
    setToken(token);
    const tokenExpirationDate =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60); //if expiratonData isn't exist we create new one
    setTokenExpirationDate(tokenExpirationDate);
    localStorage.setItem(
      "userData",
      JSON.stringify({
        userId: uid,
        token: token,
        expiration: tokenExpirationDate.toISOString(),
      }) // toISOString() - used to convert important information to string, after can be converted to a date
    );
    setUserId(uid);
  }, []);
  /* we wrap "login" and "logout" functions with useCallback to avoid recreating this function and to avoid 
    infinite loops. Our dependencies of useCallback is an empty array for now. */
  const logout = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    setUserId(null);
    localStorage.removeItem("userData");
  }, []);

  // auto logout after 1 hour
  useEffect(() => {
    if (token && tokenExpirationDate) {
      let remainingTime = tokenExpirationDate.getTime() - new Date().getTime();
      logOutTimer = setTimeout(logout, remainingTime);
    } else {
      clearTimeout(logOutTimer);
    }
  }, [token, logout, tokenExpirationDate]);

  // checking if exist token in localStorage
  useEffect(() => {
    let storedData = JSON.parse(localStorage.getItem("userData"));
    if (
      storedData &&
      storedData.token &&
      new Date(storedData.expiration) > new Date()
    ) {
      login(
        storedData.userId,
        storedData.token,
        new Date(storedData.expiration) // saved expiration timestamp
      );
    }
  }, [login]);
  // this hook will run only once (after defaul rendering of all elements) when app start

  return { userId, token, login, logout };
};
