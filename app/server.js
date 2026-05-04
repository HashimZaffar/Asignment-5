const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "v1";
const COLOR = process.env.APP_COLOR || "blue";

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Blue/Green Deployment Demo",
    version: VERSION,
    color: COLOR,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    version: VERSION
  });
});

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
  console.log(`Version: ${VERSION}`);
  console.log(`Color: ${COLOR}`);
});
