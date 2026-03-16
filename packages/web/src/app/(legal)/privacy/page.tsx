import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Sotally',
  description: 'Learn how Sotally collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm !text-muted-foreground/70">
        Last updated: March 2026
      </p>

      <hr />

      <p>
        At Sotally, we take your privacy seriously. This policy explains what data we collect,
        how we use it, and your rights regarding your personal information. We are committed to
        transparency and compliance with applicable data protection regulations including the
        GDPR.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Account Information</h3>
      <p>
        When you create an account, we collect your name, email address, and optional avatar.
        This information is retained until you delete your account.
      </p>

      <h3>Execution Data</h3>
      <p>
        When you run a tool, we store your inputs and the resulting outputs. This data is
        retained for 90 days to support your execution history, troubleshooting, and quality
        assurance.
      </p>

      <h3>Transaction Data</h3>
      <p>
        We maintain records of all credit purchases and usage, including timestamps, amounts,
        and associated tools. Financial records are retained indefinitely as required for
        accounting and legal compliance.
      </p>

      <h3>Usage Analytics</h3>
      <p>
        We collect aggregated, anonymized data about how tools are used on the Platform. This
        helps us improve the Platform and helps creators understand tool performance. Individual
        user details are never included in creator analytics.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>Provide the service:</strong> Execute tools, manage your account, process credit transactions.</li>
        <li><strong>Improve the Platform:</strong> Analyze usage patterns to enhance features and reliability.</li>
        <li><strong>Communicate with you:</strong> Send transactional emails, security alerts, and (with your consent) marketing communications.</li>
        <li><strong>Prevent fraud:</strong> Detect and prevent abuse, chargebacks, and policy violations.</li>
        <li><strong>Support creators:</strong> Provide anonymized analytics to help creators improve their tools.</li>
      </ul>

      <h2>3. Data Storage & Security</h2>
      <p>
        All sensitive data is encrypted at rest using AES-256 and in transit using TLS 1.3. Tool
        executions are sandboxed — one tool cannot access another tool's data. We do not sell user
        data to third parties.
      </p>

      <h2>4. API Keys (Bring Your Own Model)</h2>
      <p>
        If you use the BYOM feature, your external API keys are encrypted with AES-256-GCM.
        Keys are decrypted only at the moment of tool execution and are never logged, displayed,
        or accessible to tool creators. You can view (masked) and delete your stored keys at any
        time from your account settings.
      </p>

      <h2>5. Execution Data</h2>
      <p>
        Your tool execution inputs are accessible to you and to our support team. Inputs may be
        shared with tool creators in anonymized form to help improve tool quality. Execution
        outputs are accessible only to you and support. All execution data is automatically
        deleted after 90 days.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use essential cookies to maintain your session and authentication state. We may use
        analytics cookies to understand how the Platform is used. You can manage cookie
        preferences through your browser settings. The Platform functions with only essential
        cookies enabled.
      </p>

      <h2>7. Third-Party Services</h2>
      <p>We work with the following third-party services:</p>
      <ul>
        <li><strong>Stripe:</strong> Payment processing. Stripe processes your payment information directly — we never store your full credit card number. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.</li>
        <li><strong>OpenAI and other AI providers:</strong> When tools are executed, your inputs may be sent to AI provider APIs for processing. When using BYOM, requests go through your own API key. Providers have their own data handling policies.</li>
        <li><strong>Analytics providers:</strong> We may use analytics services to understand Platform usage. Data shared with these services is anonymized.</li>
      </ul>

      <h2>8. Your Rights</h2>
      <p>
        Under the GDPR and other applicable regulations, you have the following rights:
      </p>
      <ul>
        <li><strong>Right of access:</strong> Request a copy of all personal data we hold about you.</li>
        <li><strong>Right to rectification:</strong> Correct inaccurate personal data.</li>
        <li><strong>Right to erasure:</strong> Request deletion of your account and all associated data. We process deletion requests within 30 days.</li>
        <li><strong>Right to data portability:</strong> Export your data, including tool configurations.</li>
        <li><strong>Right to restrict processing:</strong> Request that we limit how we use your data.</li>
        <li><strong>Right to object:</strong> Object to processing of your data for specific purposes.</li>
        <li><strong>Right to withdraw consent:</strong> Withdraw consent for marketing communications at any time via account settings or email unsubscribe links.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{' '}
        <a href="mailto:privacy@sotally.com">privacy@sotally.com</a>.
      </p>

      <h2>9. Data Retention</h2>
      <table>
        <thead>
          <tr>
            <th>Data Type</th>
            <th>Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account information</td>
            <td>Until account deletion</td>
          </tr>
          <tr>
            <td>Execution inputs & outputs</td>
            <td>90 days</td>
          </tr>
          <tr>
            <td>Credit transactions</td>
            <td>Indefinite (financial records)</td>
          </tr>
          <tr>
            <td>Creator prompts</td>
            <td>Until tool deletion</td>
          </tr>
          <tr>
            <td>BYOM API keys</td>
            <td>Until you delete them</td>
          </tr>
          <tr>
            <td>Usage analytics</td>
            <td>Indefinite (anonymized)</td>
          </tr>
        </tbody>
      </table>

      <h2>10. Data Breach Response</h2>
      <p>
        In the event of a data breach, we will notify affected users within 72 hours, provide
        details about the breach and our response, report to relevant authorities as required
        by law, and offer credit monitoring if personal data was exposed.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy-related inquiries, contact our data protection team at{' '}
        <a href="mailto:privacy@sotally.com">privacy@sotally.com</a>.
      </p>
    </>
  );
}
