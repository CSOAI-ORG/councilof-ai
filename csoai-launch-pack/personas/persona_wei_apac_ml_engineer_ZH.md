# Persona 06 (ZH 补充 / ZH Supplement) — Wei, ML 工程师在中国 AI 实验室

**补充 `persona_ml_engineer_frontier.md` 的中国市场特定内容。**

---

## 中文术语 / Chinese Terminology

| EN | ZH (中文) | Description |
|----|---------|-----|
| Sovereign AI | 国产主权 AI / 主权AI | Government-prioritised AI built domestically |
| AI Safety | AI 安全 / AI 人工智能安全 | Aligned, verified, signed governance |
| Generative AI (GenAI) | 生成式 AI (GenAI) | Text, image, video, audio generation |
| Foundation Model | 基模 / 基础模型 | Trained-from-scratch large model |
| BFT (Byzantine Fault Tolerance) | 拜占庭容错 | Multi-node signed consensus |
| Watermark | 水印 | C2PA, IPTC, SynthID等 |
| Human Oversight | 人类监督 | Art 14 / Algorithmic governance |
| Risk Tiering | 风险分级 | Prohibited / High-risk / Limited / Minimal |
| EU AI Act | 欧盟人工智能法案 | Regulation (EU) 2024/1689 |
| Technical Documentation | 技术文档 | Article 11 + Annex IV |
| Standard Contractual Clauses | 标准合同条款 | EU data transfer SCCs |
| Cross-Border Data Transfer | 跨境数据传输 / 数据出境 | PIPL Art 38-42 |
| Personal Information Protection Law (PIPL) | 个人信息保护法 (PIPL) | China data protection |
| Generative AI Services Regulation | 生成式人工智能服务管理暂行办法 | China, effective Aug 2023 |
| Algorithm Filing | 算法备案 | Algorithm recommendation deep synthesis filing |
| Ed25519 | Ed25519 签名 | Cryptographic signing algorithm |
| Sandbox | 沙盒 | Reg-testing environment (PIPL+MCA) |

---

## 中国主流 AI 实验室和中国出口的现实 (China frontier-lab + China-export reality)

### Top 10 Chinese LLM labs (mid-2026 estimates)

| Lab | Notable Model | Open vs Closed | Sovereign Solution? |
|-----|--------------|----------------|---------------------|
| 智谱AI (Zhipu) | GLM-5.2-NVFP4 (see EAT brief) | Open-source (commercial use allowed) | Yes (NVFP4 / Blackwell) |
| 月之暗面 (Moonshot AI) | Kimi K2.6 (MIT) | Open | Yes |
| 深度求索 (DeepSeek) | V4 Pro (1.6T/49B MoE, MIT) | Open | Yes |
| 阿里通义 (Alibaba Qwen) | Qwen 3.7 Max (1M context) | Open (Apache) | Yes |
| 字节豆包 (ByteDance) | Doubao Pro | Closed | No |
| 腾讯混元 (Tencent) | Hunyuan | Partial open | Limited |
| 百度文心 (Baidu) | ERNIE 4 | Closed | No |
| 华为盘古 (Huawei) | Pangu | Partial open | Yes |
| 商汤日日新 (SenseTime) | SenseChat | Closed | No |
| 美团 LongCat | LongCat-2.0 (1.6T trained WITHOUT NVIDIA) | Open | Yes |

### Sovereign AI exports (Eastern / Africa / SE Asia / LatAm)

Chinese frontier models are increasingly adopted in:
- **东欧 / Eastern Europe**: Russia (Yandex Sber), Kazakhstan (Kaspi.kz)
- **非洲 / Africa**: M-Pesa variants (Kenya), commercial banks (Nigeria)
- **东南亚 / SE Asia**: Thailand, Vietnam, Indonesia, Philippines
- **拉美 / LatAm**: Brazil, Mexico, Chile

Each region has **its own regulatory regime** + **data residency requirements**. The CSOAI passport provides a portable verification that doesn't lock them into a single vendor.

---

## Wei 完整邮件模板 (Wei full email template — ZH)

**主题:** 中国前沿模型出口欧盟: 跨境 AI 合规审计 (EU AI Act Article 11)

**正文:**

