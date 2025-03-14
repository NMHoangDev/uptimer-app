import pino from "pino";

export default pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true, // Màu sắc cho log
      translateTime: "HH:MM:ss", // Hiển thị thời gian dạng HH:MM:ss
      ignore: "pid,hostname", // Bỏ qua pid và hostname
      singleLine: true, // Hiển thị log trên một dòng
    },
  },
});
