import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  Archive,
  Reply,
  Inbox,
  Filter,
  RefreshCw,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '../../i18n/LanguageContext';
import { ParentInquiry, InquiryStatus } from '../../types/registry';
import { getInquiries, updateInquiryStatus } from '../../lib/supabase';

interface ProviderInquiriesProps {
  providerId: string;
  providerEmail?: string; // Reserved for future use
}

type FilterType = 'all' | 'new' | 'archived';

const AGE_GROUP_COLORS: Record<string, string> = {
  infant: 'bg-pink-100 text-pink-700',
  toddler: 'bg-orange-100 text-orange-700',
  preschool: 'bg-green-100 text-green-700',
  school_age: 'bg-blue-100 text-blue-700',
  multiple: 'bg-purple-100 text-purple-700',
};

export function ProviderInquiries({ providerId }: ProviderInquiriesProps) {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<ParentInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    const data = await getInquiries(providerId);
    setInquiries(data);
    setLoading(false);
  }, [providerId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleExpand = async (inquiry: ParentInquiry) => {
    const isExpanding = expandedId !== inquiry.id;
    setExpandedId(isExpanding ? inquiry.id : null);

    // Mark as read when expanding a new inquiry
    if (isExpanding && inquiry.status === 'new') {
      await updateInquiryStatus(inquiry.id, 'read');
      setInquiries(prev =>
        prev.map(i => (i.id === inquiry.id ? { ...i, status: 'read', read_at: new Date().toISOString() } : i))
      );
    }
  };

  const handleArchive = async (inquiryId: string) => {
    await updateInquiryStatus(inquiryId, 'archived');
    setInquiries(prev =>
      prev.map(i => (i.id === inquiryId ? { ...i, status: 'archived' } : i))
    );
  };

  const handleMarkReplied = async (inquiryId: string) => {
    await updateInquiryStatus(inquiryId, 'replied');
    setInquiries(prev =>
      prev.map(i => (i.id === inquiryId ? { ...i, status: 'replied', replied_at: new Date().toISOString() } : i))
    );
  };

  const handleReply = (inquiry: ParentInquiry) => {
    // Open email client with pre-filled reply
    const subject = encodeURIComponent(`Re: Your childcare inquiry`);
    const body = encodeURIComponent(`Hi ${inquiry.parent_name},\n\nThank you for your inquiry about childcare. \n\n`);
    const mailtoLink = `mailto:${inquiry.parent_email}?subject=${subject}&body=${body}`;

    // Use a hidden link to avoid navigation issues
    const link = document.createElement('a');
    link.href = mailtoLink;
    link.click();

    // Mark as replied
    handleMarkReplied(inquiry.id);
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const labels: Record<string, string> = {
      infant: `${t('vacancy.infant')} (${t('vacancy.infantAge')})`,
      toddler: `${t('vacancy.toddler')} (${t('vacancy.toddlerAge')})`,
      preschool: `${t('vacancy.preschool')} (${t('vacancy.preschoolAge')})`,
      school_age: `${t('vacancy.schoolAge')} (${t('vacancy.schoolAgeAge')})`,
      multiple: t('inquiry.multipleAgeGroups'),
    };
    return labels[ageGroup] || ageGroup;
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {t('inquiry.statusNew')}
          </span>
        );
      case 'read':
        return (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {t('inquiry.statusRead')}
          </span>
        );
      case 'replied':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle size={12} />
            {t('inquiry.statusReplied')}
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
            {t('inquiry.statusArchived')}
          </span>
        );
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    if (filter === 'new') return i.status === 'new';
    if (filter === 'archived') return i.status === 'archived';
    return i.status !== 'archived'; // 'all' shows non-archived
  });

  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div className="bg-white rounded-xl shadow">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('inquiry.dashboardTitle')}</h2>
              <p className="text-sm text-gray-600">{t('inquiry.dashboardSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={loadInquiries}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            title={t('common.filter')}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('inquiry.filterAll')}
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                filter === 'new'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('inquiry.filterNew')}
              {newCount > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {newCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'archived'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('inquiry.filterArchived')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">
              {filter === 'new' ? t('inquiry.noNewInquiries') : t('inquiry.noInquiries')}
            </p>
            <p className="text-sm text-gray-500 mt-1">{t('inquiry.noInquiriesHelp')}</p>
          </div>
        ) : (
          filteredInquiries.map(inquiry => (
            <div key={inquiry.id} className={`${inquiry.status === 'new' ? 'bg-blue-50/50' : ''}`}>
              {/* Collapsed view */}
              <div
                className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleExpand(inquiry)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{inquiry.parent_name}</span>
                      {getStatusBadge(inquiry.status)}
                      <span className={`px-2 py-0.5 text-xs rounded ${AGE_GROUP_COLORS[inquiry.age_group_interested]}`}>
                        {getAgeGroupLabel(inquiry.age_group_interested)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">{inquiry.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                    </span>
                    {expandedId === inquiry.id ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded view */}
              {expandedId === inquiry.id && (
                <div className="px-4 pb-4 pt-1 border-t bg-gray-50">
                  <div className="space-y-3">
                    {/* Contact info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <a
                        href={`mailto:${inquiry.parent_email}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Mail size={14} />
                        {inquiry.parent_email}
                      </a>
                      {inquiry.parent_phone && (
                        <a
                          href={`tel:${inquiry.parent_phone}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Phone size={14} />
                          {inquiry.parent_phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        {new Date(inquiry.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Message */}
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleReply(inquiry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Reply size={14} />
                        {t('inquiry.reply')}
                      </button>
                      {inquiry.status !== 'replied' && (
                        <button
                          onClick={() => handleMarkReplied(inquiry.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100"
                        >
                          <CheckCircle size={14} />
                          {t('inquiry.markReplied')}
                        </button>
                      )}
                      {inquiry.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(inquiry.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100"
                        >
                          <Archive size={14} />
                          {t('inquiry.archive')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
