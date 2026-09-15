const env = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`IT Support Portal API running on http://localhost:${env.PORT}${env.API_PREFIX}`);
});
