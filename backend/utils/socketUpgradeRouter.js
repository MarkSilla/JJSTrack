const socketRouteRegistry = new WeakMap();

const resolveRequestPathname = (request) => {
  try {
    const requestUrl = new URL(
      request.url || '',
      `http://${request.headers.host || 'localhost'}`
    );
    return requestUrl.pathname || '';
  } catch (error) {
    return '';
  }
};

export const registerSocketUpgradeRoute = ({ server, path, socketServer }) => {
  if (!server || !path || !socketServer) {
    return;
  }

  let registryEntry = socketRouteRegistry.get(server);

  if (!registryEntry) {
    const routes = new Map();

    server.on('upgrade', (request, socket, head) => {
      const pathname = resolveRequestPathname(request);
      const targetSocketServer = routes.get(pathname);

      if (!targetSocketServer) {
        socket.destroy();
        return;
      }

      targetSocketServer.handleUpgrade(request, socket, head, (clientSocket) => {
        targetSocketServer.emit('connection', clientSocket, request);
      });
    });

    registryEntry = { routes };
    socketRouteRegistry.set(server, registryEntry);
  }

  registryEntry.routes.set(path, socketServer);
};
