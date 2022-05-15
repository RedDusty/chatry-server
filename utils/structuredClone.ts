import { deserialize, serialize } from "v8";

function structuredClone<T>(obj: T) {
  return deserialize(serialize(obj)) as T;
};

export default structuredClone;
