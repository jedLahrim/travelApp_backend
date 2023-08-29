// import * as dgram from "dgram";
// import { createScheduler } from "tesseract.js";
// import { Request } from "express";
// import { localStorage } from "../../routes/map/map.route";
// // Create a UDP server
// export const server = dgram.createSocket("udp4");
// // Create a UDP client
// export const client = dgram.createSocket("udp4");
// export function initDataGram() {
//   // Bind the server to a port
//   server.bind(3006, () => {
//     console.log("Server listening on port 3006");
//   });
//   // Listen for messages
//   server.on("message", (message, remote) => {
//     let data = JSON.parse(message.toString());
//     console.log(data);
//     console.log(
//       `Received message from client: ${remote.address}:${remote.port}: ${message}`
//     );
//     // Send the message back to the client
//     server.send(message, 3006, "localhost", (err) => {
//       console.log(`Sent message back to ${remote.address}:${remote.port}`);
//     });
//   });
//
//   // Send a message to the server
//   const data = { name: "hello", proxy: true };
//   const message = Buffer.from(JSON.stringify(data));
//
//   client.send(message, 3006, "localhost", (err) => {
//     console.log("Sent message to server");
//   });
//   server.on("greet", async (args) => {
//     console.log(args);
//     const value = localStorage.getItem("2");
//     console.log(value); // Output: value
//   });
//   client.on("greet", async (args) => {
//     console.log(args);
//   });
//   client.on("message", (msg, remote) => {
//     console.log(
//       `Received message from server: ${remote.address}:${remote.port}: ${message}`
//     );
//   });
// }
