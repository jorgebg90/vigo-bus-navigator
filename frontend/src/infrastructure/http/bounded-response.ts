export const MAX_RESPONSE_BYTES = 262144;

export async function readBoundedResponse(
  response: Response,
  maxBytes = MAX_RESPONSE_BYTES
): Promise<Uint8Array> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null && /^[0-9]+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    await response.body?.cancel();
    throw new RangeError('Response exceeded the size limit');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new TypeError('Response has no readable body');

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RangeError('Response exceeded the size limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
