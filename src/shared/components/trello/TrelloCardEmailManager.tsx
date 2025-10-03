import React, { useState, useEffect } from 'react';

interface TrelloCardEmailManagerProps {
  description: string;
  onEmailsChange: (updatedDescription: string) => void;
  disabled?: boolean;
}

/**
 * TrelloCardEmailManager Component
 *
 * Manages customer email addresses separately from the description field.
 * Provides structured email input with validation and integrates seamlessly
 * with the existing description content.
 */
export const TrelloCardEmailManager: React.FC<TrelloCardEmailManagerProps> = ({
  description,
  onEmailsChange,
  disabled = false
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [emailErrors, setEmailErrors] = useState<{ [index: number]: string }>({});

  // Email validation regex
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Parse emails from description HTML content
   */
  const parseEmailsFromDescription = (html: string): string[] => {
    if (!html) return [];

    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Look for the customer-emails div
      const emailDiv = tempDiv.querySelector('#customer-emails[data-emails="true"]');
      if (!emailDiv) return [];

      // Extract email addresses from <p> tags
      const emailParagraphs = emailDiv.querySelectorAll('p');
      const extractedEmails: string[] = [];

      emailParagraphs.forEach(p => {
        const email = p.textContent?.trim();
        if (email && EMAIL_REGEX.test(email)) {
          extractedEmails.push(email);
        }
      });

      return extractedEmails;
    } catch (error) {
      console.error('Error parsing emails from description:', error);
      return [];
    }
  };

  /**
   * Update description with current emails
   */
  const updateDescriptionWithEmails = (baseDescription: string, emailList: string[]): string => {
    if (!baseDescription) baseDescription = '';

    // Remove existing email block if present
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = baseDescription;
    const existingEmailDiv = tempDiv.querySelector('#customer-emails[data-emails="true"]');
    if (existingEmailDiv) {
      existingEmailDiv.remove();
    }

    // Get the cleaned description without email block
    let cleanedDescription = tempDiv.innerHTML.trim();

    // If no emails, return cleaned description
    if (emailList.length === 0) {
      return cleanedDescription;
    }

    // Create new email block
    const emailParagraphs = emailList
      .filter(email => email.trim() && EMAIL_REGEX.test(email.trim()))
      .map(email => `   <p>${email.trim()}</p>`)
      .join('\n');

    const emailBlock = `\n\n<div id="customer-emails" data-emails="true">\n${emailParagraphs}\n</div>`;

    return cleanedDescription + emailBlock;
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string): string => {
    if (!email.trim()) return '';
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Invalid email format';
    }
    return '';
  };

  /**
   * Handle email input change
   */
  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);

    // Validate email
    const error = validateEmail(value);
    setEmailErrors(prev => ({
      ...prev,
      [index]: error
    }));

    // Update description with new emails (only valid ones)
    const validEmails = newEmails.filter((email, idx) =>
      email.trim() && !validateEmail(email) && idx !== index // Exclude current editing email
    );
    if (!error && value.trim()) {
      validEmails.push(value.trim());
    }

    const updatedDescription = updateDescriptionWithEmails(description, validEmails);
    onEmailsChange(updatedDescription);
  };

  /**
   * Add new email field
   */
  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  /**
   * Remove email field
   */
  const removeEmailField = (index: number) => {
    const newEmails = emails.filter((_, idx) => idx !== index);
    setEmails(newEmails);

    // Remove error for this index and shift others
    const newErrors: { [index: number]: string } = {};
    Object.keys(emailErrors).forEach(key => {
      const idx = parseInt(key);
      if (idx < index) {
        newErrors[idx] = emailErrors[idx];
      } else if (idx > index) {
        newErrors[idx - 1] = emailErrors[idx];
      }
    });
    setEmailErrors(newErrors);

    // Update description
    const validEmails = newEmails.filter(email => email.trim() && !validateEmail(email));
    const updatedDescription = updateDescriptionWithEmails(description, validEmails);
    onEmailsChange(updatedDescription);
  };

  // Initialize emails from description when component mounts or description changes
  useEffect(() => {
    const parsedEmails = parseEmailsFromDescription(description);
    setEmails(parsedEmails.length > 0 ? parsedEmails : ['']);
    setEmailErrors({});
  }, [description]);

  return (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Customer Emails
      </label>

      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="customer@example.com"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 ${
                  emailErrors[index] ? 'border-red-500' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={disabled}
              />
              {emailErrors[index] && (
                <div className="text-red-500 text-xs mt-1">{emailErrors[index]}</div>
              )}
            </div>

            {!disabled && emails.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmailField(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove email"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <button
            type="button"
            onClick={addEmailField}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add another email
          </button>
        )}
      </div>

      {emails.filter(email => email.trim() && !validateEmail(email)).length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          <strong>Valid emails:</strong> {emails.filter(email => email.trim() && !validateEmail(email)).join(', ')}
        </div>
      )}
    </div>
  );
};