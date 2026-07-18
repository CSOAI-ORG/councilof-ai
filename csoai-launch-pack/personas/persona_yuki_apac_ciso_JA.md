---

## 日本APAC市場特有の用語 (日本APAC market terminology)

| EN | JA (and 漢字) |
|----|------------|
| Personal Information | 個人情報 (こじんじょうほう) |
| AI Act | AI 関連法 (AIかんれんぽう) |
| Personal Information Protection Commission | 個人情報保護委員会 |
| Risk classification | リスク分類 / 重要度分類 |
| Human oversight | 人の監督 / 人間による監視 |
| Transparency obligation | 透明性義務 |
| Watermark | 電子透かし (でんしすかし) |
| Data sovereignty | データ主権 / データの国内保管 |
| Sovereign AI | 国産AI / 主権を持つAI |
| APEC Cross-Border Privacy Rules | APEC越境プライバシールール |
| EU/Japan adequacy decision | EU・日本間の十分性認定 |
| Standard contractual clauses | 標準契約条項 (SCCs) |
| DPIA (Data Protection Impact Assessment) | 個人情報保護影響評価 (DPIA) |
| Joint controller | 共同管理者 |

---

## 日本の銀行・保険・製造企業の典型 (Japanese banks/insurance/manufacturers)

| Industry | Compliance Driver | Buying Trigger |
|----------|-------------------|----------------|
| 都市銀行 (City banks: MUFG, Mizuho, SMFG) | FSA + APPI (改正個人情報保護法) | "EU支店向けAI法対応": 規制報告 |
| 損害保険 (Insurance: Tokio Marine, Sompo) | FSA + AI 関連法 | "EU支店向けAI法対応" |
| 自動車 (Auto: Toyota, Honda, Nissan, Subaru) | 個人情報保護法 | "EU向け自動翻訳AI 説明可能性" |
| 製造 (Factory: Fanuc, Komatsu) | ISO/IEC 42001 | "ファシリティ向け予知保全AI" |
| 通信 (Telecom: NTT, KDDI, Rakuten) | 個人情報保護法 + TCC | "グローバル顧客向けAI行動ターゲティング" |

---

## Yuki ペルソナの典型的なアウトリーチ (Yuki persona typical outreach)

> **件名:** 欧州AI法 第50条: 日本企業のEU支店向けコンプライアンス対応
>
> [TITLE] 様:
>
> 日本の大手銀行・保険会社様からEU支店向けのAIガバナンス強化についてお問い合わせが増えています。改正個人情報保護法 + EU AI法 第50条 透明性義務 + AI法 第14条 人間による監視 + DPIA 評価、これらは四半期ごとのコンプライアンス報告の主要項目ですが、現在は外部のBig-4監査に6週間・£60K以上を支払っていただいています。
>
> 私たちの代替案: 24時間で Ed25519署名付きコンプライアンスパスポートを発行、EU支店が独立してオフライン検証可能。USクラウドは信頼経路に入りません (sovereign by design)。
>
> 欧州進出の準備として、以下の項目を確認できます:
>
> 1. **AI法 第6条** リスク分類 (禁止/高リスク/限定/最小) — AI システムの「隠された機能」を発見
> 2. **第14条** 人間による監視レベル (in-loop / on-loop / out-of-loop)
> 3. **第50条** 透かし/電子透かしの実装検証
> 4. **付属書IV** 技術文書 — Ed25519署名付きJSON+XMLバンドル
> 5. **EU・日本十分性認定** 経路でのデータ保護評価
>
> 試験運用: £999 ワンタイム、1システムのみ。次のステップは £4,950 Gap Analysis。クレジットカード不要、月末解約可能。
>
> 30分のミーティングいかがでしょうか？ 28週 / 29週で調整できます。署名済みデモ + アーティファクトを持って参上 (ピッチ資料ではありません)。
>
> よろしくお願いします,
> Nicholas Templeman
> 創業者, CSOAI Ltd (UK 16939677)
> https://csoai.org

---

## よくある質問と回答 (FAQ + answers)

**Q: APEC越境プライバシールール (CBPR) はもう発行されていますか?**
A: はい、APEC CBPR 認証は2014年から運用中ですが、EU AI法 第50条は対象が異なり、 CBPRだけではEU支店での完全なコンプライアンスを保証しません。両方の対応が必要です。

**Q: 電子的透かし (電子透かし) は義務ですか?**
A: AI法第50条第3項 (Regulation (EU) 2024/1689) によると、合成コンテンツ生成の場合は、機械可読な電子透かし (C2PA準拠) の実装が義務です。罰金は世界年間売上高の3%、または€1,500万のいずれか高い方。

**Q: データ主権 (data sovereignty) を保つために?**
A: CSOAI root server が Ed25519署名を実行しますが、データは日本国内に保持できます (sovereign architecture)。詳細についてはデモでご説明します。

**Q: 標準契約条項 (SCCs) は必要ですか?**
A: はい、EU支店からの個人データ転送には引き続きSCCsが必要です。私たちのツールは SCCs の TOM (技術的組織的措置) 部分をサポートできます — 完全なDPIA評価ではありません。

---

## 信頼構築のエレメント (Trust-building elements for JA market)

1. **日本語サポート**: すべてのドキュメント、署名検証、トレーニングを日本語で提供
2. **EU・日本十分性認定の理解**: 私たちはEUデータ転送の法的枠組みを理解しています
3. **ローカルリファレンス**: 日本国内企業 (例: 金融庁登録業者) の事例を優先的に文書化
4. **データローカライゼーション**: 日本のデータは日本国内に保持 (Sovereign architecture)
5. **規制知識**: 改正個人情報保護法 + EU AI法 第50条 + APEC CBPR + ISO/IEC 42001

---

## Honesty register

- **このペルソナは composite** — 実際の名前は LinkedIn InMail で 2分以内に確認可能 (ロール + 企業名)
- **EU AI法の細部は、製品のデプロイ時に更新が必要** — 2026年7月現在の情報
- **SBI / 改正個人情報保護法の解釈は業界依存** — 銀行、保険、製造で異なる — DSBとの対話で個別確認

---

**SIGIL:** Yuki-DE-Supplement · 2026-07-08 · Ed25519 · CSOAI working doc.
