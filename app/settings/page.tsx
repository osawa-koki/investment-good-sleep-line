'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Container, Form, Button, Card, Row, Col, Table, Alert } from 'react-bootstrap'
import { toast } from 'react-toastify'

import { useSettings, type InvestmentSettings, defaultSettings } from '@/contexts/SettingsContext'
import Modal from '@/components/Modal'

// 代表的な資産クラスのリターンとリスク
interface AssetClass {
  name: string
  expectedReturn: number
  risk: number
}

const assetClasses: AssetClass[] = [
  { name: '国内株式', expectedReturn: 5.0, risk: 20.0 },
  { name: '先進国株式', expectedReturn: 7.0, risk: 22.0 },
  { name: '新興国株式', expectedReturn: 8.5, risk: 28.0 },
  { name: '世界株式', expectedReturn: 7.5, risk: 23.0 },
  { name: '国内債券', expectedReturn: 1.0, risk: 3.0 },
  { name: '先進国債券', expectedReturn: 2.5, risk: 8.0 }
]

export default function SettingsPage (): React.JSX.Element {
  const { settings, updateSettings, resetSettings } = useSettings()

  // ローカルフォーム状態
  const [formData, setFormData] = useState<InvestmentSettings>(settings)

  // モーダル状態
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // 未保存の変更があるかチェック
  const hasUnsavedChanges = useMemo(() => {
    return (
      formData.totalAssets !== settings.totalAssets ||
      formData.investmentRatio !== settings.investmentRatio ||
      formData.probabilityThreshold !== settings.probabilityThreshold ||
      formData.expectedReturn !== settings.expectedReturn ||
      formData.risk !== settings.risk
    )
  }, [formData, settings])

  // settingsが変更されたらフォームも更新
  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleChange = (field: keyof InvestmentSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    // バリデーション
    if (formData.totalAssets <= 0) {
      toast.error('資産総額は0より大きい値を入力してください。')
      return
    }

    if (formData.investmentRatio < 0 || formData.investmentRatio > 100) {
      toast.error('投資比率は0〜100の範囲で入力してください。')
      return
    }

    if (formData.probabilityThreshold < 0 || formData.probabilityThreshold > 100) {
      toast.error('確率の閾値は0〜100の範囲で入力してください。')
      return
    }

    if (formData.risk < 0) {
      toast.error('リスクは0以上の値を入力してください。')
      return
    }

    updateSettings(formData)
    toast.success('設定を保存しました。')
  }

  const handleResetClick = (): void => {
    setIsResetModalOpen(true)
  }

  const handleResetConfirm = (): void => {
    resetSettings()
    // フォームも即座にデフォルト値に戻す
    setFormData(defaultSettings)
    setIsResetModalOpen(false)
    toast.info('設定をリセットしました。')
  }

  const handleResetCancel = (): void => {
    setIsResetModalOpen(false)
  }

  const handleApplyAssetClass = (assetClass: AssetClass): void => {
    setFormData(prev => ({
      ...prev,
      expectedReturn: assetClass.expectedReturn,
      risk: assetClass.risk
    }))
    toast.success(`${assetClass.name}のリターンとリスクを適用しました。`)
  }

  // 投資額を計算（リアルタイムで更新）
  const investmentAmount = formData.totalAssets * formData.investmentRatio / 100

  return (
    <Container className="py-5">
      <h1 className="mb-4">⚙️ 投資設定</h1>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>資産総額 (円)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.totalAssets}
                    onChange={handleChange('totalAssets')}
                    min={0}
                    step={100000}
                    required
                  />
                  <Form.Text className="text-muted">
                    あなたの総資産額を入力してください。
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>投資比率 (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.investmentRatio}
                    onChange={handleChange('investmentRatio')}
                    min={0}
                    max={100}
                    step={1}
                    required
                  />
                  <Form.Text className="text-muted">
                    資産のうち何%を投資に回すか (0〜100)。
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>投資額 (円)</Form.Label>
                  <Form.Control
                    type="text"
                    value={investmentAmount.toLocaleString()}
                    readOnly
                    disabled
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    資産総額 × 投資比率 で自動計算されます。
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>確率閾値 (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.probabilityThreshold}
                    onChange={handleChange('probabilityThreshold')}
                    min={0}
                    max={100}
                    step={0.1}
                    required
                  />
                  <Form.Text className="text-muted">
                    何%の可能性まで考慮するか。
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <hr className="my-4" />

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>想定リターン (%/年)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.expectedReturn}
                    onChange={handleChange('expectedReturn')}
                    step={0.1}
                    required
                  />
                  <Form.Text className="text-muted">
                    年間の想定リターン率。
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>想定リスク (標準偏差 %/年)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.risk}
                    onChange={handleChange('risk')}
                    min={0}
                    step={0.1}
                    required
                  />
                  <Form.Text className="text-muted">
                    年間のボラティリティ (標準偏差)。
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">代表的な資産クラスのリターンとリスク</h6>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>資産クラス</th>
                      <th>想定リターン (%/年)</th>
                      <th>想定リスク (%/年)</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetClasses.map((assetClass, index) => (
                      <tr key={index}>
                        <td>{assetClass.name}</td>
                        <td>{assetClass.expectedReturn.toFixed(1)}%</td>
                        <td>{assetClass.risk.toFixed(1)}%</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              handleApplyAssetClass(assetClass)
                            }}
                          >
                            適用
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Form.Text className="text-muted">
                  資産クラスを選択すると、その想定リターンとリスクがフォームに適用されます。
                </Form.Text>
              </Card.Body>
            </Card>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                設定を保存
              </Button>
              <Button variant="secondary" type="button" onClick={handleResetClick}>
                リセット
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {hasUnsavedChanges && (
        <Alert variant="warning" className="mt-4">
          <Alert.Heading>未保存の変更があります。</Alert.Heading>
          <p className="mb-0">
            設定を変更しましたが、まだ保存されていません。変更を保存するには「設定を保存」ボタンをクリックしてください。
          </p>
        </Alert>
      )}

      <Card className="mt-4">
        <Card.Body>
          <h5>現在の設定プレビュー</h5>
          <ul className="mb-0">
            <li>資産総額: {settings.totalAssets.toLocaleString()} 円</li>
            <li>投資比率: {settings.investmentRatio}%</li>
            <li>投資額: {(settings.totalAssets * settings.investmentRatio / 100).toLocaleString()} 円</li>
            <li>確率閾値: {settings.probabilityThreshold}%</li>
            <li>期待リターン: {settings.expectedReturn}% / 年</li>
            <li>リスク: {settings.risk}% / 年</li>
          </ul>
        </Card.Body>
      </Card>

      <Modal
        modalIsOpen={isResetModalOpen}
        closeModal={handleResetCancel}
        contentLabel="設定リセット確認"
      >
        <div className="p-4">
          <h4 className="mb-3">設定をリセットしますか？</h4>
          <p className="mb-4">
            すべての設定がデフォルト値に戻ります。この操作は取り消せません。
          </p>
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={handleResetCancel}>
              キャンセル
            </Button>
            <Button variant="danger" onClick={handleResetConfirm}>
              リセット
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
