// Terms & conditions for solar package reservation deposits.
// Kept in-source so the modal renders instantly (no fetch round-trip) and
// so changes go through code review. Version bumped when content changes;
// the version is recorded with each acceptance in the backend audit trail.

export const DEPOSIT_TERMS_VERSION = 'v2';

export const DEPOSIT_TERMS_LAST_UPDATED = 'April 2026';

export const DEPOSIT_TERMS_SECTIONS = [
  {
    title: '1. Quotation & Pricing',
    clauses: [
      { label: '1.1 Estimated pricing', body: 'All quotations are generated based on information provided by the client and are estimates only. The final price is subject to confirmation following a physical site assessment.' },
      { label: '1.2 Validity', body: 'Quotations are valid for 30 days from the date of issue. After this period, pricing is subject to change without notice.' },
      { label: '1.3 Price variation', body: 'If the confirmed site assessment results in a price variation of more than 15% above the original quotation, the client will be notified in writing and may cancel without penalty. In this case, the deposit will be refunded less any transport and travel costs already incurred.' },
    ],
  },
  {
    title: '2. Deposit & Payment',
    clauses: [
      { label: '2.1 Reservation deposit', body: 'A deposit of 20% of the quoted amount is required to secure your installation slot and initiate the site assessment. The deposit constitutes your formal commitment to proceed, subject to site verification.' },
      { label: '2.2 Credit toward final invoice', body: 'Where the project proceeds to installation, the deposit will be credited in full toward the final invoice.' },
      { label: '2.3 Payment schedule', body: 'The remaining balance is structured as follows: 50% milestone payment upon delivery of materials to site, and the remaining 30% upon successful installation and commissioning.' },
      { label: '2.4 Late payments', body: 'Payments not received within 7 days of the due date may result in suspension of works. We reserve the right to charge interest on overdue amounts.' },
    ],
  },
  {
    title: '3. Site Assessment',
    clauses: [
      { label: '3.1 Scheduling', body: 'A qualified technician will contact you to schedule a site assessment within 5 business days of deposit payment.' },
      { label: '3.2 Scope', body: 'The assessment will evaluate: roof orientation and tilt angle, structural integrity, shading analysis, electrical panel condition and capacity, and grid connection feasibility.' },
      { label: '3.3 Transport & travel costs', body: 'The site assessment requires our technician to travel to your property. All transport, fuel, and travel-related costs incurred during this visit are covered by the deposit. Should the project not proceed for any reason after the site visit has taken place, these costs will be deducted from the deposit before any refund is issued. The applicable transport fee will be itemised on your refund statement.' },
      { label: '3.4 Client cooperation', body: 'The client agrees to provide reasonable access to the property and to disclose any known structural issues or restrictions. Failure to do so may result in additional charges or a repeat visit fee.' },
    ],
  },
  {
    title: '4. Cancellation & Refunds',
    clauses: [
      { label: '4.1 Refund schedule', body: 'Refunds follow this schedule:' },
    ],
    refundTable: [
      { stage: 'Before site assessment is conducted', refund: 'Full refund', tone: 'success' },
      { stage: 'After site visit, client chooses not to proceed', refund: 'Refund less transport fee', tone: 'warning' },
      { stage: 'Installation found not feasible (our determination)', refund: 'Refund less transport fee', tone: 'warning' },
      { stage: 'After materials have been ordered', refund: 'No refund', tone: 'danger' },
    ],
    footer: 'Refunds are processed within 7 business days. A transport fee deduction statement will be provided where applicable.',
  },
  {
    title: '5. Installation & Warranties',
    clauses: [
      { label: '5.1 Timeline', body: 'Installation dates are confirmed in writing after the site assessment. Delays due to weather, permitting, or supply chain issues do not constitute a breach of contract.' },
      { label: '5.2 Warranties', body: '25-year performance warranty on panels (manufacturer), 5-year warranty on inverter (manufacturer), and 2-year workmanship warranty on our installation.' },
      { label: '5.3 Exclusions', body: 'Warranties do not cover damage from misuse, unauthorized modifications, acts of nature, or failure to follow the recommended maintenance schedule.' },
    ],
  },
  {
    title: '6. Liability & Disputes',
    clauses: [
      { label: '6.1 Limitation of liability', body: 'Our liability is limited to the value of the contract. We are not liable for indirect or consequential losses.' },
      { label: '6.2 Disputes', body: 'Both parties agree to first attempt resolution in good faith. If unresolved within 30 days, disputes shall be referred to mediation before any legal proceedings.' },
    ],
  },
];
