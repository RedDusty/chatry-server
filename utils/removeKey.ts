function removeKey(obj: any, key: string) {
  for (let prop in obj) {
    if (prop === key) delete obj[prop];
    else if (typeof obj[prop] === "object") removeKey(obj[prop], key);
  }

  return obj;
}

export default removeKey;
