import { WebSocket, WebSocketServer } from "ws";

let inventorySocketServer = null;

const buildSocketMessage = (type, payload = {}) =>
  JSON.stringify({
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  });

export const attachInventorySocketServer = (server) => {
  if (inventorySocketServer) {
    return inventorySocketServer;
  }

  inventorySocketServer = new WebSocketServer({
    server,
    path: "/inventory-updates",
  });

  inventorySocketServer.on("connection", (socket) => {
    socket.send(buildSocketMessage("inventory:connected"));
  });

  return inventorySocketServer;
};

export const broadcastInventoryChange = (payload = {}) => {
  if (!inventorySocketServer) {
    return;
  }

  const message = buildSocketMessage("inventory:changed", payload);

  inventorySocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
