class Connection {
  constructor() {
    this.peer = new Peer({
      config: {
        iceServers: [
          { url: "stun:stun.l.google.com:19302" }, // 谷歌公共STUN服务器
          { url: "turn:homeo@turn.bistri.com:80", credential: "homeo" },
        ],
      },
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
