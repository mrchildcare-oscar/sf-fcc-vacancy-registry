import { useState } from 'react';
import { Child } from '../types';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ChildFormProps {
  onSubmit: (child: Omit<Child, 'id'>) => void;
  onCancel: () => void;
  initialData?: Child;
}

export function ChildForm({ onSubmit, onCancel, initialData }: ChildFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    enrollmentDate: initialData?.enrollmentDate || new Date().toISOString().split('T')[0],
    expectedDepartureDate: initialData?.expectedDepartureDate || '',
    departureReason: initialData?.departureReason || '',
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      enrollmentDate: formData.enrollmentDate,
      expectedDepartureDate: formData.expectedDepartureDate || undefined,
      departureReason: formData.departureReason as Child['departureReason'] || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            {initialData ? t('roster.editChild') : t('roster.addChild')}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roster.firstName')} <span className="text-gray-400 font-normal">({t('roster.optional')})</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder={t('roster.firstNamePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roster.lastName')} <span className="text-gray-400 font-normal">({t('roster.optional')})</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roster.dateOfBirth')} *
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roster.enrollmentDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.enrollmentDate}
                onChange={e => setFormData(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roster.expectedDeparture')}
              </label>
              <input
                type="date"
                value={formData.expectedDepartureDate}
                onChange={e => setFormData(prev => ({ ...prev, expectedDepartureDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roster.departureReason')}
              </label>
              <select
                value={formData.departureReason}
                onChange={e => setFormData(prev => ({ ...prev, departureReason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('roster.selectReason')}</option>
                <option value="aging_out">{t('roster.agingOut')}</option>
                <option value="kindergarten">{t('roster.kindergarten')}</option>
                <option value="moving">{t('roster.moving')}</option>
                <option value="other">{t('roster.other')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('roster.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('roster.notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {initialData ? t('roster.saveChanges') : t('roster.addChild')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