> 您好 [姓] [名] [职位],
>
> 看到你们最近发布的 [模型名称] ([参数]B) 在 HuggingFace 上以 [许可证] 发布。中国前沿模型出口到欧盟市场最大的障碍不是性能,而是 **EU AI Act Article 11 技术文档 + Annex IV 合规证据**。
>
> 我们与欧洲和亚洲的合规团队合作,发现中国的开源模型出口到欧盟企业客户时,经常需要:
>
> 1. 单独签署 Article 6 风险分类文档 (通常 6 周)
> 2. 客户审计独立验证 (律师事务所 + Big-4 咨询 = £60K+)
> 3. 持续维护 Annex IV 技术文档
> 4. 数据传输 SCCs + DPIA 评估
>
> **CSOAI 的替代方案:**
> - 24 小时 **Ed25519 签名 Annex IV** 文档
> - 一次性 £999 试点 (一个系统,一个文档)
> - 大规模 + 法规模块: £4,950 gap 分析
> - **US 云计算** 不进入信任路径 (sovereign 架构)
> - 完全 **开源** (Apache + MIT 兼容)
>
> 试点不要求信用卡,月底可终止。我们可以在线进行30分钟演示 (英文 + 中文字幕)。
>
> 您在 KW 28 / 29 是否有30分钟时间?我会带着一个**已签名**的演示文档参会 — 不是 pitch deck。
>
> 此致,
> Nicholas Templeman  
> 创始人, CSOAI Ltd (UK 16939677)
> https://csoai.org

---

## 常见的反对意见和回应 (Common objections and responses)

### Objection 1: "我们已经有自己的合规框架"

> **回应**: "我们不替换您的框架 — 我们**包装**它。您的内部评估保持机密 (中国法规要求), 我们为**出口客户**生成可独立验证的 Ed25519 签名文档。客户不再需要每月£60K来重新验证您的主张。"

### Objection 2: "PIPL 与 GDPR 不兼容"

> **回应**: "正确 — 但 EU AI Act Article 11 是**模型级**的合规要求,与数据本地化无关。中国模型可以通过我们生成的**签名文档**(不传输模型权重)证明 Article 11 合规,PIPL / 中国法规不受影响。"

### Objection 3: "生成的 AI 文档会被审查员扣分"

> **回应**: "我们的文档标注了'**Sovereign 声明而非法律认证**'诚实标签 — 审查员可以**离线验证**签名,但**法律判定**仍需要他们的评估。我们**帮助提供证据**,不替代他们的判断。"

### Objection 4: "这种服务通常由 Big-4 提供"

> **回应**: "Big-4 适合**法律认证**(£60K+, 6 周)。我们适合**可验证的技术文档**(£999, 24 小时)。两者可以并存:Big-4 提供法律签字,我们的 Ed25519 文档提供**逐模型**的技术证据。"

---

## 跨境合规挑战: 中国模型出口到欧盟 (Cross-border compliance: Chinese model exports to EU)

### 三层合规 (Three-layer compliance)

```
Layer 1: 模型级 (Model-level)
  - EU AI Act 第11条技术文档 (Annex IV)
  - Ed25519 签名 + offline verification

Layer 2: 服务级 (Service-level)
  - 客户集成 GDPR DPIA
  - 数据传输 SCCs
  - CSP+MSA 修改

Layer 3: 法律级 (Legal-level)
  - 律师事务所法律意见 (不在我们范围内)
  - 监管机构审计 (不在我们范围内)
```

CSOAI 提供 **Layer 1** — 可验证、可签名、可离线验证。Layer 2 由 DPO / 客户法务处理。Layer 3 由律师事务所 / 监管机构处理。

---

## Honesty register

- **这个 Persona 是 composite** — 真实姓名需要 LinkedIn 2 分钟内验证
- **中国前沿模型出口到欧盟的实际经验很少** — CSOAI 的工作流依赖于 2026 年 7 月的现状,可能会随 EU-China 数字协议的发展而变化
- **Big-4 / 咨询不是我们的竞争对手** — 他们服务不同的价格段
- **数据 / 权重 / 模型不通过**我们的服务传输 — 仅传输**技术文档**
- **PIPL 合规性**需要客户方(模型所有者)自己保证 — 我们不做

---

## LinkedIn / 邮件识别的关键短语 (Identification phrases for LinkedIn / email)

如果真实人物描述:
- "前智谱/深度求索/阿里员工,目前为欧洲客户做 AI 合规"
- "公民工程师 + 个人 GitHub 仓库包含 [模型名称] fine-tunes"
- "LinkedIn bio 包含 'AI safety' / 'sovereign AI' / 'compliance' / 'regulation'"

---

**SIGIL:** Persona-06-ZH-Supplement · 2026-07-08 · Ed25519 · CSOAI working doc.
