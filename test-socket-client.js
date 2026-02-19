import io from "socket.io-client";

const SITE_URL = "http://localhost:3000";
const CHANNEL_ID = "cmlp4dgvd0001mguefj5wpcnp"; // From user logs

const socket = io(SITE_URL, {
  path: "/api/socket/io",
  addTrailingSlash: false,
});

console.log("Connecting to socket at", SITE_URL, "path:", "/api/socket/io");

socket.on("connect", () => {
  console.log("Connected to socket server! ID:", socket.id);
  console.log("Listening for typing events on channel:", CHANNEL_ID);
});

socket.on("disconnect", () => {
  console.log("Disconnected from socket server");
});

socket.on("connect_error", (err) => {
  console.log("Connection Error:", err.message);
});

const typingKey = `chat:${CHANNEL_ID}:typing`;
const messageKey = `chat:${CHANNEL_ID}:messages`;

socket.on(typingKey, (data) => {
  console.log("RECEIVED TYPING EVENT:", data);
});

socket.on(messageKey, (data) => {
  console.log("RECEIVED MESSAGE EVENT:", data.content ? data.content.substring(0, 50) + "..." : "No content");
});

socket.onAny((event) => {
  console.log(`[ANY] Event: ${event}`);
});
