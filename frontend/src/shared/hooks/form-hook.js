import { useCallback, useReducer } from "react";

const formReducer = (state, action) => {
  switch (action.type) {
    case "INPUT_CHANGE":
      let formIsValid = true;
      for (const inputId in state.inputs) {
        if(!state.inputs[inputId]) continue;//to continue running of loop if it gets undefined property "name" when we use login form in component Auth 
        if (inputId === action.isValid) {
          formIsValid = formIsValid && action.isValid;
        } else {
          formIsValid = formIsValid && state.inputs[inputId].isValid;
        }
      }
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.inputId]: { value: action.value, isValid: action.isValid },
        },
        isValid: formIsValid,
      };
    case "SET_DATA":
      return {
        inputs: action.inputs,
        isValid: action.formIsValid,
      };
    default:
      return state;
  }
};

export const useForm = (initialInputs, initialFormValidaty) => {
  // "custom hook" - in the end are normal JavaScript functions though - never forget that!
  const [formState, dispatch] = useReducer(formReducer, {
    inputs: initialInputs,
    isValid: initialFormValidaty,
  });

  const inputHandler = useCallback((id, value, isValid) => {
    //to prevent re-rendering component we use -> useCallback that return a memoized version of the callback that only changes if one of the inputs has changed.
    dispatch({
      type: "INPUT_CHANGE",
      value: value,
      isValid: isValid,
      inputId: id,
    });
  }, []);

  const setFormData = useCallback((inputData, formValidaty) => {
    dispatch({
      type: "SET_DATA",
      inputs: inputData,
      formIsValid: formValidaty,
    });
  }, []);

  return [formState, inputHandler, setFormData];
};
