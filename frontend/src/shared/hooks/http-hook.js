import { useState, useCallback, useRef, useEffect } from "react";

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const activeHttpRequest = useRef([]);
  //useRef() - reference here is just a piece of data which will not change or in this
  //case which will not be reinitialize when this function runs again.

  const sendRequest = useCallback(
    // to avoid infinite loops, that can be created by function "sendRequest". We use "useCallback" hook!
    async (url, method = "GET", body = null, headers = {}) => {
      setIsLoading(true);
      const httpAbortCtrl = new AbortController(); // API supported in modern browsers
      // A controller object that allows you to abort one or more DOM requests as and when desired.
      activeHttpRequest.current.push(httpAbortCtrl);
      // useRef - always wraps the data you store in it in an object which has a 'current' property.
      // we don't save it in state, because we don't neeed to change the UI when we change the data.
      try {
        const response = await fetch(url, {
          method,
          body,
          headers,
          signal: httpAbortCtrl.signal,
          // it links the AbortController() to this fetch request
          // and now we can use this AbortController() to cancel this request
        });

        const responseData = await response.json();

        // if request complite, we need to remove abortControl of this specific request
        activeHttpRequest.current = activeHttpRequest.current.filter(
          (reqCtrl) => reqCtrl !== httpAbortCtrl
        );

        if (!response.ok) {
          throw new Error(responseData.message);
          // catch errors 400 or 500, because for fetch API it is not errors.
          // We send request and get response and it is not error technically.
        }

        setIsLoading(false);
        return responseData;
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  const clearError = () => {
    setError(null);
  };

  //
  useEffect(() => {
    // we use here useEffect() - to run some cleanup logic when a component on mounts
    activeHttpRequest.current.forEach((abortCtrl) => abortCtrl.abort());
  }, []);
  // my second argument is an empty array and the first argument is a function and therefore it is only runs when a component mounts.

  return { isLoading, error, sendRequest, clearError };
};
