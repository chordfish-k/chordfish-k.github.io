function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split("&");
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
}

// 页面加载时自动填充URL参数
window.onload = function () {
  const params = getUrlParams();
  if (params.other) {
    document.getElementById("otherPeerId").value = params.other;
  }
  initCanvas(); // 初始化画板功能
};

// 初始化消息管理器
const connection = new Connection();
connection.onGetPeerIdSucceed = (id) => handleOnGetPeerIdSucceed(id);
connection.onGetPeerIdError = (err) => handleOnGetPeerIdError(err);
connection.onReceiveMessage = (data) => handleOnMessage(data);
connection.onConnectSucceed = (conn) => handleOnConnectSucceed(conn);
connection.onConnecting = (conn) => handleOnConnecting(conn);
connection.onConnectError = (err) => handleOnConnectError(err);
connection.onClose = () => handleOnClose();

function connect() {
  const otherPeerId = document.getElementById("otherPeerId").value;
  connection.connect(otherPeerId);
}

function buildChatMessage(msg) {
  return {
    type: "chat",
    msg: msg,
  };
}

function setStatu(statu) {
  const connectionStatus = document.getElementById("connectionStatus");
  connectionStatus.textContent = statu;
}

function send() {
  const message = document.getElementById("chatInput").value;
  connection.send(buildChatMessage(message));
  displayMessage("你", message);
  document.getElementById("chatInput").value = "";
}

function handleOnGetPeerIdSucceed(id) {
  document.getElementById("peerId").innerText = id;
  document.getElementById("connectBtn").disabled = false;
}

function handleOnGetPeerIdError(err) {
  console.error("Peer error:", err);
  alert("出现错误: " + err.message);
}

function handleOnConnectError(err) {
  console.error("Connection error:", err);
  alert("连接错误: " + err.message);
  setStatu("连接失败");
}

function handleOnConnectSucceed(conn) {
  console.log("Connected to: ", conn);
  setStatu("连接成功");
  document.getElementById("otherPeerId").value = conn.peer;
}

function handleOnConnecting(conn) {
  console.log("Connecting to: ", conn);
  setStatu("连接中");
}

function handleOnClose() {
  setStatu("连接已断开");
}

class DrawStatus {
  constructor() {
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
  }
}

var hostDrawStatus = new DrawStatus();
var guestDrawStatus = new DrawStatus();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// 绘制函数
function beginDraw(drawStatus, x, y) {
  if (!connection.isConnected()) {
    alert("请先连接对方");
    return;
  }
  drawStatus.isDrawing = true;
  [drawStatus.lastX, drawStatus.lastY] = [x, y];
}

function draw(drawStatus, x, y) {
  if (!drawStatus.isDrawing) return;

  ctx.strokeStyle = "#000000"; // 黑色画笔
  ctx.lineWidth = 2; // 画笔宽度
  ctx.lineCap = "round"; // 圆形笔触
  ctx.lineJoin = "round"; // 圆形拐角

  ctx.beginPath();
  ctx.moveTo(drawStatus.lastX, drawStatus.lastY); // 从上次位置开始

  ctx.lineTo(x, y); // 绘制到当前位置
  ctx.stroke(); // 执行绘制

  // 更新上次位置
  [drawStatus.lastX, drawStatus.lastY] = [x, y];
}

function endDraw(drawStatus) {
  drawStatus.isDrawing = false;
}

// 添加画板功能
// 添加获取触摸坐标的辅助函数
function getTouchPos(canvas, touchEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top
  };
}

// 修改initCanvas函数，添加触摸事件处理
function initCanvas() {
  // 设置canvas尺寸以匹配显示大小
  function resizeCanvas() {
    const { offsetWidth, offsetHeight } = canvas;
    if (canvas.width !== offsetWidth || canvas.height !== offsetHeight) {
      canvas.width = offsetWidth;
      canvas.height = offsetHeight;
    }
  }

  // 监听窗口大小变化，调整canvas尺寸
  window.addEventListener("resize", resizeCanvas);
  // 初始调整尺寸
  resizeCanvas();

  // 鼠标按下时开始绘制
  canvas.addEventListener("mousedown", (e) => {
    beginDraw(hostDrawStatus, e.offsetX, e.offsetY);
    connection.send({ type: "begin_draw", x: e.offsetX, y: e.offsetY });
  });

  canvas.addEventListener("mousemove", (e) => {
    draw(hostDrawStatus, e.offsetX, e.offsetY);
    connection.send({ type: "draw", x: e.offsetX, y: e.offsetY });
  });

  canvas.addEventListener("mouseup", () => {
    endDraw(hostDrawStatus);
    connection.send({ type: "end_draw" });
  });
  canvas.addEventListener("mouseout", () => {
    endDraw(hostDrawStatus);
    connection.send({ type: "end_draw" });
  });

  // 添加触摸事件处理
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // 阻止默认触摸行为
    const pos = getTouchPos(canvas, e);
    beginDraw(hostDrawStatus, pos.x, pos.y);
    connection.send({ type: "begin_draw", x: pos.x, y: pos.y });
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // 阻止页面滚动
    const pos = getTouchPos(canvas, e);
    draw(hostDrawStatus, pos.x, pos.y);
    connection.send({ type: "draw", x: pos.x, y: pos.y });
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    endDraw(hostDrawStatus);
    connection.send({ type: "end_draw" });
  });

  canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    endDraw(hostDrawStatus);
    connection.send({ type: "end_draw" });
  });

  // 添加窗口大小变化防抖处理
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
      // 可选：重新绘制内容或发送画布状态
    }, 100); // 延迟100ms执行，避免频繁触发
  });
}

// 添加输入法弹出时的处理
window.addEventListener('resize', () => {
  // 当窗口高度变化超过100px时认为是输入法弹出
  if (Math.abs(window.innerHeight - window.visualViewport.height) > 100) {
    resizeCanvas();
  }
});

function handleOnMessage(data) {
  if (data.type == "begin_draw") {
    beginDraw(guestDrawStatus, data.x, data.y);
  } else if (data.type == "draw" && guestDrawStatus.isDrawing) {
    console.log("draw");
    draw(guestDrawStatus, data.x, data.y);
  } else if (data.type == "end_draw" && guestDrawStatus.isDrawing) {
    console.log("endDraw");
    endDraw(guestDrawStatus);
  }
}

function displayMessage(sender, message) {
  var chatBox = document.getElementById("chatBox");
  var messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}
