const checkFiles = (files: File[] | undefined) => {
  if (files) {
    let isError = false;
    files.every((file) => {
      if (isError) return false;
      if (file.size > 4194304) {
        isError = true;
      }
    });

    if (isError) return false;
    return true;
  } else return true;
};

export default checkFiles;
