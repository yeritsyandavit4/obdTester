const CAR_IMAGES_API_KEY = 'ci_f4e4457c3c346c9f77e86618f09bdcaabd5b394b781e8c0bfade4d16';
const CAR_IMAGES_API_SECRET = '648cf9035d19a4c3ed69ff14e86dcfdd6bae63e540bc89eb16b666a81e262862';

export const fetchCarImageUrl = async (
  make: string,
  model?: string,
  year?: string,
): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      api_key: CAR_IMAGES_API_KEY,
      api_secret: CAR_IMAGES_API_SECRET,
      make,
    });
    if (model) params.append('model', model);
    if (year) params.append('year', year);
    params.append('width', '800');
    params.append('format', 'webp');

    const response = await fetch(
      `https://carimagesapi.com/api/v1/signed-url?${params.toString()}`,
    );
    if (!response.ok) {
      console.error('CarImages API error:', response.status);
      return null;
    }
    const data = await response.json();
    return data?.url ?? null;
  } catch (error) {
    console.error('Failed to fetch car image URL:', error);
    return null;
  }
};
export const scanVin = async (vin: string): Promise<{ model: string | null; make: string | null; modelYear: string | null; displacementL: number | null } | null> => {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('scanVin non-OK response', { status: response.status, statusText: response.statusText, url });
      return null;
    }
    const data = await response.json();
    const results = Array.isArray(data?.Results) ? data.Results : [];
    const model = results.find((result: any) => result?.Variable === 'Model')?.Value ?? null;
    const make = results.find((result: any) => result?.Variable === 'Make')?.Value ?? null;
    const modelYear = results.find((result: any) => result?.Variable === 'Model Year')?.Value ?? null;
    const dispRaw = results.find((result: any) => result?.Variable === 'Displacement (L)')?.Value ?? null;
    const displacementL = dispRaw && !isNaN(parseFloat(dispRaw)) ? parseFloat(dispRaw) : null;
    return {
      model,
      make,
      modelYear,
      displacementL,
    };
  } catch (error) {
    console.error('scanVin failed:', error);
    return null;
  }
};
