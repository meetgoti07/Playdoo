import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Next.js API',
        version: '1.0.0',
        description: 'API documentation for Next.js application',
      },
      servers: [
        {
          url: 'http://odoofinal:3000',
          description: 'Development server',
        },
      ],
    },
  });
  return spec;
};