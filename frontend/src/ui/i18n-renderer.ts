import type { Language } from '../domain/types';
import { setDocumentLanguage } from '../i18n';

export function applyLanguage(language: Language): void { setDocumentLanguage(language); }
