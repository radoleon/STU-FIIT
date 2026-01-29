/*
|--------------------------------------------------------------------------
| Websocket events
|--------------------------------------------------------------------------
|
| This file is dedicated for defining websocket namespaces and event handlers.
|
*/

import Ws from '@ioc:Ruby184/Socket.IO/Ws';

Ws.namespace('/ws')
  .connected('WsChannelsController.onConnect')
  .disconnected('WsChannelsController.onDisconnect')
  .on('join:sent', 'WsChannelsController.onChannelJoin')
  .on('invite:sent', 'WsChannelsController.onChannelInvite')
  .on('revoke:sent', 'WsChannelsController.onChannelRevoke')
  .on('kick:sent', 'WsChannelsController.onChannelKick')
  .on('quit:sent', 'WsChannelsController.onChannelQuit')
  .on('cancel:sent', 'WsChannelsController.onChannelCancel')
  .on('invite:accept', 'WsChannelsController.onInviteAccept')
  .on('invite:reject', 'WsChannelsController.onInviteReject')
  .on('message:join', 'MessagesController.onJoin')
  .on('message:send', 'MessagesController.onSend')
  .on('status:new', 'WsSettingsController.onStatusChange')
  .on('message:typing', 'MessagesController.onTyping');
