import { io } from "index";
import { friendRemoveUser } from "./friendRemoveUser";
import { friendAccept } from "./friendAccept";
import { friendDecline } from "./friendRequestDecline";
import { friendRequestSend } from "./friendRequestSend";

type requestTypeType = "add" | "remove" | "accept" | "decline";

const friendRequest = (data: any) => {
  const requestType = data.type as requestTypeType;
  const senderUID = data.senderUID as string;
  const receiverUID = data.receiverUID as string;

  if (requestType && senderUID && receiverUID) {
    switch (requestType) {
      case "add":
        friendRequestSend(io, senderUID, receiverUID);
        break;
      case "accept":
        friendAccept(io, senderUID, receiverUID);
        break;
      case "decline":
        friendDecline(io, senderUID, receiverUID);
        break;
      case "remove":
        friendRemoveUser(io, senderUID, receiverUID);
        break;
      default:
        break;
    }
  }
};

export default friendRequest;
