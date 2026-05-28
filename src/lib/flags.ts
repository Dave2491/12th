const FLAGS: Record<string, string> = {
  'AR': '🇦🇷', 'AU': '🇦🇺', 'AT': '🇦🇹',
  'BE': '🇧🇪', 'BR': '🇧🇷', 'CA': '🇨🇦',
  'CO': '🇨🇴', 'HR': '🇭🇷', 'CZ': '🇨🇿',
  'EC': '🇪🇨', 'EG': '🇪🇬', 'FR': '🇫🇷',
  'DE': '🇩🇪', 'GH': '🇬🇭', 'GB-ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'GB-SCT': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'HT': '🇭🇹', 'IR': '🇮🇷',
  'JP': '🇯🇵', 'JO': '🇯🇴', 'KR': '🇰🇷',
  'MA': '🇲🇦', 'MX': '🇲🇽', 'NL': '🇳🇱',
  'NZ': '🇳🇿', 'NO': '🇳🇴', 'PA': '🇵🇦',
  'PY': '🇵🇾', 'PT': '🇵🇹', 'QA': '🇶🇦',
  'SA': '🇸🇦', 'SN': '🇸🇳', 'ZA': '🇿🇦',
  'ES': '🇪🇸', 'SE': '🇸🇪', 'CH': '🇨🇭',
  'TR': '🇹🇷', 'TN': '🇹🇳', 'US': '🇺🇸',
  'UY': '🇺🇾', 'UZ': '🇺🇿', 'CV': '🇨🇻',
  'CW': '🇨🇼', 'CI': '🇨🇮', 'DZ': '🇩🇿',
  'BA': '🇧🇦', 'AL': '🇦🇱',
};

export function getFlag(code: string): string {
  return FLAGS[code] ?? '🏳️';
}
