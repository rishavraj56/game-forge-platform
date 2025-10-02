'use client';

import React, { useState, useEffect } from 'react';

interface RealTimeStatusProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RealTimeStatus({ className, showLabel = true, size = 'md' }: RealTimeStatusProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate occasional connection issues
      const random = Math.random();
      
      if (random > 0.95) {
        // 5% chance of disconnection
        setIsConnected(false);
        setTimeout(() => setIsConnected(true), 2000); // Reconnect after 2 seconds
      } else if (random > 0.85) {
        // 10% chance of poor connection
        setConnectionQuality('poor');
        setTimeout(() => setConnectionQuality('excellent'), 3000);
      } else if (random > 0.75) {
        // 10% chance of good connection
        setConnectionQuality('good');
        setTimeout(() => setConnectionQuality('excellent'), 2000);
      }
      
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    
    switch (connectionQuality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    
    switch (connectionQuality) {
      case 'excellent':
        return 'Live';
      case 'good':
        return 'Connected';
      case 'poor':
        return 'Slow';
      default:
        return 'Unknown';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div
          className={`${getSizeClasses()} rounded-full ${getStatusColor()} ${
            isConnected ? 'animate-pulse' : ''
          }`}
        />
        {connectionQuality === 'poor' && isConnected && (
          <div className={`absolute inset-0 ${getSizeClasses()} rounded-full bg-orange-500 animate-ping`} />
        )}
      </div>
      
      {showLabel && (
        <span className={`font-medium ${getTextSize()} ${
          !isConnected ? 'text-red-600' :
          connectionQuality === 'excellent' ? 'text-green-600' :
          connectionQuality === 'good' ? 'text-yellow-600' :
          'text-orange-600'
        }`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}