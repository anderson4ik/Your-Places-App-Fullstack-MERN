import React, { useRef, useState, useEffect } from "react";

import Button from "../FormElements/Button";
import "./ImageUpload.css";

const ImageUpload = (props) => {
  const [file, setFile] = useState();
  const [previewUrl, setPreviewUrl] = useState();
  const [isValid, setIsValid] = useState(false);

  const filePickerRef = useRef();
  // we use the hook useRef to establish connection to DOM element (input)
  // this hook, also help to variable to survive after re rendering

  // creating a previewUrl
  useEffect(() => {
    if (!file) return;

    const fileReader = new FileReader(); // API of browser, parse from binary data to readable format
    // Lets web applications asynchronously read the contents of files (or raw data buffers)
    // stored on the user's computer, using File or Blob objects to specify the file or data to read.
    fileReader.onload = () => {
      // The load event fires when a given resource has loaded.
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }, [file]);

  const pickedHandler = (event) => {
    let pickedFile;
    let fileIsValid = isValid;
    if (event.target.files && event.target.files.length === 1) {
      // input with type="file" has a property files, array of picked files
      pickedFile = event.target.files[0];
      setFile(pickedFile);
      setIsValid(true);
      fileIsValid = true;
    } else {
      setIsValid(false);
      fileIsValid = false;
    }

    props.onInput(props.id, pickedFile, fileIsValid);
  };

  const pickImageHandler = () => {
    filePickerRef.current.click();
    //click() - This method exists on this Dom note and it will open up that file picker
    // so we utilize the input element without seeing it.
  };

  return (
    <div className="form-control">
      <input
        id={props.id}
        ref={filePickerRef} // setting reference between dom element and function
        type="file"
        style={{ display: "none" }}
        accept=".jpg,.png,.jpeg"
        // attribute that gives us to pick only three extension of image
        onChange={pickedHandler}
      />
      <div className={`image-upload ${props.center && "center"}`}>
        <div className="image-upload__preview">
          {previewUrl && <img src={previewUrl} alt="Preview" />}
          {!previewUrl && <p>Please pick an image.</p>}
        </div>
        <Button type="button" onClick={pickImageHandler}>
          PICK IMAGE
        </Button>
      </div>
      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default ImageUpload;
