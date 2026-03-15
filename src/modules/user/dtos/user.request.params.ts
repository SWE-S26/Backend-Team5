// user.request.params.ts
import { idParamDto } from '../../../shared/dtos/commonDTO';

export const UserIdParamDTO = idParamDto.extend({});
// to make a new copy, instead of refercing the shared variable use .extend()
// I know someone may do something stupid (could me) so as not to affect everyone
// just make a new copy
