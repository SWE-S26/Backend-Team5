import extendedZod from '../../../shared/docs/dtoDocumenter';
export const CreateFeedRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.string().email(),
    password: extendedZod.string().min(6),
    name: extendedZod.string().min(2),
  })
  .openapi('CreateFeedRequest', {
    example: {
      email: 'john.doe@example.com',
      password: 'secret123',
      name: 'John Doe',
    },
  });
