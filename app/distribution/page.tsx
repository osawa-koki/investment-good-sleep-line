'use client'

import React, { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { Container, Card, Form, Row, Col, Table, Button } from 'react-bootstrap'
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
import annotationPlugin from 'chartjs-plugin-annotation'
import { Line } from 'react-chartjs-2'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'react-toastify'

import { useSettings } from '@/contexts/SettingsContext'
import {
  calculateInvestmentDistribution,
  generateLognormalDistributionData,
  normalInverseCDF,
  lognormalCDF
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
  Filler,
  annotationPlugin
)

// 定数定義
const DEFAULT_YEARS = 10
const PERCENTAGE_DIVISOR = 100
const DISTRIBUTION_POINTS = 300
const DISTRIBUTION_STD_DEV = 3
const BORDER_WIDTH_THIN = 2
const DASH_SEGMENT_LENGTH = 5
const DASH_PATTERN: [number, number] = [DASH_SEGMENT_LENGTH, DASH_SEGMENT_LENGTH]
const CHART_TENSION = 0.4
const POINT_RADIUS = 0
const CONFIDENCE_INTERVAL_Z_SCORE = 1.96
const MAX_TICKS_LIMIT = 5
const PDF_MARGIN = 10
const PDF_IMAGE_SCALE = 2
const PDF_SPACING = 10
const PDF_WIDTH_800 = '800px'
const PDF_PADDING_40 = '40px'
const PDF_LEFT_OFFSET = '-9999px'
const CHART_HEIGHT = '400px'
const SETTLEMENT_TIMEOUT = 0
const DECIMAL_FRACTION_DIGITS = 0
const DECIMAL_ONE_DIGIT = 1
const DECIMAL_TWO_DIGITS = 2
const ROUNDING_MULTIPLIER = 10
const FIRST_ELEMENT_INDEX = 0
const LAST_INDEX_OFFSET = 1
const PROBABILITY_COMPLEMENT = 1

interface TooltipContext {
  dataIndex: number
}

// グラフの線の定義を生成する関数
function createAnnotationLine (
  index: number,
  color: string,
  borderWidth: number,
  label: string,
  displayLabel: boolean,
  borderDash?: [number, number]
): Record<string, unknown> {
  return {
    type: 'line' as const,
    xMin: index,
    xMax: index,
    borderColor: color,
    borderWidth,
    ...(borderDash !== undefined ? { borderDash } : {}),
    label: {
      display: displayLabel,
      content: label,
      position: displayLabel ? ('start' as const) : undefined
    }
  }
}

// HTMLコンテンツを生成する関数
function createPDFContentElement (content: string): HTMLDivElement {
  const element = document.createElement('div')
  element.style.width = PDF_WIDTH_800
  element.style.padding = PDF_PADDING_40
  element.style.backgroundColor = '#ffffff'
  element.style.fontFamily = 'sans-serif'
  element.style.position = 'absolute'
  element.style.left = PDF_LEFT_OFFSET
  element.innerHTML = content
  return element
}


export default function DistributionPage (): React.JSX.Element {
  const { settings } = useSettings()
  const [years, setYears] = useState(DEFAULT_YEARS)
  const [tempProbabilityThreshold, setTempProbabilityThreshold] = useState<number | null>(null)
  const [tempInvestmentRatio, setTempInvestmentRatio] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // 投資額を計算（一時的な投資比率がある場合はそれを使用）
  const currentInvestmentRatio = tempInvestmentRatio ?? settings.investmentRatio
  const investmentAmount = settings.totalAssets * currentInvestmentRatio / PERCENTAGE_DIVISOR

  // 分布のパラメータを計算（対数正規分布）
  const { mean, stdDev, logMean, logStdDev } = useMemo(() => calculateInvestmentDistribution({
    initialAssets: investmentAmount,
    expectedReturn: settings.expectedReturn,
    risk: settings.risk,
    years
  }), [investmentAmount, settings.expectedReturn, settings.risk, years])

  // グラフ用のデータを生成（対数正規分布）
  const distributionData = useMemo(() => generateLognormalDistributionData(logMean, logStdDev, DISTRIBUTION_POINTS, DISTRIBUTION_STD_DEV), [logMean, logStdDev])

  // 損益分岐点（初期投資額）のインデックスを見つける
  const breakEvenIndex = distributionData.findIndex(d => d.x >= investmentAmount)

  // 期待リターン（平均値）のインデックスを見つける
  const expectedReturnIndex = distributionData.findIndex(d => d.x >= mean)

  // ±1σのインデックスを見つける
  const plusOneSigmaIndex = distributionData.findIndex(d => d.x >= mean + stdDev)
  const minusOneSigmaIndex = distributionData.findIndex(d => d.x >= mean - stdDev)

  // ±2σのインデックスを見つける
  const plusTwoSigmaIndex = distributionData.findIndex(d => d.x >= mean + BORDER_WIDTH_THIN * stdDev)
  const minusTwoSigmaIndex = distributionData.findIndex(d => d.x >= mean - BORDER_WIDTH_THIN * stdDev)

  // ±3σのインデックスを見つける
  const plusThreeSigmaIndex = distributionData.findIndex(d => d.x >= mean + DISTRIBUTION_STD_DEV * stdDev)
  const minusThreeSigmaIndex = distributionData.findIndex(d => d.x >= mean - DISTRIBUTION_STD_DEV * stdDev)

  // Chart.js用のデータ形式に変換
  const chartData = {
    labels: distributionData.map(d => d.x.toFixed(DECIMAL_FRACTION_DIGITS)),
    datasets: [
      {
        label: '投資資産分布の確率密度',
        data: distributionData.map(d => d.y),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: CHART_TENSION,
        pointRadius: POINT_RADIUS
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
        text: `${years}年後の投資資産分布（対数正規分布）`
      },
      annotation: {
        annotations: {
          breakEvenLine: createAnnotationLine(breakEvenIndex, 'rgb(255, 0, 0)', BORDER_WIDTH_THIN, '損益分岐点', true),
          expectedReturnLine: createAnnotationLine(expectedReturnIndex, 'rgb(0, 0, 255)', BORDER_WIDTH_THIN, '期待リターン', true),
          plusOneSigmaLine: createAnnotationLine(plusOneSigmaIndex, 'rgb(0, 128, 0)', BORDER_WIDTH_THIN, '', false, DASH_PATTERN),
          minusOneSigmaLine: createAnnotationLine(minusOneSigmaIndex, 'rgb(0, 128, 0)', BORDER_WIDTH_THIN, '', false, DASH_PATTERN),
          plusTwoSigmaLine: createAnnotationLine(plusTwoSigmaIndex, 'rgb(0, 200, 0)', BORDER_WIDTH_THIN, '', false, DASH_PATTERN),
          minusTwoSigmaLine: createAnnotationLine(minusTwoSigmaIndex, 'rgb(0, 200, 0)', BORDER_WIDTH_THIN, '', false, DASH_PATTERN),
          plusThreeSigmaLine: createAnnotationLine(plusThreeSigmaIndex, 'rgb(255, 255, 0)', BORDER_WIDTH_THIN, '', false, DASH_PATTERN),
          minusThreeSigmaLine: createAnnotationLine(minusThreeSigmaIndex, 'rgb(255, 255, 0)', BORDER_WIDTH_THIN, '', false, DASH_PATTERN)
        }
      },
      tooltip: {
        callbacks: {
          title: (context: TooltipContext[]) => {
            const firstContext = context[FIRST_ELEMENT_INDEX]
            const { dataIndex: index } = firstContext
            const value = distributionData[index].x
            return `投資資産額: ${value.toLocaleString('ja-JP', { maximumFractionDigits: DECIMAL_FRACTION_DIGITS })} 円`
          },
          label: (context: TooltipContext) => {
            const { dataIndex: index } = context
            const value = distributionData[index].x
            // この金額以下になる確率を計算（対数正規分布のCDF）
            const cdfValue = lognormalCDF(value, logMean, logStdDev)
            // この金額以下になる確率（パーセント）
            const probabilityBelow = (cdfValue * PERCENTAGE_DIVISOR).toFixed(DECIMAL_ONE_DIGIT)
            // 増減額と増減率を計算
            const change = value - investmentAmount
            const changeRate = ((change / investmentAmount) * PERCENTAGE_DIVISOR).toFixed(DECIMAL_ONE_DIGIT)
            return [
              `この金額以下になる確率: ${probabilityBelow}%`,
              `増減額: ${change >= SETTLEMENT_TIMEOUT ? '+' : ''}${change.toLocaleString('ja-JP', { maximumFractionDigits: DECIMAL_FRACTION_DIGITS })} 円`,
              `増減率: ${change >= SETTLEMENT_TIMEOUT ? '+' : ''}${changeRate}%`
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
          maxTicksLimit: MAX_TICKS_LIMIT,
          callback: function (_value: unknown, index: number) {
            // 5個程度のラベルのみ表示
            const totalTicks = distributionData.length
            const lastIndex = totalTicks - LAST_INDEX_OFFSET
            if (index % Math.floor(totalTicks / MAX_TICKS_LIMIT) === SETTLEMENT_TIMEOUT || index === lastIndex) {
              const x = distributionData[index].x
              return x.toLocaleString('ja-JP', { maximumFractionDigits: DECIMAL_FRACTION_DIGITS })
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
          callback: function (value: unknown) {
            return (value as number).toExponential(DECIMAL_TWO_DIGITS)
          }
        }
      }
    }
  }

  // 95%信頼区間を計算（対数正規分布）
  // 対数正規分布の95%信頼区間: exp(logMean ± 1.96 × logStdDev)
  const lowerBound = Math.exp(logMean - CONFIDENCE_INTERVAL_Z_SCORE * logStdDev)
  const upperBound = Math.exp(logMean + CONFIDENCE_INTERVAL_Z_SCORE * logStdDev)

  // 利益額を計算
  const profit = mean - investmentAmount

  // 確率閾値に基づく最悪ケースを計算（対数正規分布）
  // 確率閾値が90%の場合、下位10%に相当する値を求める
  // tempProbabilityThresholdがnullでない場合はそれを使用、nullの場合はsettingsの値を使用
  const currentProbabilityThreshold = tempProbabilityThreshold ?? settings.probabilityThreshold
  const probabilityDecimal = currentProbabilityThreshold / PERCENTAGE_DIVISOR
  // 下位(100-閾値)%のz値を求める
  const zScore = normalInverseCDF(PROBABILITY_COMPLEMENT - probabilityDecimal)
  // 対数正規分布の場合: exp(logMean + zScore × logStdDev)
  const worstCaseAssets = Math.exp(logMean + zScore * logStdDev)
  const worstCaseLoss = worstCaseAssets - investmentAmount

  // 投資以外の資産（元の総資産 - 投資額）
  const nonInvestmentAssets = settings.totalAssets - investmentAmount
  // 資産全体（投資部分 + 投資していない部分）
  const totalAssetsWorstCase = worstCaseAssets + nonInvestmentAssets
  const totalAssetsChange = totalAssetsWorstCase - settings.totalAssets

  // PDF生成関数
  const generatePDF = async (): Promise<void> => {
    try {
      toast.info('PDFを生成しています...')

      // PDFに含めるHTML要素を作成
      const today = new Date().toLocaleDateString('ja-JP')
      const pdfContent = createPDFContentElement(`
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">投資分析レポート</h1>
          <p style="font-size: 14px; color: #666;">生成日: ${today}</p>
        </div>

        <!-- 安眠チェック -->
        <div style="background-color: #d1ecf1; border: 2px solid #0c5460; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px;">💤 安眠チェック</h2>
          <p style="font-size: 14px; margin-bottom: 10px;">
            通常起こり得る確率範囲（${currentProbabilityThreshold}%）での最悪のケースで、資産全体が
            <strong>${totalAssetsWorstCase.toLocaleString()} 円</strong>
            （<strong>${totalAssetsChange >= SETTLEMENT_TIMEOUT ? '+' : ''}${totalAssetsChange.toLocaleString()} 円</strong> /
            <strong>${totalAssetsChange >= SETTLEMENT_TIMEOUT ? '+' : ''}${((totalAssetsChange / settings.totalAssets) * PERCENTAGE_DIVISOR).toFixed(DECIMAL_ONE_DIGIT)}%</strong>）
            にまで${totalAssetsChange >= SETTLEMENT_TIMEOUT ? '増加' : '減少'}する可能性があります。
          </p>
          <p style="font-size: 14px; margin-bottom: 5px;"><strong>安眠できますか？</strong></p>
          <p style="font-size: 14px; margin: 0;">できない場合は、投資比率を下げてください。</p>
        </div>
      `)

      document.body.appendChild(pdfContent)

      // 安眠チェック部分をキャプチャ
      const headerCanvas = await html2canvas(pdfContent, {
        scale: PDF_IMAGE_SCALE,
        backgroundColor: '#ffffff'
      })

      // グラフをキャプチャ
      let chartCanvas: HTMLCanvasElement | null = null
      if (chartRef.current !== null) {
        chartCanvas = await html2canvas(chartRef.current, {
          scale: PDF_IMAGE_SCALE,
          backgroundColor: '#ffffff'
        })
      }

      // グラフの見方のHTML
      const chartGuideDiv = createPDFContentElement(`
        <div style="margin-top: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">グラフの見方</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                <th style="padding: 10px; text-align: left; font-weight: bold;">線の種類</th>
                <th style="padding: 10px; text-align: left; font-weight: bold;">説明</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 40px; height: 3px; background-color: rgb(255, 0, 0); margin-right: 10px;"></div>
                    損益分岐点
                  </div>
                </td>
                <td style="padding: 10px;">初期投資額の位置。この線より左側は損失、右側は利益を示します。</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 40px; height: 3px; background-color: rgb(0, 0, 255); margin-right: 10px;"></div>
                    期待リターン
                  </div>
                </td>
                <td style="padding: 10px;">期待される平均的な結果。最も起こりやすい資産額を示します。</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 40px; height: 3px; background-color: transparent; border-top: 3px dashed rgb(0, 128, 0); margin-right: 10px;"></div>
                    ±1σ (標準偏差)
                  </div>
                </td>
                <td style="padding: 10px;">2本の濃い緑の破線の間に約68%の確率で結果が収まります。</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 40px; height: 3px; background-color: transparent; border-top: 3px dashed rgb(0, 200, 0); margin-right: 10px;"></div>
                    ±2σ (標準偏差)
                  </div>
                </td>
                <td style="padding: 10px;">2本の緑の破線の間に約95%の確率で結果が収まります。</td>
              </tr>
              <tr>
                <td style="padding: 10px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 40px; height: 3px; background-color: transparent; border-top: 3px dashed rgb(255, 255, 0); margin-right: 10px;"></div>
                    ±3σ (標準偏差)
                  </div>
                </td>
                <td style="padding: 10px;">2本の黄色の破線の間に約99.7%の確率で結果が収まります。</td>
              </tr>
            </tbody>
          </table>
        </div>
      `)

      document.body.appendChild(chartGuideDiv)

      const chartGuideCanvas = await html2canvas(chartGuideDiv, {
        scale: PDF_IMAGE_SCALE,
        backgroundColor: '#ffffff'
      })

      // 前提条件のHTML
      const conditionsDiv = createPDFContentElement(`
        <div style="margin-top: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">利用した前提条件</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold; width: 40%;">資産総額</td>
              <td style="padding: 10px;">${settings.totalAssets.toLocaleString()} 円</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">投資比率</td>
              <td style="padding: 10px;">${currentInvestmentRatio}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">投資金額</td>
              <td style="padding: 10px;">${investmentAmount.toLocaleString()} 円</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">投資期間</td>
              <td style="padding: 10px;">${years} 年</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">想定リターン</td>
              <td style="padding: 10px;">${settings.expectedReturn}% / 年</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">想定リスク（標準偏差）</td>
              <td style="padding: 10px;">${settings.risk}% / 年</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">確率閾値</td>
              <td style="padding: 10px;">${currentProbabilityThreshold}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">期待値（平均）</td>
              <td style="padding: 10px;">${Math.floor(mean).toLocaleString()} 円 (${profit >= SETTLEMENT_TIMEOUT ? '+' : ''}${Math.floor(profit).toLocaleString()} 円 / ${profit >= SETTLEMENT_TIMEOUT ? '+' : ''}${((profit / investmentAmount) * PERCENTAGE_DIVISOR).toFixed(DECIMAL_ONE_DIGIT)}%)</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">標準偏差</td>
              <td style="padding: 10px;">${Math.floor(stdDev).toLocaleString()} 円</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">95%信頼区間</td>
              <td style="padding: 10px;">${Math.floor(lowerBound).toLocaleString()} 円 〜 ${Math.floor(upperBound).toLocaleString()} 円</td>
            </tr>
          </table>
        </div>
      `)

      document.body.appendChild(conditionsDiv)

      const conditionsCanvas = await html2canvas(conditionsDiv, {
        scale: PDF_IMAGE_SCALE,
        backgroundColor: '#ffffff'
      })

      // 一時要素を削除
      document.body.removeChild(pdfContent)
      document.body.removeChild(chartGuideDiv)
      document.body.removeChild(conditionsDiv)

      // PDFを作成
      // eslint-disable-next-line new-cap -- jsPDF requires new operator but starts with lowercase
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = PDF_MARGIN

      // 安眠チェック部分を追加
      const headerImgData = headerCanvas.toDataURL('image/png')
      const headerImgWidth = pageWidth - BORDER_WIDTH_THIN * PDF_MARGIN
      const headerImgHeight = (headerCanvas.height * headerImgWidth) / headerCanvas.width
      pdf.addImage(headerImgData, 'PNG', PDF_MARGIN, yPosition, headerImgWidth, headerImgHeight)
      yPosition += headerImgHeight + PDF_SPACING

      // グラフを追加
      if (chartCanvas !== null) {
        const chartImgData = chartCanvas.toDataURL('image/png')
        const chartImgWidth = pageWidth - BORDER_WIDTH_THIN * PDF_MARGIN
        const chartImgHeight = (chartCanvas.height * chartImgWidth) / chartCanvas.width

        // ページに収まらない場合は新しいページに
        if (yPosition + chartImgHeight > pageHeight - PDF_MARGIN) {
          pdf.addPage()
          yPosition = PDF_MARGIN
        }

        pdf.addImage(chartImgData, 'PNG', PDF_MARGIN, yPosition, chartImgWidth, chartImgHeight)
        yPosition += chartImgHeight + PDF_SPACING
      }

      // グラフの見方を追加
      const chartGuideImgData = chartGuideCanvas.toDataURL('image/png')
      const chartGuideImgWidth = pageWidth - BORDER_WIDTH_THIN * PDF_MARGIN
      const chartGuideImgHeight = (chartGuideCanvas.height * chartGuideImgWidth) / chartGuideCanvas.width

      // ページに収まらない場合は新しいページに
      if (yPosition + chartGuideImgHeight > pageHeight - PDF_MARGIN) {
        pdf.addPage()
        yPosition = PDF_MARGIN
      }

      pdf.addImage(chartGuideImgData, 'PNG', PDF_MARGIN, yPosition, chartGuideImgWidth, chartGuideImgHeight)
      yPosition += chartGuideImgHeight + PDF_SPACING

      // 前提条件を追加
      const conditionsImgData = conditionsCanvas.toDataURL('image/png')
      const conditionsImgWidth = pageWidth - BORDER_WIDTH_THIN * PDF_MARGIN
      const conditionsImgHeight = (conditionsCanvas.height * conditionsImgWidth) / conditionsCanvas.width

      // ページに収まらない場合は新しいページに
      if (yPosition + conditionsImgHeight > pageHeight - PDF_MARGIN) {
        pdf.addPage()
        yPosition = PDF_MARGIN
      }

      pdf.addImage(conditionsImgData, 'PNG', PDF_MARGIN, yPosition, conditionsImgWidth, conditionsImgHeight)

      // PDFを保存
      const sanitizedDate = today.replace(/\//g, '-')
      pdf.save(`投資分析レポート_${sanitizedDate}.pdf`)
      toast.success('PDFをダウンロードしました。')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDFの生成に失敗しました。')
    }
  }

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setYears(parseInt(e.target.value, ROUNDING_MULTIPLIER))
  }

  const handleProbabilityThresholdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTempProbabilityThreshold(parseFloat(e.target.value))
  }

  const handleInvestmentRatioChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTempInvestmentRatio(parseFloat(e.target.value))
  }

  const formatCurrency = (value: number): string => value.toLocaleString('ja-JP', { maximumFractionDigits: DECIMAL_FRACTION_DIGITS })

  const formatPercentage = (value: number, base: number): string => ((value / base) * PERCENTAGE_DIVISOR).toFixed(DECIMAL_ONE_DIGIT)

  const getChangeSign = (value: number): string => (value >= SETTLEMENT_TIMEOUT ? '+' : '')

  const getColorStyle = (value: number): { color: string } => ({
    color: value > SETTLEMENT_TIMEOUT ? 'green' : value < SETTLEMENT_TIMEOUT ? 'red' : 'black'
  })

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">📊 資産分布グラフ</h1>
        <Button variant="success" onClick={() => { void generatePDF() }}>
          📥 PDFダウンロード
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <h5>現在の設定</h5>
          <Row>
            <Col md={6}>
              <ul className="mb-0">
                <li>投資額: {formatCurrency(investmentAmount)} 円</li>
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
              onChange={handleYearsChange}
            />
            <Form.Text className="text-muted">
              スライダーを動かして投資期間を変更できます。
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <div ref={chartRef} style={{ height: CHART_HEIGHT }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5>グラフの見方</h5>
          <Table striped bordered>
            <thead>
              <tr>
                <th>線の種類</th>
                <th>説明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: 'rgb(255, 0, 0)',
                      marginRight: '10px'
                    }}></div>
                    損益分岐点
                  </div>
                </td>
                <td>初期投資額の位置。この線より左側は損失、右側は利益を示します。</td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: 'rgb(0, 0, 255)',
                      marginRight: '10px'
                    }}></div>
                    期待リターン
                  </div>
                </td>
                <td>期待される平均的な結果。最も起こりやすい資産額を示します。</td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: 'transparent',
                      borderTop: '3px dashed rgb(0, 128, 0)',
                      marginRight: '10px'
                    }}></div>
                    ±1σ (標準偏差)
                  </div>
                </td>
                <td>2本の濃い緑の破線の間に約68%の確率で結果が収まります。</td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: 'transparent',
                      borderTop: '3px dashed rgb(0, 200, 0)',
                      marginRight: '10px'
                    }}></div>
                    ±2σ (標準偏差)
                  </div>
                </td>
                <td>2本の緑の破線の間に約95%の確率で結果が収まります。</td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: 'transparent',
                      borderTop: '3px dashed rgb(255, 255, 0)',
                      marginRight: '10px'
                    }}></div>
                    ±3σ (標準偏差)
                  </div>
                </td>
                <td>2本の黄色の破線の間に約99.7%の確率で結果が収まります。</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5>統計情報（対数正規分布）</h5>
          <ul className="mb-0">
            <li>
              <Link href="/words?q=mean" style={{ textDecoration: 'none' }}>平均（期待値）</Link>: {formatCurrency(mean)} 円{' '}
              <span style={getColorStyle(profit)}>
                ({getChangeSign(profit)}{formatCurrency(profit)} 円 / {getChangeSign(profit)}{formatPercentage(profit, investmentAmount)}%)
              </span>
            </li>
            <li><Link href="/words?q=stddev" style={{ textDecoration: 'none' }}>標準偏差</Link>: {formatCurrency(stdDev)} 円</li>
            <li><Link href="/words?q=confidence-interval" style={{ textDecoration: 'none' }}>95%信頼区間</Link>: {formatCurrency(lowerBound)} 円 〜 {formatCurrency(upperBound)} 円</li>
          </ul>
          <Form.Text className="text-muted d-block mt-2">
            ※ 対数正規分布でモデル化しています。資産額は常に0以上となり、上方向の可能性が大きくなります。95%の確率で、{years}年後の資産はこの範囲内に収まります。
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
              onChange={handleProbabilityThresholdChange}
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
              onChange={handleInvestmentRatioChange}
            />
            <Form.Text className="text-muted">
              スライダーを動かして投資比率を一時的に変更できます。この変更はこのページでのみ有効です。
            </Form.Text>
          </Form.Group>
          <p className="mb-3">
            投資比率 {currentInvestmentRatio}%、投資額 {formatCurrency(investmentAmount)} 円の場合、{currentProbabilityThreshold}%の確率内での最悪ケースは以下の通りです。
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
                <td>{formatCurrency(worstCaseAssets)} 円</td>
                <td style={getColorStyle(worstCaseLoss)}>
                  {getChangeSign(worstCaseLoss)}{formatCurrency(worstCaseLoss)} 円
                </td>
                <td style={getColorStyle(worstCaseLoss)}>
                  {formatPercentage(worstCaseLoss, investmentAmount)}%
                </td>
              </tr>
              <tr>
                <td><strong>資産全体</strong></td>
                <td>{formatCurrency(totalAssetsWorstCase)} 円</td>
                <td style={getColorStyle(totalAssetsChange)}>
                  {getChangeSign(totalAssetsChange)}{formatCurrency(totalAssetsChange)} 円
                </td>
                <td style={getColorStyle(totalAssetsChange)}>
                  {formatPercentage(totalAssetsChange, settings.totalAssets)}%
                </td>
              </tr>
            </tbody>
          </Table>
          <Form.Text className="text-muted d-block mt-2">
            ※ 下位{(PERCENTAGE_DIVISOR - currentProbabilityThreshold).toFixed(DECIMAL_ONE_DIGIT)}%の確率でこの値を下回ります。<br />
            ※ 資産全体 = 投資部分（{formatCurrency(worstCaseAssets)} 円）+ 非投資部分（{formatCurrency(nonInvestmentAssets)} 円）
          </Form.Text>
          <div className="alert alert-info mt-3" role="alert">
            <strong>💤 安眠チェック</strong><br />
            通常起こり得る確率範囲（{currentProbabilityThreshold}%）での最悪のケースで、資産全体が{' '}
            <strong>{formatCurrency(totalAssetsWorstCase)} 円</strong>
            （<strong>{getChangeSign(totalAssetsChange)}{formatCurrency(totalAssetsChange)} 円</strong> /
            <strong>{getChangeSign(totalAssetsChange)}{formatPercentage(totalAssetsChange, settings.totalAssets)}%</strong>）
            にまで{totalAssetsChange >= SETTLEMENT_TIMEOUT ? '増加' : '減少'}する可能性があります。
            <br />
            <br />
            <strong>安眠できますか？</strong><br />
            できない場合は、投資比率を下げてください。
            <br />
            <br />
            よりローリスク・ローリターンにして対応することもできますが、<Link href="/words?q=mpt" style={{ textDecoration: 'none' }}>MPT</Link>の観点からは投資比率を下げることが推奨されます。
            <br />
            詳しく知りたい方は<Link href="/words?q=tobin-separation" style={{ textDecoration: 'none' }}>トービンの分離定理</Link>を調べてみてください。
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
