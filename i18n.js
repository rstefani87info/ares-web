import accepts from 'accepts';
export function getPreferredLanguage (request){return accepts(request).languages()[0].split('-')[0] || 'en';} 