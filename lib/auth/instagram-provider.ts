import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

export interface InstagramProfile {
  id: string;
  username: string;
  account_type?: string;
  profile_picture_url?: string;
}

export function CustomInstagramProvider(
  options: OAuthUserConfig<InstagramProfile>
): OAuthConfig<InstagramProfile> {
  // Exclude `checks` from the spread — OAuthUserConfig allows "nonce" (OIDC)
  // but OAuthConfig (OAuth2) does not. Instagram is plain OAuth2.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { checks: _checks, ...restOptions } = options;

  return {
    id: 'instagram',
    name: 'Instagram',
    type: 'oauth',
    checks: ['state'],
    authorization: {
      url: 'https://www.instagram.com/oauth/authorize',
      params: {
        scope: 'instagram_business_basic',
        response_type: 'code',
      },
    },
    client: {
      token_endpoint_auth_method: 'client_secret_post',
    },
    token: {
      url: 'https://api.instagram.com/oauth/access_token',
      async conform(response: Response) {
        // Instagram Business Login wraps the token in data[0] rather than
        // returning a flat OAuth2 response. Normalize it so Auth.js can find
        // access_token at the top level.
        if (!response.ok) return response;

        const data = await response.json();
        const tokenData = Array.isArray(data?.data) ? data.data[0] : data;

        return Response.json(
          { ...tokenData, token_type: tokenData?.token_type ?? 'bearer' },
          response
        );
      },
    },
    userinfo: {
      url: 'https://graph.instagram.com/me',
      params: { fields: 'id,username,account_type,profile_picture_url' },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.username,
        email: null, // Instagram never returns email
        image: profile.profile_picture_url ?? null,
      };
    },
    ...restOptions,
  };
}
