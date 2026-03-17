import { idParamDto } from '../../../shared/dtos/commonDTO';
import z from 'zod';
export const ProfileIdParamDTO = idParamDto.extend({});
// export type IdParam = z.infer<typeof ProfileIdParamDTO>;
