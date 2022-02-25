import crypto from "crypto";

const iv = crypto.randomBytes(16);

const algorithm = "aes-128-ctr";

type cryptDataType = {
  iv: string;
  content: string;
};

export const encryptData = (data: any, key: string) => {
  const cipher = crypto.createCipheriv(algorithm, key.slice(0, 16), iv);
  const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);

  return {
    iv: iv.toString("hex"),
    content: encryptedData.toString("hex"),
  } as cryptDataType;
};

export const decryptData = (hash: cryptDataType, key: string) => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key.slice(0, 16),
    Buffer.from(hash.iv, "hex")
  );
  const decryptedData = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decryptedData.toString();
};
