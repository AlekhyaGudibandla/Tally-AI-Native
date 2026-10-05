// ============================================================================
// LedgerOS Enterprise PII Sanitization Guardrail
// Strips/masks confidential financial & personal data before prompt injection/model dispatch.
// ============================================================================

export class PIISanitizer {
  /**
   * Masks Indian Aadhaar numbers (12 digits, spaced or continuous)
   */
  public static maskAadhaar(text: string): string {
    return text.replace(/\b(\d{4})[- ]?(\d{4})[- ]?(\d{4})\b/g, 'XXXX-XXXX-$3');
  }

  /**
   * Masks Permanent Account Numbers (PAN: 5 letters + 4 digits + 1 letter)
   */
  public static maskPAN(text: string): string {
    return text.replace(/\b([A-Z]{5})(\d{4})([A-Z]{1})\b/gi, '$1****$3');
  }

  /**
   * Masks Bank Account numbers (typically 9 to 18 digits)
   */
  public static maskBankAccount(text: string): string {
    return text.replace(/\b(\d{5,14})(\d{4})\b/g, (match, prefix, suffix) => {
      return '*'.repeat(prefix.length) + suffix;
    });
  }

  /**
   * Masks Credit / Debit card 16-digit numbers
   */
  public static maskCardNumbers(text: string): string {
    return text.replace(/\b(?:\d{4}[ -]?){3}(\d{4})\b/g, '****-****-****-$1');
  }

  /**
   * Complete redaction pass for text destined for external LLM inference
   */
  public static sanitize(text: string): { sanitized: string; maskedCount: number } {
    if (!text) return { sanitized: '', maskedCount: 0 };

    let count = 0;
    let out = text;

    const beforeAadhaar = out;
    out = this.maskAadhaar(out);
    if (beforeAadhaar !== out) count++;

    const beforePAN = out;
    out = this.maskPAN(out);
    if (beforePAN !== out) count++;

    const beforeCard = out;
    out = this.maskCardNumbers(out);
    if (beforeCard !== out) count++;

    return {
      sanitized: out,
      maskedCount: count,
    };
  }
}
