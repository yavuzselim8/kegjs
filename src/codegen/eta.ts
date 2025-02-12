import path from "node:path";
import { Eta } from "eta";

export const eta = new Eta({ views: path.join(__dirname, "../templates") });
