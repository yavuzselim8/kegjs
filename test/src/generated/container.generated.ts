/* THIS IS A GENERATED FILE, ANY MODIFICATIONS WILL BE OVERWRITTEN WITH THE NEW GENERATION */

import { Keg } from '@kegjs/keg';

import { UserService } from '../UserService.ts';
import { UserService2 } from '../UserService.ts';
import { RedisConfiguration } from '../UserService.ts';

export function initializeContainer() {
    const container = Keg.getInstance();

    container.register({ useClass: UserService, tokens: ['UserService', 'IUserService'], deps: [] , default: true });
    container.register({ useClass: UserService2, tokens: ['UserService2', 'IUserService'], deps: [] });
}
