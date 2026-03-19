const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

export interface ShopeeTokenResponse {
  id: string;
  company_id: string;
  partner_id: number;
  shop_id: number;
  access_token: string;
  refresh_token: string;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export async function getShopeeAuthUrl(redirectUri: string): Promise<{ authorization_url: string }> {
  const endpoint = `${API_DOMAIN}/shopee-tokens/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`;
  const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to get Shopee authorization URL');
  return data;
}

export async function handleShopeeCallback(
  code: string,
  shopId: string,
  companyId: string,
  country?: string,
): Promise<ShopeeTokenResponse> {
  let endpoint = `${API_DOMAIN}/shopee-tokens/auth/callback?code=${encodeURIComponent(code)}&shop_id=${shopId}&company_id=${companyId}`;
  if (country) endpoint += `&country=${encodeURIComponent(country)}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to complete Shopee authorization');
  return data;
}

export async function getShopeeTokens(companyId: string): Promise<ShopeeTokenResponse[]> {
  const endpoint = `${API_DOMAIN}/shopee-tokens/company/${companyId}`;
  const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to fetch Shopee tokens');
  return data;
}
