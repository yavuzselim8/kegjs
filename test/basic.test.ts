import { describe, test, expect, mock } from "bun:test";
import { Keg } from 'kegjs/container/keg';
import type {GuestService, IUserService, UserService} from "./src/test-code";

describe("Basic DI operations should work", () => {

    test("should resolve correct instances", async () => {
        // Arrange
        const container = Keg.getInstance();

        // Act
        const defaultUserService = await container.resolveOne<IUserService>("UserService");
        const userService2 = await container.resolveOne<IUserService>("UserService2");

        // Assert
        expect(defaultUserService.getName()).toBe("UserService");
        expect(userService2.getName()).toBe("UserService2");
    });
});
