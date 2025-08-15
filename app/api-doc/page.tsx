import { getApiDocs } from '@/lib/docs/swagger';
import ReactSwagger from '@/components/ui/ReactSwagger';

// Force dynamic rendering to avoid static generation issues with Swagger UI
export const dynamic = 'force-dynamic';

export default async function ApiDoc() {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}