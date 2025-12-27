const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// إعداد رفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

if (!fs.existsSync("public/uploads")) fs.mkdirSync("public/uploads");

// مسار رفع الصورة
app.post("/upload", upload.single("image"), (req, res) => {
  res.json({ url: "/uploads/" + req.file.filename });
});

// حفظ الرسائل مؤقتًا
let messages = [];

io.on("connection", (socket) => {
  console.log("💬 مستخدم متصل");

  // إرسال آخر الرسائل عند دخول المستخدم
  socket.emit("chat history", messages);

  socket.on("chat message", (data) => {
    messages.push(data);
    if (messages.length > 100) messages.shift(); // حفظ آخر 100 رسالة فقط
    io.emit("chat message", data);
  });

  socket.on("typing", (user) => {
    socket.broadcast.emit("typing", user);
  });

  socket.on("disconnect", () => console.log("❌ مستخدم فصل الاتصال"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`💻 السيرفر يعمل على المنفذ ${PORT}`));
