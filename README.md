# qr-subtle-ws

to ensure a websocket connection is authrorized for server level work, this module authenticates it against the node.js console.

1. on a new websocket connection, the server prints a qrcode to the console
2. the user is told to either scan it or copy it to their clipboard
    ( this ensures they have physical access to the ssh session 
      that started the server )
3. they then paste this into the browser (or scan it)
4. the browser sends the code back to the server and this authenticates the connnection
5. 