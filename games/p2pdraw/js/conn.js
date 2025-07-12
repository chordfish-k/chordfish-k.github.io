class Connection {
  constructor() {
    this.peer = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { 
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ],
      } /* Sample servers, please use appropriate ones */,
    });
    this.conn = null;
    this.onGetPeerIdSucceed = null;
    this.onGetPeerIdError = null;
    this.onConnectSucceed = null;
    this.onConnecting = null;
    this.onConnectError = null;
    this.onClose = null;
    this.onReceiveMessage = null;

    this.peer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      if (this.onGetPeerIdSucceed) {
        this.onGetPeerIdSucceed(id);
      }
    });

    this.peer.on("error", (err) => {
      console.error("Peer error:", err);
      if (this.onGetPeerIdError) {
        this.onGetPeerIdError(err);
      }
    });

    this.peer.on("connection", (conn_) => {
      this.conn = conn_;

      if (this.onConnecting) {
        this.onConnecting();
      }

      console.log("Connection: ", this.conn);

      this.conn.on("open", () => {
        if (this.onConnectSucceed) {
          this.onConnectSucceed(this.conn);
        }

        this.conn.on("data", (data) => {
          if (this.onReceiveMessage) {
            this.onReceiveMessage(data);
          }
        });

        this.conn.on("error", (err) => {
          console.error("Connection error:", err);
          if (this.onConnectError) {
            this.onConnectError(err);
          }
        });
      });

      this.conn.on("close", () => {
        if (this.onClose) {
          this.onClose();
        }
      });
    });
  }

  connect(otherPeerId) {
    if (otherPeerId) {
      this.conn = this.peer.connect(otherPeerId);
      if (this.onConnecting) {
        this.onConnecting();
      }

      this.conn.on("open", () => {
        if (this.onConnectSucceed) {
          this.onConnectSucceed(this.conn);
        }

        this.conn.on("data", (data) => {
          if (this.onReceiveMessage) {
            this.onReceiveMessage(data);
          }
        });

        this.conn.on("error", (err) => {
          console.error("Connection error:", err);
          if (this.onConnectError) {
            this.onConnectError(err);
          }
        });
      });

      this.conn.on("close", () => {
        if (this.onClose) {
          this.onClose();
        }
      });

      this.conn.on("error", (err) => {
        console.error("Connection error:", err);
        if (this.onConnectError) {
          this.onConnectError(err);
        }
      });
    }
  }

  isConnected() {
    return this.peer && this.peer.open && this.conn && this.conn.open;
  }

  send(message) {
    if (this.isConnected()) {
      this.conn.send(message);
    }
  }
}
