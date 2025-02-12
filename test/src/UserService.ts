import { Default } from "../../src/decorators/default";
import { Provider } from "../../src/decorators/provider";
import { Qualifier } from "../../src/decorators/qualifier";
import { Service } from "../../src/decorators/service";

export interface IUserService {
    getName(): string;
}

@Default()
@Service()
export class UserService implements IUserService {
    public getName() {
        return "UserService";
    }
}

@Service()
export class UserService2 implements IUserService {
    public getName() {
        return "UserService2";
    }
}


@Provider()
export class RedisConfiguration {
    @Qualifier("FalseDbConfig")
    @Default()
    static provideRedisConfig() {
        return {};
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
