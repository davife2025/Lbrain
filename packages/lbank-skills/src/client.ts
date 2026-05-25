/**
 * packages/lbank-skills/src/client.ts
 * LBank REST API client.
 * Handles MD5 + RSA/SHA256 request signing per LBank API spec.
 * Base URL: https://api.lbkex.com
 */

import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'

export const LBANK_REST_BASE = 'https://api.lbkex.com'
export const LBANK_WS_BASE  = 'wss://www.lbkex.net/ws/V2/'

export interface LBankCredentials {
  apiKey:    string
  secretKey: string // RSA private key or MD5 secret
  signType?: 'MD5' | 'RSA' // default MD5
}

// ── Signing ────────────────────────────────────────────────────────────────

/**
 * Step 1: Sort params alphabetically and build query string
 */
function buildParamString(params: Record<string, string | number>): string {
  return Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
}

/**
 * Step 2: MD5 digest of the param string (uppercase)
 */
function md5Sign(paramString: string): string {
  return crypto.createHash('md5').update(paramString).digest('hex').toUpperCase()
}

/**
 * Step 3: RSA SHA256 sign of MD5 digest using private key (Base64)
 * Used when signType = RSA
 */
function rsaSign(md5Digest: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(md5Digest)
  return sign.sign(privateKey, 'base64')
}

/**
 * Generate the full signature for a request.
 * LBank supports MD5-only or MD5+RSA
 */
export function generateSignature(
  params: Record<string, string | number>,
  secretKey: string,
  signType: 'MD5' | 'RSA' = 'MD5'
): string {
  const paramString = buildParamString(params)
  const md5         = md5Sign(paramString + '&secret_key=' + secretKey)
  if (signType === 'MD5') return md5
  return rsaSign(md5, secretKey)
}

// ── Public client (no auth) ────────────────────────────────────────────────
export const publicClient: AxiosInstance = axios.create({
  baseURL: LBANK_REST_BASE,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

// ── Authenticated client ───────────────────────────────────────────────────
export class LBankClient {
  private apiKey:    string
  private secretKey: string
  private signType:  'MD5' | 'RSA'
  private http:      AxiosInstance

  constructor(credentials: LBankCredentials) {
    this.apiKey    = credentials.apiKey
    this.secretKey = credentials.secretKey
    this.signType  = credentials.signType ?? 'MD5'

    this.http = axios.create({
      baseURL: LBANK_REST_BASE,
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  }

  /**
   * Build signed POST body for private endpoints
   */
  private buildSignedBody(params: Record<string, string | number> = {}): string {
    const allParams = { ...params, api_key: this.apiKey }
    const sign      = generateSignature(allParams, this.secretKey, this.signType)
    const body      = { ...allParams, sign, sign_type: this.signType }
    return new URLSearchParams(body as any).toString()
  }

  /**
   * POST to a private endpoint
   */
  async post<T = any>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const body = this.buildSignedBody(params)
    const { data } = await this.http.post<T>(path, body)
    return data
  }

  getApiKey() { return this.apiKey }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * LBank uses symbol format: btc_usdt (lowercase, underscore)
 * Convert from common format BTC/USDT or BTCUSDT
 */
export function toSymbol(pair: string): string {
  return pair.toLowerCase().replace('/', '_').replace(/([a-z]+)(usdt|btc|eth|bnb)$/, '$1_$2')
}

/**
 * Check if LBank API response is successful
 */
export function isSuccess(data: any): boolean {
  return data?.result === 'true' || data?.result === true
}
