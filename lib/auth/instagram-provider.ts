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
    token: {
      url: 'https://api.instagram.com/oauth/access_token',
      async request(context: {
        params: { code?: string; [key: string]: string | undefined };
        provider: { callbackUrl: string };
      }) {
        const body = new URLSearchParams({
          client_id: options.clientId!,
          client_secret: options.clientSecret!,
          grant_type: 'authorization_code',
          redirect_uri: context.provider.callbackUrl,
          code: context.params.code!,
        });

        const res = await fetch('https://api.instagram.com/oauth/access_token', {
          method: 'POST',
          body,
        });

        const data = await res.json();
        // Instagram omits token_type — Auth.js requires it
        return { tokens: { ...data, token_type: 'bearer' } };
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
