import React, { useRef, useEffect, useState } from "react";
import { AiOutlineSend, AiOutlineClose } from "react-icons/ai";
import { RxCross2 } from "react-icons/rx";
import { CiFaceSmile } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import {
  setChatSelected,
  setMessages,
  setSomeoneTyping,
} from "../../slices/chatSlice";
import { socket } from "../../App";
import { toast } from "react-toastify";
import { send_message } from "../../services";
import Picker from "@emoji-mart/react";

export default function ChatCard() {
  const dispatch = useDispatch();
  const typingOn = useSelector((state: any) => state.Chat.typing);
  const TyperID = useSelector((state: any) => state.Chat.typerID);
  const [typing, setTyping] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [sendMessage, setSendMessage] = useState("");
  const user = useSelector((state: any) => state.User.user);
  const receiver = useSelector((state: any) => state.Chat.receiverSelected);
  const messages = useSelector((state: any) => state.Chat.messages);
  const theme = useSelector((state: any) => state.User.themeLight);
  const token = useSelector((state: any) => state.User.token);
  const [showEmojis, setShowEmojis] = useState(false);

  useEffect(() => {
    if (
      TyperID?.receiverId === user?._id &&
      TyperID?.senderId !== user?._id &&
      typingOn &&
      receiver?._id === TyperID?.senderId
    ) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  }, [TyperID, typingOn, user, receiver, sendMessage]);

  useEffect(() => {
    dispatch(setSomeoneTyping(sendMessage !== ""));
  }, [sendMessage, dispatch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sendMessage || !user || !receiver)
      return toast.error("Please type something");

    const messageData = {
      message: sendMessage,
      senderId: user?._id,
      receiverId: receiver?._id,
    };

    socket.emit("sendMsg", messageData);

    const res = await send_message(messageData, token);
    if (res?.success) {
      toast.success(res?.message);
    } else {
      toast.error(res?.message);
    }

    setSendMessage("");
    setShowEmojis(false);
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const messageHandler = (data: any) => {
      dispatch(setMessages(data));
    };

    socket.on("sendMsg", messageHandler);
    return () => {
      socket.off("sendMsg", messageHandler);
    };
  }, [dispatch]);

  const handleEmojiSelect = (emoji: any) => {
    setSendMessage((prevMessage) => prevMessage + emoji.native);
  };

  const handleClickEmoji = () => {
    setShowEmojis(!showEmojis);
  };

  return (
    <>
      {/* Chat Header */}
      <div
        className={`w-full h-20 flex items-center justify-between ${
          theme === "on" ? "bg-white" : "bg-slate-600"
        } text-center`}
      >
        <div className="flex">
          <div className="avatar mx-4 placeholder">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
              <span className="text-xs">{receiver?.name?.substring(0, 2)}</span>
            </div>
          </div>
          <div className="flex flex-col text-left py-2">
            <h1
              className={`${
                theme === "on" ? "text-black" : "text-white/90"
              } font-semibold tracking-widest text-sm uppercase`}
            >
              {receiver?.name}
            </h1>
            {typing && (
              <p
                className={`text-xs ${
                  theme === "on" ? "text-black" : "text-white/90"
                } tracking-widest font-semibold`}
              >
                Typing...
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(setChatSelected(false))}
          className={`${
            theme === "on" ? "text-black" : "text-white/90"
          } mx-4`}
        >
          <RxCross2 className="text-2xl" />
        </button>
      </div>

      {/* Message Display */}
      <div
        ref={messageContainerRef}
        className={`w-full ${
          theme === "on" ? "bg-white" : "bg-slate-600"
        } h-full px-4 py-2 overflow-y-auto`}
      >
        {messages.map((message: any, i: number) => {
          const isSender = message.receiver === user?._id;
          const avatarText = isSender ? "Y" : "O";
          const chatClass = isSender ? "chat-start" : "chat-end";
          return (
            <div key={i} className={`chat ${chatClass}`}>
              <div className="avatar chat-image mx-4 placeholder">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                  <span className="text-xs">{avatarText}</span>
                </div>
              </div>
              <div className="chat-bubble">{message.message}</div>
            </div>
          );
        })}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSendMessage}
        className={`h-20 ${
          theme === "on" ? "bg-white" : "bg-slate-600"
        } flex items-center justify-start px-4 relative`}
      >
        <input
          value={sendMessage}
          onChange={(e) => setSendMessage(e.target.value)}
          type="text"
          placeholder="Type here"
          className={`input ${
            theme === "on" ? "bg-white text-black" : "bg-slate-600 text-white"
          } input-bordered w-full max-w-full`}
        />
        {showEmojis ? (
          <button
            type="button"
            onClick={() => setShowEmojis(false)}
            className="btn btn-circle btn-light mx-3"
          >
            <AiOutlineClose />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClickEmoji}
            className="btn btn-circle btn-warning mx-3"
          >
            <CiFaceSmile className="text-xl" />
          </button>
        )}
        <button type="submit" className="btn btn-circle btn-primary mx-3">
          <AiOutlineSend className="text-xl" />
        </button>

        {showEmojis && (
          <div className="absolute bottom-20 left-4 z-50">
            <Picker onEmojiSelect={handleEmojiSelect} theme="dark" />
          </div>
        )}
      </form>
    </>
  );
}