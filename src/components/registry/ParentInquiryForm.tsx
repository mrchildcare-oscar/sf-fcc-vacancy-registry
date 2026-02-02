import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PublicListing, ParentInquiryFormData, AgeGroupInterested } from '../../types/registry';
import { submitInquiry } from '../../lib/supabase';
import { trackInquiryStarted, trackInquirySubmitted } from '../../lib/analytics';

const PARENT_INFO_KEY = 'sf_fcc_parent_info';

interface SavedParentInfo {
  parent_name: string;
  parent_email: string;
  parent_phone: string;
}

function getSavedParentInfo(): SavedParentInfo {
  try {
    const saved = localStorage.getItem(PARENT_INFO_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { parent_name: '', parent_email: '', parent_phone: '' };
}

function saveParentInfo(info: SavedParentInfo) {
  try {
    localStorage.setItem(PARENT_INFO_KEY, JSON.stringify(info));
  } catch {}
}

interface ParentInquiryFormProps {
  listing: PublicListing;
  onClose: () => void;
}

export function ParentInquiryForm({ listing, onClose }: ParentInquiryFormProps) {
  const { t } = useLanguage();
  const savedInfo = getSavedParentInfo();
  const [formData, setFormData] = useState<ParentInquiryFormData>({
    parent_name: savedInfo.parent_name,
    parent_email: savedInfo.parent_email,
    parent_phone: savedInfo.parent_phone,
    message: '',
    age_group_interested: getDefaultAgeGroup(listing),
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot trap

  // Track form opened
  useEffect(() => {
    trackInquiryStarted(listing.provider_id);
  }, [listing.provider_id]);

  function getDefaultAgeGroup(l: PublicListing): AgeGroupInterested {
    const accepting = [
      l.accepting_infants && 'infant',
      l.accepting_toddlers && 'toddler',
      l.accepting_preschool && 'preschool',
      l.accepting_school_age && 'school_age',
    ].filter(Boolean);

    if (accepting.length > 1) return 'multiple';
    if (accepting.length === 1) return accepting[0] as AgeGroupInterested;
    // For waitlist providers with no accepting flags, default to infant
    return 'infant';
  }

  function getAvailableAgeGroups(): { value: AgeGroupInterested; label: string }[] {
    const groups: { value: AgeGroupInterested; label: string }[] = [];

    // For waitlist providers (no openings), show all age groups
    const isWaitlistOnly = listing.total_spots_available === 0 && listing.waitlist_available;

    if (listing.accepting_infants || isWaitlistOnly) {
      groups.push({ value: 'infant', label: `${t('vacancy.infant')} (${t('vacancy.infantAge')})` });
    }
    if (listing.accepting_toddlers || isWaitlistOnly) {
      groups.push({ value: 'toddler', label: `${t('vacancy.toddler')} (${t('vacancy.toddlerAge')})` });
    }
    if (listing.accepting_preschool || isWaitlistOnly) {
      groups.push({ value: 'preschool', label: `${t('vacancy.preschool')} (${t('vacancy.preschoolAge')})` });
    }
    if (listing.accepting_school_age || isWaitlistOnly) {
      groups.push({ value: 'school_age', label: `${t('vacancy.schoolAge')} (${t('vacancy.schoolAgeAge')})` });
    }
    if (groups.length > 1) {
      groups.push({ value: 'multiple', label: t('inquiry.multipleAgeGroups') });
    }

    return groups;
  }

  // Check if text contains URLs
  function containsUrl(text: string): boolean {
    const urlPattern = /https?:\/\/|www\.|\.com|\.org|\.net|\.io|\.co\//i;
    return urlPattern.test(text);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot check - if filled, silently "succeed" (bot trap)
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    // Validation
    if (!formData.parent_name.trim()) {
      setError(t('inquiry.errorNameRequired'));
      return;
    }
    if (!formData.parent_email.trim() || !formData.parent_email.includes('@')) {
      setError(t('inquiry.errorEmailRequired'));
      return;
    }
    if (!formData.message.trim()) {
      setError(t('inquiry.errorMessageRequired'));
      return;
    }
    // Block URLs in message
    if (containsUrl(formData.message)) {
      setError(t('inquiry.errorNoLinks'));
      return;
    }

    setSubmitting(true);

    const result = await submitInquiry(listing.provider_id, formData);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Save parent info for future inquiries
    saveParentInfo({
      parent_name: formData.parent_name,
      parent_email: formData.parent_email,
      parent_phone: formData.parent_phone || '',
    });

    trackInquirySubmitted(listing.provider_id);
    setSubmitted(true);
    setSubmitting(false);
  };

  // Success state
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('inquiry.successTitle')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('inquiry.successMessage', { provider: listing.business_name })}
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-gray-900">{t('inquiry.title')}</h2>
            <p className="text-sm text-gray-600">{listing.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inquiry.yourName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.parent_name}
              onChange={e => setFormData(prev => ({ ...prev, parent_name: e.target.value }))}
              placeholder={t('inquiry.namePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inquiry.yourEmail')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.parent_email}
              onChange={e => setFormData(prev => ({ ...prev, parent_email: e.target.value }))}
              placeholder={t('inquiry.emailPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('inquiry.emailHelp')}</p>
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inquiry.yourPhone')} <span className="text-gray-400">({t('roster.optional')})</span>
            </label>
            <input
              type="tel"
              value={formData.parent_phone}
              onChange={e => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
              placeholder={t('inquiry.phonePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inquiry.ageGroupInterested')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.age_group_interested}
              onChange={e => setFormData(prev => ({ ...prev, age_group_interested: e.target.value as AgeGroupInterested }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {getAvailableAgeGroups().map(group => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inquiry.message')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={t('inquiry.messagePlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          {/* Privacy note */}
          <p className="text-xs text-gray-500">
            {t('inquiry.privacyNote')}
          </p>

          {/* Honeypot - hidden from humans, catches bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('inquiry.sending')}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('inquiry.sendInquiry')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
