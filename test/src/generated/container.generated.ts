/* THIS IS A GENERATED FILE, ANY MODIFICATIONS WILL BE OVERWRITTEN WITH THE NEW GENERATION */

import { Keg } from 'kegjs/container/keg';

import { UserService } from '../test-code.ts';
import { UserService2 } from '../test-code.ts';
import { GuestService } from '../test-code.ts';
import { RedisConfiguration } from '../test-code.ts';

export function initializeContainer() {
    const container = Keg.getInstance();

    container.register({ useClass: UserService, tokens: ['UserService', 'IUserService'], deps: ['GuestService'] , default: true });
    container.register({ useClass: UserService2, tokens: ['UserService2', 'IUserService'], deps: [] , transient: true });
    container.register({ useClass: GuestService, tokens: ['GuestService'], deps: [] });
    container.register({ useFactory: RedisConfiguration.provideRedisConfig, tokens: ['RedisConfig', 'FalseDbConfig'], deps: [] , default: true });
}
