/** Navigation from an existing retained report to existing offers, not a second catalogue.
 * No network, purchase, signature, legal applicability or fresh measurement is inferred.
 */
const HASH = /^[a-f0-9]{64}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const h = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function serviceHandoff(entry) {
  const day = entry?.report?.as_of;
  if (!HASH.test(entry?.sha256 ?? '') || !DAY.test(day ?? '') || entry.filename !== day + '.json') throw new Error('Report identity required for service handoff');
  const time = Date.parse(day + 'T00:00:00Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== day) throw new Error('Invalid report day');
  return {
    report_id: entry.sha256,
    report_day: day,
    report_source: '/reports/daily-signal/' + entry.filename,
    selection_basis: 'READER_CHOICE_NOT_LEGAL_APPLICABILITY',
    catalog_path: '/api/x402',
    instructions_path: '/quickstart/',
    free_verification_path: '/gspc-verify',
    commercial_state: 'NAVIGATION_ONLY_NO_LIVE_OFFER_CHECK',
    payment_attempted: false,
    delivery_verified: false,
    applicability_determined: false,
    report_is_the_paid_deliverable: false,
    reuse_rights_established: false,
    options: [
      {
        product_id: 'evidence_bundle', option_id: 'article-53', title: 'Prepare a GPAI evidence assembly',
        preview_path: '/api/evidence-bundle?obligation=article-53',
        quote_path: '/api/evidence-bundle?obligation=article-53&bundle=1',
        scope: 'Assemble the existing cards selected for Article 53 into the advertised evidence bundle. Inspect subject, count, source date and mapping limitations before requesting a quote.',
        does_not_establish: 'Not provider technical documentation, a legal determination or proof that a provision is satisfied.',
      },
      {
        product_id: 'evidence_bundle', option_id: 'article-50', title: 'Prepare a content-marking evidence assembly',
        preview_path: '/api/evidence-bundle?obligation=article-50',
        quote_path: '/api/evidence-bundle?obligation=article-50&bundle=1',
        scope: 'Assemble the existing Article 50-relevant selection. This is not a new marking test of your content.',
        does_not_establish: 'Not a conformity determination or a claim that a particular output is correctly marked.',
      },
      {
        product_id: 'provider_diff_feed', option_id: 'provider-history', title: 'Retrieve recorded provider changes',
        preview_path: '/api/feeds/provider-diff',
        quote_path: '/api/feeds/provider-diff?history=1',
        scope: 'Assemble retained provider-document change records. Check their own capture dates and incomplete observations; a new report date does not make the records fresh.',
        does_not_establish: 'Not continuous monitoring, permission to republish source text or a judgement about the provider.',
      },
      {
        product_id: 'data_feed', option_id: 'assembled-feed', title: 'Assemble the existing evidence feed',
        preview_path: '/api/signed-data-feed?manifest=1',
        quote_path: '/api/signed-data-feed?feed=1',
        scope: 'Inspect the free delivery manifest before requesting the existing assembled feed. Use its documented expected-digest option when available.',
        does_not_establish: 'Not recurring cadence, freshly measured source data or verification of all input signatures.',
      },
    ],
    fresh_work: {
      request_path: '/contact/?arm=run',
      endpoint_checks_catalog_path: '/api/x402',
      existing_product_ids: ['ras_mcp_probe', 'ras_x402_check', 'ras_supply'],
      state: 'INPUT_SCOPE_AND_CURRENT_TERMS_REQUIRED',
      note: 'For a new system or endpoint, choose an existing bounded check with valid inputs or discuss a scoped run. A contact request or quotation is not a booking, payment or acceptance.',
    },
    steps: [
      'Read the free preview and its source dates; choose scope explicitly.',
      'Request the current x402 quote for that exact resource. Amount and terms come from the response, not this report.',
      'Only an authorised payer approves spending. A 402 challenge is not a payment or delivery.',
      'Retain the delivered bytes and settlement record separately; use the existing free verifier and record actual recipient acceptance.',
    ],
    repeat_trigger: 'Revisit only after a relevant source or buyer requirement changes. A repeated report, fresh timestamp or unchanged quote is not new evidence or repeat demand.',
  };
}

export function renderServiceHandoff(entry) {
  const view = serviceHandoff(entry);
  return `<section aria-labelledby="report-services"><h2 id="report-services">Turn this report into a defined next step</h2><p>The report stays free. The options below are separate existing services, not products automatically recommended by its findings. Inspect their current previews before deciding to pay.</p><p class="small muted">Reference report: <code>${h(view.report_id)}</code> · retained day ${h(view.report_day)}. Report production does not establish current availability, legal applicability or source reuse rights.</p><div class="findings">${view.options.map(o => `<article class="service-option"><h3>${h(o.title)}</h3><p>${h(o.scope)}</p><p class="small muted">${h(o.does_not_establish)}</p><p><a href="${h(o.preview_path)}">Inspect free preview</a> · <a href="${h(o.quote_path)}">Request current x402 quote</a></p></article>`).join('')}</div><p><strong>Need a fresh check?</strong> ${h(view.fresh_work.note)} <a href="${h(view.fresh_work.endpoint_checks_catalog_path)}">Existing endpoint checks</a> · <a href="${h(view.fresh_work.request_path)}">Discuss a scoped run</a>.</p><p class="note">A quote is not a purchase. Payment, delivery, verification and recipient acceptance are separate. No favourable result is for sale. Verification stays free.</p><p><a href="${h(view.instructions_path)}">Buyer workflow</a> · <a href="${h(view.free_verification_path)}">Free verification</a> · <a href="${h(view.catalog_path)}">Current machine catalogue</a></p><p class="small muted">${h(view.repeat_trigger)}</p></section>`;
}
