import { buildUserRouter } from "./routes/user.js";
import { registerUser, authenticateUser, getUserById } from "./domain/user.js";

export default function userModule(ctx) {
  return {
    name: "user",
    version: "1.0.0",
    services: {
      registerUser: (input) => registerUser(input, ctx),
      authenticateUser: (input) => authenticateUser(input, ctx),
      getUserById: (id) => getUserById(id, ctx),
    },
    emits: ["user.registered", "user.logged_in"],
    listens: [],
    routes: () => buildUserRouter(ctx),
  };
}
