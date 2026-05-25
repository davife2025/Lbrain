/**
 * packages/lbank-skills/src/account.ts
 * LBank private account skills.
 * Requires API key + secret.
 */

import { LBankClient, isSuccess } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface LBankBalance {
  asset:  string
  free:   number
  frozen: number
  total:  number
}

export interface LBankPortfolio {
  balances: LBankBalance[]
  totalUSDT: number
}

// ── Skills ─────────────────────────────────────────────────────────────────

/**
 * SKILL: get_account_info
 * Get raw account info from LBank
 */
export async function getAccountInfo(client: LBankClient): Promise<any> {
  const data = await client.post('/v1/user_info.do')
  if (!isSuccess(data)) throw new Error(data?.error_code ?? 'Failed to get account info')
  return data.info
}

/**
 * SKILL: get_balances
 * Get all non-zero balances
 */
export async function getBalances(client: LBankClient): Promise<LBankBalance[]> {
  const info = await getAccountInfo(client)
  const free   = info?.funds?.free   ?? {}
  const frozen = info?.funds?.freezed ?? {}

  const assets = new Set([...Object.keys(free), ...Object.keys(frozen)])
  const balances: LBankBalance[] = []

  for (const asset of assets) {
    const freeAmt   = parseFloat(free[asset]   ?? '0')
    const frozenAmt = parseFloat(frozen[asset] ?? '0')
    const total     = freeAmt + frozenAmt
    if (total > 0) {
      balances.push({ asset: asset.toUpperCase(), free: freeAmt, frozen: frozenAmt, total })
    }
  }

  return balances.sort((a, b) => b.total - a.total)
}

/**
 * SKILL: get_portfolio_value
 * Get balances with estimated USDT values
 */
export async function getPortfolioValue(
  client: LBankClient,
  getPriceFn: (symbol: string) => Promise<number>
): Promise<LBankPortfolio> {
  const balances  = await getBalances(client)
  const stables   = new Set(['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI'])
  let   totalUSDT = 0

  const valued = await Promise.allSettled(
    balances.map(async b => {
      if (stables.has(b.asset)) {
        totalUSDT += b.total
        return { ...b, usdtValue: b.total }
      }
      try {
        const price = await getPriceFn(`${b.asset.toLowerCase()}_usdt`)
        const val   = b.total * price
        totalUSDT  += val
        return { ...b, usdtValue: val }
      } catch {
        return { ...b, usdtValue: 0 }
      }
    })
  )

  const result = valued
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(b => b.usdtValue > 0.01)

  return { balances: result, totalUSDT }
}

/**
 * SKILL: get_transaction_history
 * Get past transaction records
 */
export async function getTransactionHistory(
  client: LBankClient,
  symbol: string,
  params: { from?: string; direct?: 'next' | 'prev'; size?: number } = {}
): Promise<any[]> {
  const data = await client.post('/v1/transaction_history.do', {
    symbol,
    direct: params.direct ?? 'next',
    size:   params.size   ?? 20,
    ...(params.from ? { from: params.from } : {}),
  })

  if (!isSuccess(data)) throw new Error(data?.error_code ?? 'Failed to get transaction history')
  return data.transaction ?? []
}
