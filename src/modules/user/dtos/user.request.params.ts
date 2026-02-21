// user.request.params.ts
import { idParamDTO } from "../../../shared/dtos/commonDTO";

export const UserIdParamDTO = idParamDTO.extend({});
// to make a new copy, instead of refercing the shared variable use .extend()
// I know someone may do something stupid (could me) so as not to affect everyone
// just make a new copy
