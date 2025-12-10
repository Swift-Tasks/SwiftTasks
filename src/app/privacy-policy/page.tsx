import PrivacyPolicy from "@/components/templates/privacy-policy";

const content = `Privacy Policy

We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard any data you provide while using our website.

Information We Collect
We may collect personal information such as your name, email address, contact details, and any other data you voluntarily submit through forms or account features. We may also automatically collect certain technical information, including IP address, browser type, device information, and browsing behavior for analytics and site performance purposes.

How We Use Your Information
Your information may be used to:

Provide and improve our services

Personalize your user experience

Respond to inquiries or support requests

Send transactional or service-related communications

Monitor website performance and prevent fraudulent activity

Cookies and Tracking Technologies
We may use cookies and similar technologies to enhance functionality, analyze website traffic, and improve user experience. You can adjust your browser settings to refuse cookies, but this may affect certain features of the site.

Data Sharing and Security
We do not sell or rent your personal information. Data may be shared with trusted third-party service providers who assist in operating the website, provided they agree to maintain confidentiality. We implement security measures designed to protect your information from unauthorized access, alteration, or disclosure.

Your Rights
Depending on your location, you may have rights regarding accessing, correcting, deleting, or restricting the use of your personal information. To exercise these rights, please contact us using the information provided on our site.

Changes to This Policy
We may update this Privacy Policy from time to time. Any revisions will be posted on this page with an updated “Last Updated” date`;

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy content={content} />;
}
