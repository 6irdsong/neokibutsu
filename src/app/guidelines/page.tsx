import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ガイドライン - NEO鬼仏表',
  robots: { index: true, follow: true },
}

export default function GuidelinesPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold m-0 mt-4 mb-4">ガイドライン</h1>

      <div className="bg-card-bg border border-border rounded-md p-6 max-md:p-4 leading-[1.8] text-sm [&_h2]:mt-8 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1.5 [&_ol_li]:mb-1.5">
        <p className="text-dark-gray text-[13px]">最終更新日: 2026年3月29日</p>

        <p>
          NEO鬼仏表は、北海道大学の学生が履修選択の参考にするための講義評価共有サイトです。このページでは、投稿時の注意事項と、削除対象となる投稿・ならない投稿の基準を定めています。<Link href="/terms" className="text-link">利用規約</Link>第5条（投稿の管理）の具体的な運用方針にあたります。
        </p>

        <h2>投稿について</h2>
        <p>
          NEO鬼仏表への投稿は、送信後に投稿者自身が編集・削除することはできません。誤った情報を投稿してしまった場合は、お問い合わせから運営にご連絡ください。
        </p>
        <p>
          以下に定める削除基準に該当すると運営が判断した投稿は、予告なく削除されることがあります。投稿を含む本サービスの利用をもって、<Link href="/terms" className="text-link">利用規約</Link>の内容に同意したものとみなされます。
        </p>

        <h2>削除対象となる投稿</h2>

        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">1. 誹謗中傷・人格攻撃</h3>
            <p className="m-0 mb-2">
              講義の内容・進め方・評価方法に対する批判と、教員個人の容姿・性格・人格に対する攻撃は区別しています。前者は講義評価として有用な情報ですが、後者は後輩の履修判断に寄与せず、個人を傷つけるだけの投稿です。
            </p>
            <p className="m-0 mb-2">
              「授業の進め方がよくない」「説明がわかりにくい」といった表現は、表現が直接的であっても講義への評価として扱います。一方で、「あの先生はクズ」「人としておかしい」のように、講義の内容から離れて人格そのものを否定する表現は削除対象です。
            </p>
            <p className="m-0">
              境界が曖昧なケースもありますが、「講義や制度の話をしているか、人の話をしているか」を基本的な判断軸としています。
            </p>
          </div>

          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">2. 個人情報の掲載</h3>
            <p className="m-0 mb-2">
              メールアドレス、電話番号、SNSアカウント、学籍番号など、特定の個人を識別できる情報を含む投稿は削除対象です。これは教員・学生を問わず適用されます。
            </p>
            <p className="m-0">
              教員の氏名については、大学が公式に公開している情報（シラバス、教員一覧など）であるため、個人情報には該当しません。ただし、教員の私的な連絡先や自宅住所など、大学が公開していない情報は削除対象となります。
            </p>
          </div>

          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">3. 虚偽の情報</h3>
            <p className="m-0 mb-2">
              事実と異なる内容を意図的に広める投稿は削除対象です。ただし、この判断は実際には非常に難しいものです。
            </p>
            <p className="m-0 mb-2">
              同じ講義名であっても、受講した年度、担当教員、クラスによって授業の内容や雰囲気は大きく変わることがあります。ある人にとっての事実が、別の人にとっては事実と異なるように見える場合があります。また、運営は個別の講義に出席しているわけではないため、投稿内容の真偽を独自に確認する手段を持っていません。
            </p>
            <p className="m-0">
              そのため、「事実と異なる」という理由で通報される場合は、どの記述が、どのような根拠で事実と異なるのかを具体的に記載してください。「嘘が書いてある」「事実と違う」といった通報だけでは、判断材料が不足しているため対応が困難です。具体的な根拠が示されない場合は、投稿者の体験に基づく記述として扱い、削除は行いません。
            </p>
          </div>

          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">4. スパム・荒らし</h3>
            <p className="m-0">
              同じ内容を繰り返し投稿する行為、講義評価と無関係な宣伝・広告、意味のない文字列の投稿などが対象です。特定の講義や教員に対して短期間に大量の同一評価が投稿された場合も、荒らし行為として対応することがあります。
            </p>
          </div>
        </div>

        <h2>削除対象にならない投稿</h2>

        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">1. 講義や制度に対する批判的な評価</h3>
            <p className="m-0 mb-2">
              「授業がつまらない」「テストが理不尽だった」「単位が取りにくすぎる」のような投稿は、表現が厳しいものであっても削除対象にはなりません。これらは講義の内容や評価方法に対する意見であり、後輩の履修判断にとって参考になる情報です。
            </p>
            <p className="m-0">
              「楽単」「地雷」といった表現も、講義に対する評価として扱います。このサイトの目的は講義の率直な評価を共有することであり、表現が丁寧でないという理由で削除を行うことはありません。
            </p>
          </div>

          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">2. 受講体験に基づく個人の感想</h3>
            <p className="m-0 mb-2">
              投稿者が自分の体験として書いている内容は、他の受講者の体験と異なっていても削除対象にはなりません。同じ講義に対して正反対の評価が並ぶこともありますが、それぞれの体験は等しく尊重されます。
            </p>
            <p className="m-0">
              「自分はそう思わなかったから消してほしい」という通報には対応しません。異なる意見がある場合は、ご自身の体験を新たに投稿してください。
            </p>
          </div>

          <div className="bg-bg rounded-md p-4 border border-border/50">
            <h3 className="font-bold text-[14px] m-0 mb-2">3. 厳しい評価や低い評点</h3>
            <p className="m-0">
              「ど鬼」の評価がついていることや、全体的に厳しい内容の投稿であることは、それ自体では削除の理由にはなりません。評価の高低に関わらず、上記の削除対象に該当しない限り、投稿はそのまま掲載されます。
            </p>
          </div>
        </div>

        <h2>具体例</h2>
        <p>
          以下の表は、実際によくある投稿や通報のパターンをもとに、削除の判断例を示したものです。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse [&_td]:py-2 [&_td]:px-3 [&_td]:border [&_td]:border-border [&_th]:py-2 [&_th]:px-3 [&_th]:border [&_th]:border-border [&_th]:bg-light-gray [&_th]:text-left [&_th]:font-medium">
            <thead>
              <tr>
                <th className="w-1/2">削除しません</th>
                <th className="w-1/2">削除対象</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>「先生の説明がわかりにくい」</td>
                <td>「先生の見た目がキモい」</td>
              </tr>
              <tr>
                <td>「質問に行ったけどまともに取り合ってもらえなかった」</td>
                <td>「あの先生は学生の事情を無視するクズ」</td>
              </tr>
              <tr>
                <td>「テストが理不尽だった」</td>
                <td>「この講義の受講者は全員バカ」</td>
              </tr>
              <tr>
                <td>「先生は〇〇先生です」（シラバス記載の氏名）</td>
                <td>「〇〇先生のメールアドレスは xxx@…」</td>
              </tr>
              <tr>
                <td>「出席がないから楽単」（投稿者の体験）</td>
                <td>「出席なし」と書いて大量に同じ投稿を繰り返す</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>通報を受けてからの対応</h2>
        <p>
          通報を受けた投稿は、運営が上記の基準に照らして確認し、削除するかどうかを判断します。通報されたすべての投稿が削除されるわけではありません。基準に該当しないと判断した場合は、通報を却下します。
        </p>
        <p>
          北大アカウントでログインしている場合は、対応結果をお知らせ機能から確認できます。ログインしていない場合は通知されません。対応結果の通知を受け取りたい場合は、ログインした状態で通報してください。
        </p>
        <p>
          なお、ログインして通報した場合でも、通報者のアカウント情報が管理者に伝わることはありません。
        </p>

        <hr className="border-0 border-t border-border my-6" />
        <p className="text-center">
          <Link href="/terms" className="text-dark-gray">利用規約</Link>
          <span className="mx-2.5 text-dark-gray">|</span>
          <Link href="/privacy" className="text-dark-gray">プライバシーポリシー</Link>
          <span className="mx-2.5 text-dark-gray">|</span>
          <Link href="/" className="text-dark-gray">トップページに戻る</Link>
        </p>
      </div>
    </main>
  )
}
