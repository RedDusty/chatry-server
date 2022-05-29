import { io } from "index";
import { friendRemoveUser } from "@handlers/friend/friendRemoveUser";
import { friendDecline } from "@handlers/friend/friendRequestDecline";
import { friendRequestAdd } from "@handlers/friend/friendRequestAdd";

type requestTypeType = "add" | "remove" | "decline";

const friendRequest = (data: any) => {
  const requestType = data.type as requestTypeType;
  const senderUID = data.senderUID as string;
  const receiverUID = data.receiverUID as string;

  if (senderUID === receiverUID) return;

  if (requestType && senderUID && receiverUID) {
    switch (requestType) {
      case "add":
        friendRequestAdd(io, senderUID, receiverUID);
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
