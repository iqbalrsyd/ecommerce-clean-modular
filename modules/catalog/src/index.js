import { buildCatalogRouter } from "./routes/catalog.js";
import * as catalogDomain from "./domain/catalog.js";

export default function catalogModule(ctx) {
  return {
    name: "catalog",
    version: "1.0.0",
    services: {
      listProducts: (args) => catalogDomain.listProducts(args, ctx),
      getProduct: (id) => catalogDomain.getProduct(id, ctx),
    },
    emits: ["product.review.created"],
    listens: [],
    routes: () => buildCatalogRouter(ctx),
  };
}
