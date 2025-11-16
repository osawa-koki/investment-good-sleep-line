'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Container, Card, Button } from 'react-bootstrap'

import setting from '@/setting'
import { useSettings } from '@/contexts/SettingsContext'

const PERCENTAGE_DIVISOR = 100
const IMAGE_SIZE = 100

export default function Home (): React.JSX.Element {
  const { settings } = useSettings()

  const investmentAmount = settings.totalAssets * settings.investmentRatio / PERCENTAGE_DIVISOR
  const basePath = setting.basePath ?? ''
  const logoSrc = `${basePath}/tako.png`

  return (
    <Container className='py-4'>
      <div id='Index' className='d-flex flex-column align-items-center'>
        <h1>{setting.title}</h1>
        <Image id='Logo' className='mt-3 mw-100 border rounded-circle' width={IMAGE_SIZE} height={IMAGE_SIZE} src={logoSrc} alt='Logo' />

        <Card className='mt-4' style={{ maxWidth: '600px' }}>
          <Card.Body>
            <Card.Title>現在の投資設定</Card.Title>
            <div className='mb-3'>
              <p className='mb-2'><strong>資産総額:</strong> {settings.totalAssets.toLocaleString()} 円</p>
              <p className='mb-2'><strong>投資比率:</strong> {settings.investmentRatio}%</p>
              <p className='mb-2'><strong>投資額:</strong> {investmentAmount.toLocaleString()} 円</p>
              <p className='mb-2'><strong>期待リターン:</strong> {settings.expectedReturn}% / 年</p>
              <p className='mb-2'><strong>リスク:</strong> {settings.risk}% / 年</p>
              <p className='mb-0'><strong>確率閾値:</strong> {settings.probabilityThreshold}%</p>
            </div>
            <div className='d-flex gap-2'>
              <Link href='/distribution'>
                <Button variant='success'>シミュレーションを見る</Button>
              </Link>
              <Link href='/settings'>
                <Button variant='primary'>設定を変更</Button>
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  )
}
