# Exports needed — How to pull your actual data

The bundle is useless without the actual messages. Below are the exact export steps for the platforms where you and James likely communicated. **You do this on your Mac, on your phone, or via your web accounts. I cannot do this for you — and any "export" I produced from local data would be a curated subset.**

Run all four in parallel if you can; the bigger ones (Google, Apple) take 10-60 min to deliver.

---

## 1. WhatsApp (most likely the primary channel)

**Per-chat export (fastest, most targeted):**
On iPhone:
1. Open WhatsApp → tap the chat with James
2. Tap his name at the top → "Export Chat"
3. Choose "Include Media" if you want images/voice notes, or "Without Media" for text only (faster, smaller)
4. Save to **Files** → pick a folder you can AirDrop or iCloud to your Mac
5. Repeat for any group chats James was in (CSOAI group, OpenPatent group, etc.)

**On Mac (if you use WhatsApp Desktop):**
Same flow: chat → contact name → Export Chat.

**Account-wide export (catches everything, including group chats you may have forgotten):**
WhatsApp does not offer an account-wide export. You have to do per-chat. **Make a list first** by searching for "James" in WhatsApp search to find every chat and group he's in.

**Naming convention:** save as `whatsapp_james_<chat-name>_<date>.txt` (or `.zip` if with media). Put them all in `~/clawd/legal/james-castle-evidence-bundle/exports/whatsapp/`.

---

## 2. Gmail / Google Workspace

**Account-wide export (Google Takeout):**
1. Go to https://takeout.google.com
2. Click "Deselect all"
3. Re-select **Mail** (and Calendar if relevant)
4. Click "All Mail data included" → choose **Filters** → set From/To containing `james` or `@<his-domain>` if you know it
5. Format: **MBOX** (this is the format solicitors and forensic tools can read)
6. Delivery method: **Send download link via email** (the file is too big for direct download)
7. Click "Create export" — Google emails you when it's ready, usually 10 min to a few hours

The MBOX file is a single `.mbox` text file containing every matching email. Drop it in `~/clawd/legal/james-castle-evidence-bundle/exports/gmail/`.

**If you don't want the full account, just forward the relevant threads to yourself** in a dedicated `james-evidence@gmail.com` or a label in your existing account, then export just that label.

---

## 3. iMessage / SMS

**Mac (Messages app):**
1. Open Messages → search for "James" or his phone number/email
2. Select the conversation → File → Export... → save as `.pdf` or `.txt` to `~/clawd/legal/james-castle-evidence-bundle/exports/imessage/`

**iPhone:**
1. Settings → Your Name → iCloud → Messages (make sure it's on, so messages sync to Mac)
2. Then export from Mac as above

**For SMS (not iMessage):** Same flow. SMS shows in green bubbles, iMessage in blue. Both export together.

**If you have hundreds of conversations:** Spotlight search "James" or his number to find them all. Or use a tool like `iMazing` (paid, ~£50) or `Decipher TextMessage` for a full forensic export with timestamps preserved.

---

## 4. Apple iCloud Drive / Notes / Photos

**iCloud Drive folder export:**
1. Go to https://www.icloud.com → sign in
2. iCloud Drive → find any folder James shared with you (CSOAI, OpenPatent, contracts, etc.)
3. Select all → Download

**Notes:**
1. icloud.com/notes → find notes mentioning James
2. Select → Copy and paste into a `.md` file, or print to PDF

**Photos:**
1. Search Photos for "James" or his name
2. Select relevant photos → File → Export → Unmodified Originals
3. EXIF data (timestamps, GPS if any) is preserved

---

## 5. LinkedIn / Slack / Discord (if used)

- **LinkedIn:** Download your data at https://www.linkedin.com/psettings/member/portal → "Get a copy of your data" → "Connections", "Messages", "Posts"
- **Slack:** Workspace settings → "Import/Export Data" → "Export" (you need owner/admin rights; if James was admin, this gets harder — flag to solicitor)
- **Discord:** User Settings → Privacy & Safety → "Request all of my Data"

---

## 6. Anything James sent you physically

If James ever handed you business cards, paper documents, USB sticks, business plans on paper, **do not throw them away**. Photograph them in good light, save the photos to `~/clawd/legal/james-castle-evidence-bundle/exports/paper/`, and put the originals in a folder or box. **Do not write on them, fold them differently, or alter them in any way** — that destroys forensic value.

---

## What to do once you have the exports

1. **Do not edit them.** Originals are evidence. If you need to annotate, make a separate file like `01-timeline.md` with your notes, and reference the original export by path.
2. **Do not upload them to me or any cloud service unless you have to.** Local-only is fine for now.
3. **Make a backup.** Once they're all in `~/clawd/legal/james-castle-evidence-bundle/exports/`, copy the whole folder to a USB stick or external SSD. If the laptop dies, the evidence doesn't.
4. **Tell me when the exports are in place.** I'll run the next step (parsing, claim-vs-evidence matrix) with you.

---

## Time and cost

- WhatsApp per-chat: 5-10 min each, free
- Google Takeout: 10-60 min, free
- iMessage export: 15-30 min, free (Mac Messages) or £40-50 (iMazing/Decipher)
- iCloud Drive: 30-60 min, free
- LinkedIn: 10 min, free
- Slack/Discord: 5-15 min, free

**Total: a Saturday morning, all in parallel, no cost beyond optionally one paid iMessage tool.**

The bundle is useless without these. The bundle is gold with them. **Start with WhatsApp — that's where most informal business chatter lives.**
