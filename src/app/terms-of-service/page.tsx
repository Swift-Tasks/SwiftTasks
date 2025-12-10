import TermsOfService from "@/components/templates/terms-of-serivce";

const content = `# Terms of Service

**Last Updated: [Insert Date]**

By accessing or using this website, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use of the site.

---

## Use of the Website  
You agree to use this website only for lawful purposes and in a manner that does not infringe on the rights of others or restrict their enjoyment of the site. You may not engage in any activity that could damage, disable, or impair the website’s functionality.

---

## User Accounts  
If you create an account on our site, you are responsible for maintaining the confidentiality of your login information and for all activities conducted under your account. You agree to notify us immediately of any unauthorized access or security breach.

---

## Intellectual Property  
All content, trademarks, logos, images, and materials displayed on this website are the property of the site owner or licensed to us. You may not copy, distribute, modify, or use any content without prior written permission.

---

## Purchases and Payments *(optional)*  
By making a purchase on this website, you agree to provide accurate payment information and authorize us to charge the specified amount. All sales are subject to our refund or cancellation policy, which will be provided at the time of purchase.

---

## Third-Party Links  
This website may contain links to third-party websites. We are not responsible for the content, policies, or practices of any third-party sites and you access them at your own risk.

---

## Disclaimer of Warranties  
This website and its content are provided “as is” and “as available.” We make no warranties, express or implied, regarding the accuracy, reliability, or availability of the site.

---

## Limitation of Liability  
To the fullest extent permitted by law, we are not liable for any damages arising out of your use of the website, including but not limited to loss of data, profits, or business opportunities.

---

## Termination  
We reserve the right to suspend or terminate access to the website at our discretion, without prior notice, for conduct that violates these Terms or is otherwise harmful to the website or other users.

---

## Changes to Terms  
We may update these Terms of Service from time to time. Continued use of the website after changes are posted constitutes your acceptance of the updated terms.

---

## Contact Information  
If you have questions about these Terms, please contact us at:  
**[Insert Contact Email or Address]**
`;

export default function TermsOfServicePage() {
  return <TermsOfService content={content} />;

type Props = {
  label: string;
  onClick?: () => void;
};


}
