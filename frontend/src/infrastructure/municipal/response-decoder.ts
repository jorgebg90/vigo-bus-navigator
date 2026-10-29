export function decodeMunicipalBytes(bytes: Uint8Array, contentType: string | null): string {
  if (contentType === null) throw new TypeError('Missing response content type');

  const [mediaType, ...parameters] = contentType.split(';');
  if (mediaType.trim().toLowerCase() !== 'application/json') {
    throw new TypeError('Unsupported response content type');
  }

  const charsets = parameters.flatMap((parameter) => {
    const [name, ...values] = parameter.split('=');
    if (name.trim().toLowerCase() !== 'charset') return [];
    if (values.length !== 1) throw new TypeError('Invalid response charset');
    return [values[0].trim().replace(/^"(.*)"$/, '$1').toLowerCase()];
  });
  if (charsets.length !== 1) throw new TypeError('Missing or contradictory response charset');

  const charset = charsets[0];
  if (charset !== 'iso-8859-1' && charset !== 'utf-8') {
    throw new TypeError('Unsupported response charset');
  }

  try {
    return new TextDecoder(charset, { fatal: true }).decode(bytes);
  } catch {
    throw new TypeError('Invalid response encoding');
  }
}
