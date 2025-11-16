'use client'

import React, { useEffect, useRef } from 'react'
import { Container, Card } from 'react-bootstrap'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const SCROLL_OFFSET = 100
const HIGHLIGHT_BACKGROUND = '#fffbcc'
const DEFAULT_BACKGROUND = 'white'
const TRANSITION_DURATION = '0.3s'

interface Term {
  id: string
  title: string
  description: React.ReactNode
}

const terms: Term[] = [
  {
    id: 'mean',
    title: '平均（期待値）',
    description: '投資における平均（期待値）とは、将来得られると予想される資産額の平均的な値を指します。このアプリケーションでは、初期投資額に期待リターン率を複利で適用して計算されます。例えば、100万円を年率7.5%で10年間運用した場合、平均的には約206万円になると期待されます。これは最も起こりやすい結果の目安となりますが、実際の結果はリスク（標準偏差）によって上下にばらつきます。'
  },
  {
    id: 'stddev',
    title: '標準偏差',
    description: '標準偏差は、投資のリスク（不確実性）を数値化したものです。具体的には、将来の資産額が平均からどの程度ばらつくかを示します。標準偏差が大きいほど、結果の変動幅が大きくなります。正規分布を仮定すると、約68%の確率で「平均±1標準偏差」の範囲に、約95%の確率で「平均±2標準偏差」の範囲に結果が収まります。例えば、100万円を年率10%のリターンと15%のリスクの資産に1年間投資した場合、平均は110万円（100万円×1.10）、標準偏差は約16.5万円（110万円×0.15）となります。つまり、約68%の確率で93.5万円〜126.5万円の範囲に、約95%の確率で77万円〜143万円の範囲に結果が収まると予想されます。このアプリケーションでは、年間リスク率と投資期間から標準偏差を計算しています。'
  },
  {
    id: 'confidence-interval',
    title: '95%信頼区間',
    description: '95%信頼区間とは、将来の資産額が95%の確率で収まる範囲を示します。正規分布を仮定すると、平均±1.96標準偏差の範囲が95%信頼区間となります。例えば、10年後の資産の平均が200万円、標準偏差が50万円の場合、95%信頼区間は約102万円〜298万円となります。つまり、95%の確率でこの範囲内に資産額が収まり、残りの5%（上下各2.5%）の確率で範囲外になることを意味します。投資の不確実性を理解するための重要な指標です。'
  },
  {
    id: 'mpt',
    title: 'MPT（現代ポートフォリオ理論）',
    description: (
      <>
        MPT（Modern Portfolio Theory、現代ポートフォリオ理論）は、ハリー・マーコウィッツが1952年に提唱した投資理論です。リスクとリターンのトレードオフを数学的に分析し、効率的なポートフォリオ（資産の組み合わせ）を構築する方法を示します。主要な概念として、分散投資によってリスクを低減できることや、リスク許容度に応じた最適な資産配分が存在することが挙げられます。<Link href="/words?q=tobin-separation" style={{ textDecoration: 'none' }}>トービンの分離定理</Link>は、このMPTの重要な拡張理論の一つです。
      </>
    )
  },
  {
    id: 'market-portfolio',
    title: 'マーケット・ポートフォリオ',
    description: (
      <>
        マーケット・ポートフォリオ（Market Portfolio）は、市場に存在するすべてのリスク資産を、その時価総額に比例した割合で保有するポートフォリオです。<Link href="/words?q=mpt" style={{ textDecoration: 'none' }}>現代ポートフォリオ理論（MPT）</Link>において、最も効率的なリスク資産の組み合わせとされています。実務上は、世界株式インデックスファンドなどの幅広く分散されたポートフォリオがマーケット・ポートフォリオの近似として用いられます。<Link href="/words?q=tobin-separation" style={{ textDecoration: 'none' }}>トービンの分離定理</Link>では、すべての投資家は個人のリスク許容度に関わらず、同じマーケット・ポートフォリオを保有すべきだとされています。
      </>
    )
  },
  {
    id: 'tobin-separation',
    title: 'トービンの分離定理',
    description: (
      <>
        トービンの分離定理（Tobin&apos;s Separation Theorem）は、ジェームズ・トービンが提唱したポートフォリオ理論の重要な定理です。この定理によれば、投資家のリスク許容度に応じた資産配分は、「<Link href="/words?q=market-portfolio" style={{ textDecoration: 'none' }}>マーケット・ポートフォリオ</Link>」と「無リスク資産（現金など）」の2つに分離できます。つまり、リスクを調整したい場合、リスク資産の中身を変更するのではなく、マーケット・ポートフォリオと無リスク資産の配分比率を変えるべきだということです。このアプリケーションでは、投資比率を下げる（無リスク資産の比率を上げる）ことが、リスク・リターンの組み合わせを変えずにリスクを下げる推奨方法として説明されています。
      </>
    )
  }
]

export default function WordsPage (): React.JSX.Element {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')
  const termRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (q === null || q === '') {
      return
    }

    const element = termRefs.current[q]
    if (element === null || element === undefined) {
      return
    }

    // スクロール位置を調整（ヘッダー分のオフセットを考慮）
    const elementPosition = element.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: elementPosition - SCROLL_OFFSET,
      behavior: 'smooth'
    })
  }, [q])

  return (
    <Container className="py-5">
      <h1 className="mb-4">📚 用語集</h1>
      <p className="mb-4">
        投資シミュレーションで使用される用語について解説します。
      </p>

      {terms.map((term) => (
        <Card
          key={term.id}
          className="mb-3"
          ref={(el) => { termRefs.current[term.id] = el }}
          style={{
            backgroundColor: q === term.id ? HIGHLIGHT_BACKGROUND : DEFAULT_BACKGROUND,
            transition: `background-color ${TRANSITION_DURATION} ease`
          }}
        >
          <Card.Body>
            <Card.Title>{term.title}</Card.Title>
            <Card.Text>{term.description}</Card.Text>
          </Card.Body>
        </Card>
      ))}
    </Container>
  )
}
