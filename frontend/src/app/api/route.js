import { isValidRequest } from '@/lib/utils';
 
export async function POST(request, { params }) {
  const clonedRequest = request.clone();
  const isValid = await isValidRequest(clonedRequest);
 
  if (!isValid) {
    return new Response(null, { status: 400, statusText: 'Bad Request' });
  }
 
  const { slug } = await params;
  const pathname = slug.join('/');
  const proxyURL = new URL(pathname, 'http://localhost:3000/api/');
  const proxyRequest = new Request(proxyURL, request);
 
  try {
    return fetch(proxyRequest);
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected exception';
 
    return new Response(message, { status: 500 });
  }
}