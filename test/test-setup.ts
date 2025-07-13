import { beforeAll } from "bun:test";
import { initializeContainer } from "./src/generated/container.generated";

beforeAll(async () => {
    // global setup
    console.log("Initializing Keg container for tests...");
    initializeContainer();
});

// afterAll(async () => {
//     const container = Keg.getInstance();
//     container.disableTestMode();
// });