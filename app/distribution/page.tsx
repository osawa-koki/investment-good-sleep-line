'use client'

import React, { useMemo, useState } from 'react'
import { Container, Card, Form, Row, Col, Table } from 'react-bootstrap'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

import { useSettings } from '@/contexts/SettingsContext'
import {
  calculateInvestmentDistribution,
  generateNormalDistributionData,
  normalInverseCDF,
  normalCDFGeneral
} from '@/utils/normalDistribution'

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DistributionPage (): React.JSX.Element {
  const { settings } = useSettings()
  const [years, setYears] = useState(10)
  const [tempProbabilityThreshold, setTempProbabilityThreshold] = useState<number | null>(null)
  const [tempInvestmentRatio, setTempInvestmentRatio] = useState<number | null>(null)

  // 投資額を計算（一時的な投資比率がある場合はそれを使用）
  const currentInvestmentRatio = tempInvestmentRatio ?? settings.investmentRatio
  const investmentAmount = settings.totalAssets * currentInvestmentRatio / 100

  // 分布のパラメータを計算
  const { mean, stdDev } = useMemo(() => {
    return calculateInvestmentDistribution({
      initialAssets: investmentAmount,
      expectedReturn: settings.expectedReturn,
      risk: settings.risk,
      years
    })
  }, [investmentAmount, settings.expectedReturn, settings.risk, years])

  // グラフ用のデータを生成
  const distributionData = useMemo(() => {
    return generateNormalDistributionData(mean, stdDev, 300, 3)
  }, [mean, stdDev])

  // Chart.js用のデータ形式に変換
  const chartData = {
    labels: distributionData.map(d => d.x.toFixed(0)),
    datasets: [
      {
        label: '投資資産分布の確率密度',
        data: distributionData.map(d => d.y),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: `${years}年後の投資資産分布（正規分布近似）`
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex
            const value = distributionData[index].x
            return `投資資産額: ${value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円`
          },
          label: (context: any) => {
            const index = context.dataIndex
            const value = distributionData[index].x
            // この金額以下になる確率を計算（CDF）
            const cdfValue = normalCDFGeneral(value, mean, stdDev)
            // この金額以下になる確率（パーセント）
            const probabilityBelow = (cdfValue * 100).toFixed(1)
            // 増減額と増減率を計算
            const change = value - investmentAmount
            const changeRate = ((change / investmentAmount) * 100).toFixed(1)
            return [
              `この金額以下になる確率: ${probabilityBelow}%`,
              `増減額: ${change >= 0 ? '+' : ''}${change.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円`,
              `増減率: ${change >= 0 ? '+' : ''}${changeRate}%`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const,
        title: {
          display: true,
          text: '投資資産額 (円)'
        },
        ticks: {
          maxTicksLimit: 5,
          callback: function (value: any, index: number) {
            // 5個程度のラベルのみ表示
            const totalTicks = distributionData.length
            if (index % Math.floor(totalTicks / 5) === 0 || index === totalTicks - 1) {
              const x = distributionData[index].x
              return x.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
            }
            return ''
          }
        }
      },
      y: {
        title: {
          display: true,
          text: '確率密度'
        },
        ticks: {
          callback: function (value: any) {
            return value.toExponential(2)
          }
        }
      }
    }
  }

  // 95%信頼区間を計算（正規分布）
  const lowerBound = Math.max(0, mean - 1.96 * stdDev) // マイナスにならないように
  const upperBound = mean + 1.96 * stdDev

  // 利益額を計算
  const profit = mean - investmentAmount

  // 確率閾値に基づく最悪ケースを計算
  // 確率閾値が98%の場合、下位2%に相当するz値を求める
  // tempProbabilityThresholdがnullでない場合はそれを使用、nullの場合はsettingsの値を使用
  const currentProbabilityThreshold = tempProbabilityThreshold ?? settings.probabilityThreshold
  const probabilityDecimal = currentProbabilityThreshold / 100
  const zScore = normalInverseCDF(1 - probabilityDecimal) // 下位(1-閾値)%のz値
  const worstCaseAssets = Math.max(0, mean + zScore * stdDev) // マイナスにならないように
  const worstCaseLoss = worstCaseAssets - investmentAmount

  // 投資以外の資産（元の総資産 - 投資額）
  const nonInvestmentAssets = settings.totalAssets - investmentAmount
  // 資産全体（投資部分 + 投資していない部分）
  const totalAssetsWorstCase = worstCaseAssets + nonInvestmentAssets
  const totalAssetsChange = totalAssetsWorstCase - settings.totalAssets

  return (
    <Container className="py-5">
      <h1 className="mb-4">📊 資産分布グラフ</h1>

      <Card className="mb-4">
        <Card.Body>
          <h5>現在の設定</h5>
          <Row>
            <Col md={6}>
              <ul className="mb-0">
                <li>投資額: {investmentAmount.toLocaleString()} 円</li>
                <li>期待リターン: {settings.expectedReturn}% / 年</li>
                <li>リスク: {settings.risk}% / 年</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>投資期間 (年): {years}年</Form.Label>
            <Form.Range
              min={1}
              max={50}
              step={1}
              value={years}
              onChange={(e) => { setYears(parseInt(e.target.value)) }}
            />
            <Form.Text className="text-muted">
              スライダーを動かして投資期間を変更できます。
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <div style={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5>統計情報（正規分布近似）</h5>
          <ul className="mb-0">
            <li>
              平均（期待値）: {mean.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円{' '}
              <span style={{ color: profit > 0 ? 'green' : profit < 0 ? 'red' : 'black' }}>
                ({profit >= 0 ? '+' : ''}{profit.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円 / {profit >= 0 ? '+' : ''}{((profit / investmentAmount) * 100).toFixed(1)}%)
              </span>
            </li>
            <li>標準偏差: {stdDev.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</li>
            <li>95%信頼区間: {lowerBound.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円 〜 {upperBound.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</li>
          </ul>
          <Form.Text className="text-muted d-block mt-2">
            ※ 正規分布で近似し、マイナス部分は切り捨てています。95%の確率で、{years}年後の資産はこの範囲内に収まります。
          </Form.Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h5>確率閾値による最悪ケース</h5>
          <Form.Group className="mb-3">
            <Form.Label>確率閾値 (%): {currentProbabilityThreshold}%</Form.Label>
            <Form.Range
              min={0.1}
              max={99.9}
              step={0.1}
              value={currentProbabilityThreshold}
              onChange={(e) => { setTempProbabilityThreshold(parseFloat(e.target.value)) }}
            />
            <Form.Text className="text-muted">
              スライダーを動かして確率閾値を一時的に変更できます。この変更はこのページでのみ有効です。
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>投資比率 (%): {currentInvestmentRatio}%</Form.Label>
            <Form.Range
              min={0}
              max={100}
              step={1}
              value={currentInvestmentRatio}
              onChange={(e) => { setTempInvestmentRatio(parseFloat(e.target.value)) }}
            />
            <Form.Text className="text-muted">
              スライダーを動かして投資比率を一時的に変更できます。この変更はこのページでのみ有効です。
            </Form.Text>
          </Form.Group>
          <p className="mb-3">
            投資比率 {currentInvestmentRatio}%、投資額 {investmentAmount.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円の場合、{currentProbabilityThreshold}%の確率内での最悪ケースは以下の通りです。
          </p>
          <Table striped bordered>
            <thead>
              <tr>
                <th>観点</th>
                <th>金額</th>
                <th>増減額</th>
                <th>増減率</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>投資部分</strong></td>
                <td>{worstCaseAssets.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</td>
                <td style={{ color: worstCaseLoss > 0 ? 'green' : worstCaseLoss < 0 ? 'red' : 'black' }}>
                  {worstCaseLoss >= 0 ? '+' : ''}{worstCaseLoss.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円
                </td>
                <td style={{ color: worstCaseLoss > 0 ? 'green' : worstCaseLoss < 0 ? 'red' : 'black' }}>
                  {((worstCaseLoss / investmentAmount) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td><strong>資産全体</strong></td>
                <td>{totalAssetsWorstCase.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</td>
                <td style={{ color: totalAssetsChange > 0 ? 'green' : totalAssetsChange < 0 ? 'red' : 'black' }}>
                  {totalAssetsChange >= 0 ? '+' : ''}{totalAssetsChange.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円
                </td>
                <td style={{ color: totalAssetsChange > 0 ? 'green' : totalAssetsChange < 0 ? 'red' : 'black' }}>
                  {((totalAssetsChange / settings.totalAssets) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </Table>
          <Form.Text className="text-muted d-block mt-2">
            ※ 下位{(100 - currentProbabilityThreshold).toFixed(1)}%の確率でこの値を下回ります。<br />
            ※ 資産全体 = 投資部分（{worstCaseAssets.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円）+ 非投資部分（{nonInvestmentAssets.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円）
          </Form.Text>
        </Card.Body>
      </Card>
    </Container>
  )
}
