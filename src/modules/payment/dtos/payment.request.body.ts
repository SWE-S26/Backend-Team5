import extendedZod from '../../../shared/docs/dtoDocumenter';
export const CreatePaymentRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.string().email(),
    password: extendedZod.string().min(6),
    name: extendedZod.string().min(2),
  })
  .openapi('CreatePaymentRequest', {
    example: {
      email: 'john.doe@example.com',
      password: 'secret123',
      name: 'John Doe',
    },
  });
