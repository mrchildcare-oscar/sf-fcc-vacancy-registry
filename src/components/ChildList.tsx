import { useState } from 'react';
import { Child } from '../types';
import { formatAge, getAgeGroup, getAgeGroupConfig } from '../utils/ageGroups';
import { Pencil, Trash2, UserPlus, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../i18n/LanguageContext';

interface ChildListProps {
  children: Child[];
  onEdit: (child: Child) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onClearAll?: () => void;
}

export function ChildList({ children, onEdit, onRemove, onAdd, onClearAll }: ChildListProps) {
  const { t } = useLanguage();
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  // Sort by DOB - oldest children first (earliest DOB at top)
  const sortedChildren = [...children].sort((a, b) => {
    return new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('roster.title')}</h2>
          <span className="px-2.5 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
            {children.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onClearAll && children.length > 0 && (
            confirmingClearAll ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('roster.clearAllConfirm')}</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmingClearAll(false);
                  }}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {t('common.yes')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClearAll(false)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  {t('common.no')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClearAll(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                title={t('roster.clearAll')}
              >
                <Trash size={16} />
                {t('roster.clearAll')}
              </button>
            )
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <UserPlus size={16} />
            {t('roster.addChild')}
          </button>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <p>{t('roster.noChildren')}</p>
          <p className="text-sm mt-1">{t('roster.noChildrenHelp')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-0">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('roster.name')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('roster.age')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  {t('roster.group')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  {t('roster.dob')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  {t('roster.enrolled')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  {t('roster.departure')}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  {t('roster.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedChildren.map((child, index) => {
                const ageGroup = getAgeGroup(child.dateOfBirth);
                const groupConfig = ageGroup ? getAgeGroupConfig(ageGroup) : null;
                const displayName = (child.firstName || child.lastName)
                  ? `${child.firstName} ${child.lastName}`.trim()
                  : `Child ${index + 1}`;

                return (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEdit(child);
                        }}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left text-sm"
                      >
                        {displayName}
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 text-sm">
                      {formatAge(child.dateOfBirth)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap hidden sm:table-cell">
                      {groupConfig && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${groupConfig.color}20`,
                            color: groupConfig.color,
                          }}
                        >
                          {groupConfig.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 text-sm hidden md:table-cell">
                      {format(new Date(child.dateOfBirth), 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 text-sm hidden lg:table-cell">
                      {format(new Date(child.enrollmentDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 text-sm hidden lg:table-cell">
                      {child.expectedDepartureDate ? (
                        <span>
                          {format(new Date(child.expectedDepartureDate), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      {confirmingRemove === child.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-gray-500">{t('roster.removeConfirm')}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemove(child.id);
                              setConfirmingRemove(null);
                            }}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            {t('common.yes')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmingRemove(null);
                            }}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            {t('common.no')}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit(child);
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title={t('common.edit')}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmingRemove(child.id);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1 ml-2"
                            title={t('common.remove')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
