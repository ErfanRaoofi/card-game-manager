/** ورود به اتاق — بعد از لاگین */
export interface JoinRoomPayload {
  roomId: string;
  token: string;
  hostToken?: string;
}

/** کاربر متصل به اتاق (میزبان یا بیننده) */
export interface RoomMember {
  userId: string;
  username: string;
  socketId: string | null;
}
