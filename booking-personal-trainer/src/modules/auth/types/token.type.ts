export interface SaveRefreshToken {
  userId: string;
  refreshToken: string;
}

export interface ValidateRefreshToken {
  userId: string;
  refreshToken: string;
}

export interface RemoveRefreshToken {
  userId: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}
