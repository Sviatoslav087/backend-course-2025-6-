const swaggerJsdoc = require("swagger-jsdoc");

module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory API",
      version: "1.0.0",
      description: "Inventory Service Documentation"
    }
  },
  apis: ["./main.js"]
});
