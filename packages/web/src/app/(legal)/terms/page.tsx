import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Sotally',
  description: 'Sotally Terms of Service. Read about your rights and responsibilities when using our platform.',
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-sm !text-muted-foreground/70">
        Last updated: March 2026
      </p>

      <hr />

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Sotally ("the Platform"), you agree to be bound by these Terms of Service.
        If you do not agree to these terms, please do not use the Platform. We may update these terms
        from time to time, and continued use after changes constitutes acceptance of the revised terms.
      </p>

      <h2>2. Account Terms</h2>
      <p>
        You must provide accurate and complete information when creating an account. You are responsible
        for maintaining the security of your account credentials and for all activity under your account.
      </p>
      <ul>
        <li>You must be at least 13 years old to create an account.</li>
        <li>One person or entity may not maintain more than one account.</li>
        <li>You are responsible for keeping your password secure. Sotally cannot and will not be liable for any loss from unauthorized access to your account.</li>
        <li>You must notify us immediately of any unauthorized use of your account.</li>
      </ul>

      <h2>3. Credit System</h2>
      <p>
        Sotally operates on a credit-based system. Credits are used to run tools on the Platform.
      </p>
      <ul>
        <li><strong>Credits do not expire.</strong> Once purchased, your credits remain in your account indefinitely.</li>
        <li>Credits are non-transferable between accounts.</li>
        <li>Credit prices are listed at the time of purchase. Pricing may change, but purchased credits retain their value.</li>
        <li>New accounts receive 50 free credits upon registration.</li>
        <li>If a tool execution fails due to a system error or produces no output, credits are automatically refunded.</li>
        <li>Unused credits may be refunded in USD within 30 days of purchase by contacting support. After 30 days, credits are non-refundable but never expire.</li>
      </ul>

      <h2>4. Tool Usage</h2>
      <p>
        When you run a tool on Sotally, credits are deducted from your balance. Each tool displays its
        credit cost before execution.
      </p>
      <ul>
        <li>Tool results are provided "as-is." While we strive for quality, we do not guarantee the accuracy, completeness, or fitness of any tool output for a particular purpose.</li>
        <li>You are responsible for reviewing and validating any output before relying on it, especially for medical, legal, or financial decisions.</li>
        <li>Execution inputs are retained for 90 days and may be accessed by you and by support staff. Inputs may be shared with tool creators in anonymized form.</li>
        <li>You may not use tools for purposes that violate applicable law, our Acceptable Use Policy, or the rights of others.</li>
      </ul>

      <h2>5. Bring Your Own Model (BYOM)</h2>
      <p>
        You may provide your own API keys for supported AI providers. When using BYOM:
      </p>
      <ul>
        <li>Your API keys are encrypted with AES-256-GCM and decrypted only at execution time.</li>
        <li>API keys are never logged or exposed to tool creators.</li>
        <li>You are responsible for any charges incurred on your external API accounts.</li>
        <li>You can delete your stored API keys at any time.</li>
      </ul>

      <h2>6. Creator Terms</h2>
      <p>
        If you create and publish tools on Sotally:
      </p>
      <ul>
        <li><strong>You own your tools.</strong> The prompts, logic, and configurations you create are your intellectual property.</li>
        <li>You grant Sotally a license to execute, display, promote, and cache your tool as needed for the Platform to function.</li>
        <li>Your prompts are protected. They are encrypted and never shown to users.</li>
        <li>Revenue share is based on your Creator Level (65-80% to creator). Rates may change with 30 days' notice.</li>
        <li>Minimum payout threshold is $50, processed via Stripe Connect within 1-3 business days.</li>
        <li>You must keep your tools functional, comply with the Acceptable Use Policy, and ensure your tools do not violate third-party rights.</li>
        <li>Tools inactive for 12 months with fewer than 10 runs may be auto-archived. You can reactivate archived tools at any time.</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        Sotally does not claim ownership of your tool outputs or creator-built tool configurations.
        The Sotally name, logo, and platform design are the property of Sotally.
      </p>
      <ul>
        <li>You may not copy another creator's tool without permission.</li>
        <li>You may not impersonate other services or brands on the Platform.</li>
        <li>If you believe a tool infringes your intellectual property, you may file a DMCA notice at <strong>legal@sotally.com</strong>.</li>
      </ul>

      <h2>8. Prohibited Activities</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Platform to create or distribute harmful, illegal, or deceptive content.</li>
        <li>Attempt to extract other users' API keys, credentials, or personal data.</li>
        <li>Create tools designed to deceive users, generate spam, or facilitate fraud.</li>
        <li>Manipulate the marketplace through fake reviews, self-dealing, or artificial activity.</li>
        <li>Reverse engineer, scrape, or attempt to circumvent the Platform's security measures.</li>
        <li>Create bulk low-effort tools or tools with clickbait descriptions.</li>
      </ul>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Sotally and its affiliates shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
        revenue, whether incurred directly or indirectly.
      </p>
      <p>
        Our total liability for any claim arising from use of the Platform shall not exceed the amount
        you paid to Sotally in the 12 months preceding the claim.
      </p>

      <h2>10. Termination</h2>
      <ul>
        <li>You may delete your account at any time. Outstanding creator earnings will be paid out within 30 days of account closure.</li>
        <li>Sotally may suspend or terminate accounts for repeated or severe violations of these Terms or the Acceptable Use Policy.</li>
        <li>Upon termination, active subscriptions are cancelled and users are refunded for unused subscription periods.</li>
        <li>If you file a credit card chargeback, your account may be suspended pending investigation.</li>
      </ul>

      <h2>11. Changes to Terms</h2>
      <p>
        We may modify these Terms at any time. Material changes will be communicated via email or
        a notice on the Platform at least 30 days before taking effect. Your continued use of the
        Platform after the effective date constitutes acceptance of the updated Terms.
      </p>

      <hr />

      <h2>Contact</h2>
      <p>
        If you have questions about these Terms, please contact us at{' '}
        <a href="mailto:legal@sotally.com">legal@sotally.com</a>.
      </p>
    </>
  );
}
