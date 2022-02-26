import { MessageFileType } from "@typings/Messenger";

const checkFiles = (files: MessageFileType[] | undefined) => {
  if (files) {
    let isError = false;
    files.every((file) => {
      if (isError) return false;
      if (typeof file === "object") {
        if ((file as File).size > 8388608) {
          isError = true;
        }
      } else {
        return true;
      }
    });

    return !isError;
  } else return true;
};

export default checkFiles;
