import { Default } from "../../src/decorators/default";
import { Provider } from "../../src/decorators/provider";
import { Qualifier } from "../../src/decorators/qualifier";
import { Service } from "../../src/decorators/service";
import {Transient} from "../../src/decorators/transient";

export interface IUserService {
    getName(): string;
}

@Default()
@Service()
export class UserService implements IUserService {
    constructor(private guestService: GuestService) {}

    public getName() {
        return "UserService";
    }

    public getGuestServiceName() {
        return this.guestService.getName();
    }
}

@Transient()
@Service()
export class UserService2 implements IUserService {
    public getName() {
        return "UserService2";
    }
}

@Service()
export class GuestService {
    public getName() {
        return "GuestService";
    }
}

type RedisConfig = {
    host: string;
    port: number;
    password: string;
}


@Provider()
export class RedisConfiguration {
    @Qualifier("FalseDbConfig")
    @Default()
    static provideRedisConfig(): RedisConfig {
        return {
            host: "localhost",
            port: 6379,
            password: "password"
        };
    }

    static provideRedisConfig2() {
        return {};
    }

    @Default()
    static provideRedisConfig3(
    ) {
        return {};
    }

    static provideDbConfig() {
        return {};
    }

    // static provideRedisConfig4(redisConfig: RedisConfig3): RedisConfig2 {
    //     return {}
    // }

    nonStaticMethod() {}

    static staticMethodWithNoReturn() {}
}
