'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Container, Card, Button } from 'react-bootstrap'

import setting from '@/setting'
import { useSettings } from '@/contexts/SettingsContext'

export default function Home (): React.JSX.Element {
  const { settings } = useSettings()

  const investmentAmount = settings.totalAssets * settings.investmentRatio / 100

  return (
    <Container className='py-4'>
      <div id='Index' className='d-flex flex-column align-items-center'>
        <h1>{setting.title}</h1>
        <Image id='Logo' className='mt-3 mw-100 border rounded-circle' width={100} height={100} src={`${setting.basePath ?? ''}/tako.png`} alt='Logo' />

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
            <Link href='/settings'>
              <Button variant='primary'>設定を変更</Button>
            </Link>
          </Card.Body>
        </Card>
      </div>
    </Container>
  )
}
