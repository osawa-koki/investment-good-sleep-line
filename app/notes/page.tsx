'use client'

import React from 'react'
import { Container, Card, Alert } from 'react-bootstrap'
import Link from 'next/link'

export default function NotesPage (): React.JSX.Element {
  return (
    <Container className="py-5">
      <h1 className="mb-4">⚠️ 注意事項</h1>
      <p className="mb-4">
        このアプリケーションは投資シミュレーションツールです。以下の前提条件と制限事項を理解した上でご利用ください。
      </p>

      <Alert variant="warning" className="mb-4">
        <Alert.Heading>免責事項</Alert.Heading>
        <p className="mb-0">
          このツールは教育目的で作成されたものであり、実際の投資判断の唯一の根拠とすることは推奨されません。投資は自己責任で行ってください。
        </p>
      </Alert>

      <Card className="mb-4">
        <Card.Body>
          <h5>1. 正規分布の仮定</h5>
          <h6 className="mt-3">仮定内容</h6>
          <p>
            このアプリケーションでは、投資資産の将来価格が<Link href="/words?q=mean" style={{ textDecoration: 'none' }}>正規分布</Link>に従うと仮定しています。
            これにより、<Link href="/words?q=stddev" style={{ textDecoration: 'none' }}>標準偏差</Link>や<Link href="/words?q=confidence-interval" style={{ textDecoration: 'none' }}>信頼区間</Link>を用いた確率的な予測が可能になります。
          </p>
          <h6 className="mt-3">実際の市場との違い</h6>
          <p>
            実際の金融市場における価格変動は、必ずしも正規分布に従いません。主な特徴として以下が挙げられます：
          </p>
          <ul>
            <li><strong>ファットテール（裾野が厚い分布）</strong>: 正規分布が予測するよりも、極端な価格変動（暴落や急騰）が実際には頻繁に発生します。</li>
            <li><strong>歪度（スキュー）</strong>: 価格分布が左右対称でない場合があり、特に下落リスクが上昇利益よりも大きい傾向があります。</li>
            <li><strong>ボラティリティ・クラスタリング</strong>: 価格変動が激しい時期と穏やかな時期が連続する傾向があり、分散が時間的に一定ではありません。</li>
          </ul>
          <p className="mb-0">
            <strong>結論</strong>: 正規分布モデルは「平均的なケース」を理解するには有用ですが、極端な市場変動のリスクを過小評価する可能性があります。
            特に金融危機のような異常事態では、このモデルの予測は大きく外れる可能性があることを認識してください。
          </p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5>2. 各年の価格変動の独立性</h5>
          <h6 className="mt-3">仮定内容</h6>
          <p>
            このアプリケーションでは、各年の価格変動が互いに独立していると仮定しています。
            つまり、ある年の運用成績が翌年の成績に影響を与えないという前提で計算を行っています。
          </p>
          <h6 className="mt-3">実際の市場との違い</h6>
          <p>
            実際の金融市場では、価格変動に以下のような時系列的な依存関係が存在します：
          </p>
          <ul>
            <li><strong>モメンタム効果</strong>: 上昇トレンドや下落トレンドが一定期間継続する傾向があります。好調な年の後は好調が続きやすく、不調な年の後も不調が続きやすい傾向があります。</li>
            <li><strong>平均回帰</strong>: 長期的には、極端に高いリターンや低いリターンは平均に戻る傾向があります。</li>
            <li><strong>景気循環</strong>: 経済サイクル（好況・後退・不況・回復）により、複数年にわたって市場の傾向が継続することがあります。</li>
            <li><strong>自己相関</strong>: 前期の価格変動が今期の価格変動に影響を与える統計的な関係性が観測されることがあります。</li>
          </ul>
          <p className="mb-0">
            <strong>結論</strong>: 独立性の仮定は計算を単純化するために有用ですが、実際の市場では連続した好況期や不況期が発生する可能性があります。
            特に短期的な投資期間（5年未満）では、この仮定からの乖離が大きくなる可能性があることに注意してください。
          </p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5>3. その他の前提条件と制限事項</h5>
          <ul className="mb-0">
            <li><strong>取引コストの無視</strong>: 売買手数料、税金、信託報酬などのコストは考慮されていません。</li>
            <li><strong>リバランスの無視</strong>: ポートフォリオのリバランスや、追加投資・引き出しは考慮されていません。</li>
            <li><strong>インフレの無視</strong>: すべての金額は名目値であり、インフレによる実質的な価値の変動は考慮されていません。</li>
            <li><strong>過去データの外挿</strong>: 期待リターンとリスクの設定は過去のデータに基づくことが多いですが、過去の実績が将来の成果を保証するものではありません。</li>
            <li><strong>破綻リスクの無視</strong>: 投資先の倒産や市場の機能不全などの極端なリスクは考慮されていません。</li>
          </ul>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h5>推奨される使い方</h5>
          <p>このツールは以下のような目的で使用することを推奨します：</p>
          <ul>
            <li>投資の基本的な概念（リスクとリターンの関係）を理解する</li>
            <li>異なる投資比率やリスクレベルでの<strong>大まかな</strong>結果を比較する</li>
            <li>「<Link href="/words?q=tobin-separation" style={{ textDecoration: 'none' }}>トービンの分離定理</Link>」など、投資理論の基本を学ぶ</li>
            <li>自分のリスク許容度を客観的に評価する（「安眠チェック」機能）</li>
          </ul>
          <p className="mb-0">
            <strong>実際の投資判断を行う際は、ファイナンシャルプランナーなどの専門家に相談することを強く推奨します。</strong>
          </p>
        </Card.Body>
      </Card>
    </Container>
  )
}
