'use client';

import React, { useState } from 'react';
import { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventCalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  className?: string;
}

export function EventCalendar({ events, onEventClick, className }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get events for current month
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });
  
  // Group events by date
  const eventsByDate = monthEvents.reduce((acc, event) => {
    const dateKey = event.startDate.getDate();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<number, Event[]>);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'game_jam':
        return 'bg-purple-500';
      case 'workshop':
        return 'bg-blue-500';
      case 'meetup':
        return 'bg-green-500';
      case 'competition':
        return 'bg-yellow-500';
      case 'webinar':
        return 'bg-indigo-500';
      case 'panel':
        return 'bg-orange-500';
      case 'showcase':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs px-2"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'min-h-[80px] p-1 border border-gray-100 rounded',
                day && 'hover:bg-gray-50 cursor-pointer',
                day && isToday(day) && 'bg-blue-50 border-blue-200'
              )}
            >
              {day && (
                <>
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  )}>
                    {day}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {eventsByDate[day]?.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'text-xs px-1 py-0.5 rounded text-white cursor-pointer truncate',
                          getEventTypeColor(event.type)
                        )}
                        onClick={() => onEventClick?.(event)}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {eventsByDate[day] && eventsByDate[day].length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{eventsByDate[day].length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-700 mb-2">Event Types</div>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'game_jam' as const, label: 'Game Jams' },
              { type: 'workshop' as const, label: 'Workshops' },
              { type: 'meetup' as const, label: 'Meetups' },
              { type: 'competition' as const, label: 'Competitions' },
              { type: 'webinar' as const, label: 'Webinars' },
              { type: 'panel' as const, label: 'Panels' },
              { type: 'showcase' as const, label: 'Showcases' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-1">
                <div className={cn('w-3 h-3 rounded', getEventTypeColor(type))} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}