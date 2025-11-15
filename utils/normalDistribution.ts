// 標準正規分布に関連する計算ユーティリティ

/**
 * 誤差関数 (Error Function) の近似計算
 * 標準正規分布の累積分布関数を計算するために使用
 */
function erf (x: number): number {
  // Abramowitz and Stegun approximation
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

/**
 * 標準正規分布の累積分布関数 (CDF)
 * @param x - 評価する点
 * @returns P(X <= x) の確率
 */
export function normalCDF (x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

/**
 * 標準正規分布の確率密度関数 (PDF)
 * @param x - 評価する点
 * @returns 確率密度
 */
export function normalPDF (x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/**
 * 正規分布の確率密度関数 (一般形)
 * @param x - 評価する点
 * @param mean - 平均
 * @param stdDev - 標準偏差
 * @returns 確率密度
 */
export function normalPDFGeneral (x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev
  return normalPDF(z) / stdDev
}

/**
 * 正規分布の累積分布関数 (一般形)
 * @param x - 評価する点
 * @param mean - 平均
 * @param stdDev - 標準偏差
 * @returns P(X <= x) の確率
 */
export function normalCDFGeneral (x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev
  return normalCDF(z)
}

/**
 * 標準正規分布の逆累積分布関数 (パーセンタイル点)
 * Beasley-Springer-Moro アルゴリズムによる近似
 * @param p - 確率 (0 < p < 1)
 * @returns x: P(X <= x) = p となる x
 */
export function normalInverseCDF (p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('Probability must be between 0 and 1')
  }

  // Beasley-Springer-Moro algorithm
  const a0 = 2.50662823884
  const a1 = -18.61500062529
  const a2 = 41.39119773534
  const a3 = -25.44106049637
  const b0 = -8.47351093090
  const b1 = 23.08336743743
  const b2 = -21.06224101826
  const b3 = 3.13082909833
  const c0 = 0.3374754822726147
  const c1 = 0.9761690190917186
  const c2 = 0.1607979714918209
  const c3 = 0.0276438810333863
  const c4 = 0.0038405729373609
  const c5 = 0.0003951896511919
  const c6 = 0.0000321767881768
  const c7 = 0.0000002888167364
  const c8 = 0.0000003960315187

  const y = p - 0.5
  let r: number
  let x: number

  if (Math.abs(y) < 0.42) {
    r = y * y
    x = y * (((a3 * r + a2) * r + a1) * r + a0) /
      ((((b3 * r + b2) * r + b1) * r + b0) * r + 1)
  } else {
    r = p
    if (y > 0) {
      r = 1 - p
    }
    r = Math.log(-Math.log(r))
    x = c0 + r * (c1 + r * (c2 + r * (c3 + r * (c4 + r * (c5 + r * (c6 + r * (c7 + r * c8)))))))
    if (y < 0) {
      x = -x
    }
  }

  return x
}

/**
 * 投資期間後の資産分布を計算するためのパラメータ
 */
export interface InvestmentDistributionParams {
  initialAssets: number // 初期投資額
  expectedReturn: number // 期待リターン (%/年)
  risk: number // リスク (標準偏差 %/年)
  years: number // 投資期間 (年)
}

/**
 * 投資後の資産の正規分布パラメータを計算（複利考慮版）
 * @param params - 投資パラメータ
 * @returns { mean, stdDev } - 正規分布の平均と標準偏差
 */
export function calculateInvestmentDistribution (params: InvestmentDistributionParams): { mean: number, stdDev: number } {
  const { initialAssets, expectedReturn, risk, years } = params

  // リターンとリスクを小数に変換
  const muRate = expectedReturn / 100
  const sigmaRate = risk / 100

  // 正規分布近似（複利考慮）
  // 平均 = 初期資産 × (1 + リターン率)^期間
  const mean = initialAssets * Math.pow(1 + muRate, years)

  // 標準偏差 = 平均 × リスク × √期間（複利を考慮）
  const stdDev = mean * sigmaRate * Math.sqrt(years)

  return { mean, stdDev }
}

/**
 * 正規分布のグラフ描画用データポイントを生成（マイナス部分を切り捨て）
 * @param mean - 平均
 * @param stdDev - 標準偏差
 * @param numPoints - データポイント数
 * @param numStdDev - 平均から何標準偏差分を表示するか
 * @returns { x: number[], y: number[] } - x座標とy座標の配列
 */
export function generateNormalDistributionData (
  mean: number,
  stdDev: number,
  numPoints: number = 300,
  numStdDev: number = 3
): Array<{ x: number, y: number }> {
  const data: Array<{ x: number, y: number }> = []

  // マイナスにならないように下限を0に設定
  const xMin = Math.max(0, mean - numStdDev * stdDev)
  const xMax = mean + numStdDev * stdDev
  const step = (xMax - xMin) / (numPoints - 1)

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step
    const y = normalPDFGeneral(x, mean, stdDev)
    data.push({ x, y })
  }

  return data
}
