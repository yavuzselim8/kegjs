import path, { dirname } from "node:path";
import { Eta } from "eta";
import { fileURLToPath } from 'node:url';

// Get the filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const eta = new Eta({ views: path.join(__dirname, "../templates") });
