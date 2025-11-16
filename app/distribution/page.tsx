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

export default function DistributionPage (): React.JSX.Element {
  const { settings } = useSettings()
  const [years, setYears] = useState(10)
  const [tempProbabilityThreshold, setTempProbabilityThreshold] = useState<number | null>(null)
  const [tempInvestmentRatio, setTempInvestmentRatio] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // 投資額を計算（一時的な投資比率がある場合はそれを使用）
  const currentInvestmentRatio = tempInvestmentRatio ?? settings.investmentRatio
  const investmentAmount = settings.totalAssets * currentInvestmentRatio / 100

  // 分布のパラメータを計算（対数正規分布）
  const { mean, stdDev, logMean, logStdDev } = useMemo(() => {
    return calculateInvestmentDistribution({
      initialAssets: investmentAmount,
      expectedReturn: settings.expectedReturn,
      risk: settings.risk,
      years
    })
  }, [investmentAmount, settings.expectedReturn, settings.risk, years])

  // グラフ用のデータを生成（対数正規分布）
  const distributionData = useMemo(() => {
    return generateLognormalDistributionData(logMean, logStdDev, 300, 3)
  }, [logMean, logStdDev])

  // 損益分岐点（初期投資額）のインデックスを見つける
  const breakEvenIndex = distributionData.findIndex(d => d.x >= investmentAmount)

  // 期待リターン（平均値）のインデックスを見つける
  const expectedReturnIndex = distributionData.findIndex(d => d.x >= mean)

  // ±1σのインデックスを見つける
  const plusOneSigmaIndex = distributionData.findIndex(d => d.x >= mean + stdDev)
  const minusOneSigmaIndex = distributionData.findIndex(d => d.x >= mean - stdDev)

  // ±2σのインデックスを見つける
  const plusTwoSigmaIndex = distributionData.findIndex(d => d.x >= mean + 2 * stdDev)
  const minusTwoSigmaIndex = distributionData.findIndex(d => d.x >= mean - 2 * stdDev)

  // ±3σのインデックスを見つける
  const plusThreeSigmaIndex = distributionData.findIndex(d => d.x >= mean + 3 * stdDev)
  const minusThreeSigmaIndex = distributionData.findIndex(d => d.x >= mean - 3 * stdDev)

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
        text: `${years}年後の投資資産分布（対数正規分布）`
      },
      annotation: {
        annotations: {
          breakEvenLine: {
            type: 'line' as const,
            xMin: breakEvenIndex,
            xMax: breakEvenIndex,
            borderColor: 'rgb(255, 0, 0)',
            borderWidth: 2,
            label: {
              display: true,
              content: '損益分岐点',
              position: 'start' as const
            }
          },
          expectedReturnLine: {
            type: 'line' as const,
            xMin: expectedReturnIndex,
            xMax: expectedReturnIndex,
            borderColor: 'rgb(0, 0, 255)',
            borderWidth: 2,
            label: {
              display: true,
              content: '期待リターン',
              position: 'end' as const
            }
          },
          plusOneSigmaLine: {
            type: 'line' as const,
            xMin: plusOneSigmaIndex,
            xMax: plusOneSigmaIndex,
            borderColor: 'rgb(0, 128, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false
            }
          },
          minusOneSigmaLine: {
            type: 'line' as const,
            xMin: minusOneSigmaIndex,
            xMax: minusOneSigmaIndex,
            borderColor: 'rgb(0, 128, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false
            }
          },
          plusTwoSigmaLine: {
            type: 'line' as const,
            xMin: plusTwoSigmaIndex,
            xMax: plusTwoSigmaIndex,
            borderColor: 'rgb(0, 200, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false
            }
          },
          minusTwoSigmaLine: {
            type: 'line' as const,
            xMin: minusTwoSigmaIndex,
            xMax: minusTwoSigmaIndex,
            borderColor: 'rgb(0, 200, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false
            }
          },
          plusThreeSigmaLine: {
            type: 'line' as const,
            xMin: plusThreeSigmaIndex,
            xMax: plusThreeSigmaIndex,
            borderColor: 'rgb(255, 255, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false
            }
          },
          minusThreeSigmaLine: {
            type: 'line' as const,
            xMin: minusThreeSigmaIndex,
            xMax: minusThreeSigmaIndex,
            borderColor: 'rgb(255, 255, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false
            }
          }
        }
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
            // この金額以下になる確率を計算（対数正規分布のCDF）
            const cdfValue = lognormalCDF(value, logMean, logStdDev)
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

  // 95%信頼区間を計算（対数正規分布）
  // 対数正規分布の95%信頼区間: exp(logMean ± 1.96 × logStdDev)
  const lowerBound = Math.exp(logMean - 1.96 * logStdDev)
  const upperBound = Math.exp(logMean + 1.96 * logStdDev)

  // 利益額を計算
  const profit = mean - investmentAmount

  // 確率閾値に基づく最悪ケースを計算（対数正規分布）
  // 確率閾値が90%の場合、下位10%に相当する値を求める
  // tempProbabilityThresholdがnullでない場合はそれを使用、nullの場合はsettingsの値を使用
  const currentProbabilityThreshold = tempProbabilityThreshold ?? settings.probabilityThreshold
  const probabilityDecimal = currentProbabilityThreshold / 100
  // 下位(100-閾値)%のz値を求める
  const zScore = normalInverseCDF(1 - probabilityDecimal)
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
      const pdfContent = document.createElement('div')
      pdfContent.style.width = '800px'
      pdfContent.style.padding = '40px'
      pdfContent.style.backgroundColor = '#ffffff'
      pdfContent.style.fontFamily = 'sans-serif'
      pdfContent.style.position = 'absolute'
      pdfContent.style.left = '-9999px'

      // タイトルと日付
      const today = new Date().toLocaleDateString('ja-JP')
      pdfContent.innerHTML = `
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
            （<strong>${totalAssetsChange >= 0 ? '+' : ''}${totalAssetsChange.toLocaleString()} 円</strong> /
            <strong>${totalAssetsChange >= 0 ? '+' : ''}${((totalAssetsChange / settings.totalAssets) * 100).toFixed(1)}%</strong>）
            にまで${totalAssetsChange >= 0 ? '増加' : '減少'}する可能性があります。
          </p>
          <p style="font-size: 14px; margin-bottom: 5px;"><strong>安眠できますか？</strong></p>
          <p style="font-size: 14px; margin: 0;">できない場合は、投資比率を下げてください。</p>
        </div>
      `

      document.body.appendChild(pdfContent)

      // 安眠チェック部分をキャプチャ
      const headerCanvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: '#ffffff'
      })

      // グラフをキャプチャ
      let chartCanvas: HTMLCanvasElement | null = null
      if (chartRef.current != null) {
        chartCanvas = await html2canvas(chartRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        })
      }

      // グラフの見方のHTML
      const chartGuideDiv = document.createElement('div')
      chartGuideDiv.style.width = '800px'
      chartGuideDiv.style.padding = '40px'
      chartGuideDiv.style.backgroundColor = '#ffffff'
      chartGuideDiv.style.fontFamily = 'sans-serif'
      chartGuideDiv.style.position = 'absolute'
      chartGuideDiv.style.left = '-9999px'

      chartGuideDiv.innerHTML = `
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
      `

      document.body.appendChild(chartGuideDiv)

      const chartGuideCanvas = await html2canvas(chartGuideDiv, {
        scale: 2,
        backgroundColor: '#ffffff'
      })

      // 前提条件のHTML
      const conditionsDiv = document.createElement('div')
      conditionsDiv.style.width = '800px'
      conditionsDiv.style.padding = '40px'
      conditionsDiv.style.backgroundColor = '#ffffff'
      conditionsDiv.style.fontFamily = 'sans-serif'
      conditionsDiv.style.position = 'absolute'
      conditionsDiv.style.left = '-9999px'

      conditionsDiv.innerHTML = `
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
              <td style="padding: 10px;">${Math.floor(mean).toLocaleString()} 円 (${profit >= 0 ? '+' : ''}${Math.floor(profit).toLocaleString()} 円 / ${profit >= 0 ? '+' : ''}${((profit / investmentAmount) * 100).toFixed(1)}%)</td>
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
      `

      document.body.appendChild(conditionsDiv)

      const conditionsCanvas = await html2canvas(conditionsDiv, {
        scale: 2,
        backgroundColor: '#ffffff'
      })

      // 一時要素を削除
      document.body.removeChild(pdfContent)
      document.body.removeChild(chartGuideDiv)
      document.body.removeChild(conditionsDiv)

      // PDFを作成
      // eslint-disable-next-line new-cap
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      let yPosition = margin

      // 安眠チェック部分を追加
      const headerImgData = headerCanvas.toDataURL('image/png')
      const headerImgWidth = pageWidth - 2 * margin
      const headerImgHeight = (headerCanvas.height * headerImgWidth) / headerCanvas.width
      pdf.addImage(headerImgData, 'PNG', margin, yPosition, headerImgWidth, headerImgHeight)
      yPosition += headerImgHeight + 10

      // グラフを追加
      if (chartCanvas != null) {
        const chartImgData = chartCanvas.toDataURL('image/png')
        const chartImgWidth = pageWidth - 2 * margin
        const chartImgHeight = (chartCanvas.height * chartImgWidth) / chartCanvas.width

        // ページに収まらない場合は新しいページに
        if (yPosition + chartImgHeight > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartImgWidth, chartImgHeight)
        yPosition += chartImgHeight + 10
      }

      // グラフの見方を追加
      const chartGuideImgData = chartGuideCanvas.toDataURL('image/png')
      const chartGuideImgWidth = pageWidth - 2 * margin
      const chartGuideImgHeight = (chartGuideCanvas.height * chartGuideImgWidth) / chartGuideCanvas.width

      // ページに収まらない場合は新しいページに
      if (yPosition + chartGuideImgHeight > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }

      pdf.addImage(chartGuideImgData, 'PNG', margin, yPosition, chartGuideImgWidth, chartGuideImgHeight)
      yPosition += chartGuideImgHeight + 10

      // 前提条件を追加
      const conditionsImgData = conditionsCanvas.toDataURL('image/png')
      const conditionsImgWidth = pageWidth - 2 * margin
      const conditionsImgHeight = (conditionsCanvas.height * conditionsImgWidth) / conditionsCanvas.width

      // ページに収まらない場合は新しいページに
      if (yPosition + conditionsImgHeight > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }

      pdf.addImage(conditionsImgData, 'PNG', margin, yPosition, conditionsImgWidth, conditionsImgHeight)

      // PDFを保存
      pdf.save(`投資分析レポート_${today.replace(/\//g, '-')}.pdf`)
      toast.success('PDFをダウンロードしました。')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDFの生成に失敗しました。')
    }
  }

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
          <div ref={chartRef} style={{ height: '400px' }}>
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
              <Link href="/words?q=mean" style={{ textDecoration: 'none' }}>平均（期待値）</Link>: {mean.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円{' '}
              <span style={{ color: profit > 0 ? 'green' : profit < 0 ? 'red' : 'black' }}>
                ({profit >= 0 ? '+' : ''}{profit.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円 / {profit >= 0 ? '+' : ''}{((profit / investmentAmount) * 100).toFixed(1)}%)
              </span>
            </li>
            <li><Link href="/words?q=stddev" style={{ textDecoration: 'none' }}>標準偏差</Link>: {stdDev.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</li>
            <li><Link href="/words?q=confidence-interval" style={{ textDecoration: 'none' }}>95%信頼区間</Link>: {lowerBound.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円 〜 {upperBound.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</li>
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
          <div className="alert alert-info mt-3" role="alert">
            <strong>💤 安眠チェック</strong><br />
            通常起こり得る確率範囲（{currentProbabilityThreshold}%）での最悪のケースで、資産全体が{' '}
            <strong>{totalAssetsWorstCase.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</strong>
            （<strong>{totalAssetsChange >= 0 ? '+' : ''}{totalAssetsChange.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円</strong> /
            <strong>{totalAssetsChange >= 0 ? '+' : ''}{((totalAssetsChange / settings.totalAssets) * 100).toFixed(1)}%</strong>）
            にまで{totalAssetsChange >= 0 ? '増加' : '減少'}する可能性があります。
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
