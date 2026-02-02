/**
 * Entity Calendar Component
 * Calendar view for entity records with date fields
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { EntityConfig } from '@/types/crm-config';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface EntityCalendarProps {
    entity: EntityConfig;
    records: any[];
    dateField: string;
    endDateField?: string;
    titleField?: string;
    loading?: boolean;
    onCreate?: (date: Date) => void;
    onEdit?: (record: any) => void;
}

export function EntityCalendar({
    entity,
    records,
    dateField,
    endDateField,
    titleField,
    loading = false,
    onCreate,
    onEdit,
}: EntityCalendarProps) {
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());

    // Convert records to calendar events
    const events = useMemo(() => {
        return records.map((record) => {
            const startDate = record[dateField] ? new Date(record[dateField]) : new Date();
            const endDate = endDateField && record[endDateField]
                ? new Date(record[endDateField])
                : startDate;

            // Determine title
            let title = 'Untitled';
            if (titleField && record[titleField]) {
                title = String(record[titleField]);
            } else if (entity.primaryField && record[entity.primaryField]) {
                title = String(record[entity.primaryField]);
            } else {
                // Use first text field
                const firstTextField = entity.fields.find(f => f.type === 'text');
                if (firstTextField && record[firstTextField.name]) {
                    title = String(record[firstTextField.name]);
                }
            }

            return {
                id: record.id,
                title,
                start: startDate,
                end: endDate,
                resource: record,
            };
        });
    }, [records, dateField, endDateField, titleField, entity]);

    const handleSelectSlot = useCallback(
        ({ start }: { start: Date }) => {
            onCreate?.(start);
        },
        [onCreate]
    );

    const handleSelectEvent = useCallback(
        (event: any) => {
            onEdit?.(event.resource);
        },
        [onEdit]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="calendar-container" style={{ height: 600 }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    view={view}
                    date={date}
                    onView={setView}
                    onNavigate={setDate}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    startAccessor="start"
                    endAccessor="end"
                    titleAccessor="title"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day', 'agenda']}
                    popup
                />
            </div>

            <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        
        .rbc-event {
          background-color: #3b82f6;
          border-radius: 4px;
          padding: 2px 5px;
        }
        
        .rbc-event:hover {
          background-color: #2563eb;
        }
        
        .rbc-today {
          background-color: #eff6ff;
        }
        
        .rbc-toolbar button {
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          border-radius: 6px;
        }
        
        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
        }
        
        .rbc-toolbar button.rbc-active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .rbc-header {
          padding: 10px 3px;
          font-weight: 600;
          color: #374151;
        }
        
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
      `}</style>
        </div>
    );
}
