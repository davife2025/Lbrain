/**
 * packages/lbank-skills/src/trading.ts
 * LBank private trading skills.
 * Place, cancel, and query orders.
 */

import { LBankClient, toSymbol, isSuccess } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'limit' | 'market' | 'market_maker' | 'ioc' | 'fok'

export interface PlaceOrderParams {
  symbol:    string
  side:      OrderSide
  type:      OrderType
  amount:    number
  price?:    number  // required for limit orders
  clientId?: string  // optional custom order ID
}

export interface LBankOrder {
  orderId:    string
  symbol:     string
  side:       OrderSide
  type:       string
  price:      number
  amount:     number
  filled:     number
  remaining:  number
  status:     'pending' | 'partial' | 'filled' | 'cancelled'
  createTime: number
}

// ── Skills ─────────────────────────────────────────────────────────────────

/**
 * SKILL: place_order
 * Place a new spot order on LBank
 */
export async function placeOrder(
  client: LBankClient,
  params: PlaceOrderParams
): Promise<{ orderId: string; success: boolean; message: string }> {
  const sym = toSymbol(params.symbol)

  const body: Record<string, string | number> = {
    symbol: sym,
    type:   `${params.side}_${params.type}`,
    amount: params.amount,
  }

  if (params.price)    body.price     = params.price
  if (params.clientId) body.custom_id = params.clientId

  const data = await client.post('/v2/create_order.do', body)

  if (!isSuccess(data)) {
    return { orderId: '', success: false, message: data?.error_code ?? 'Order failed' }
  }

  return {
    orderId: data.order_id,
    success: true,
    message: `Order placed successfully. ID: ${data.order_id}`,
  }
}

/**
 * SKILL: cancel_order
 * Cancel an open order by order ID
 */
export async function cancelOrder(
  client: LBankClient,
  symbol:  string,
  orderId: string
): Promise<{ success: boolean; message: string }> {
  const sym  = toSymbol(symbol)
  const data = await client.post('/v1/cancel_order.do', { symbol: sym, order_id: orderId })

  if (!isSuccess(data)) {
    return { success: false, message: data?.error_code ?? 'Cancel failed' }
  }

  return { success: true, message: `Order ${orderId} cancelled successfully.` }
}

/**
 * SKILL: cancel_all_orders
 * Cancel all open orders for a symbol
 */
export async function cancelAllOrders(
  client: LBankClient,
  symbol: string
): Promise<{ success: boolean; cancelled: number; message: string }> {
  const orders = await getOpenOrders(client, symbol)
  if (orders.length === 0) return { success: true, cancelled: 0, message: 'No open orders to cancel.' }

  const results = await Promise.allSettled(
    orders.map(o => cancelOrder(client, symbol, o.orderId))
  )

  const cancelled = results.filter(r => r.status === 'fulfilled' && (r as any).value.success).length
  return { success: true, cancelled, message: `Cancelled ${cancelled} of ${orders.length} orders.` }
}

/**
 * SKILL: get_open_orders
 * Get all open (unfilled) orders for a symbol
 */
export async function getOpenOrders(
  client:  LBankClient,
  symbol:  string,
  page:    number = 1,
  size:    number = 50
): Promise<LBankOrder[]> {
  const sym  = toSymbol(symbol)
  const data = await client.post('/v1/orders_info_no_deal.do', { symbol: sym, current_page: page, page_length: size })

  if (!isSuccess(data)) return []

  return (data.orders ?? []).map(normalizeOrder)
}

/**
 * SKILL: get_order_history
 * Get historical orders for a symbol
 */
export async function getOrderHistory(
  client:    LBankClient,
  symbol:    string,
  status:    0 | 1 | 2 | 3 = 2, // 0=pending, 1=cancelled, 2=filled, 3=partial
  page:      number = 1,
  size:      number = 20
): Promise<LBankOrder[]> {
  const sym  = toSymbol(symbol)
  const data = await client.post('/v1/orders_info_history.do', {
    symbol:       sym,
    current_page: page,
    page_length:  size,
    status,
  })

  if (!isSuccess(data)) return []
  return (data.orders ?? []).map(normalizeOrder)
}

/**
 * SKILL: get_order
 * Get details of a specific order by ID
 */
export async function getOrder(
  client:  LBankClient,
  symbol:  string,
  orderId: string
): Promise<LBankOrder | null> {
  const sym  = toSymbol(symbol)
  const data = await client.post('/v1/orders_info.do', { symbol: sym, order_id: orderId })

  if (!isSuccess(data) || !data.orders?.[0]) return null
  return normalizeOrder(data.orders[0])
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeOrder(o: any): LBankOrder {
  const statusMap: Record<number, LBankOrder['status']> = {
    0: 'pending',
    1: 'cancelled',
    2: 'filled',
    3: 'partial',
    4: 'cancelled',
  }
  return {
    orderId:    o.order_id,
    symbol:     o.symbol,
    side:       o.type?.includes('buy') ? 'buy' : 'sell',
    type:       o.type,
    price:      parseFloat(o.price   ?? 0),
    amount:     parseFloat(o.amount  ?? 0),
    filled:     parseFloat(o.deal_amount ?? 0),
    remaining:  parseFloat(o.amount ?? 0) - parseFloat(o.deal_amount ?? 0),
    status:     statusMap[o.status] ?? 'pending',
    createTime: o.create_time ?? Date.now(),
  }
}
