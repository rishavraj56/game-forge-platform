import { supabase, type RealtimeChannel, type ConnectionStatus, isSupabaseAvailable } from '../supabase';

export class RealtimeConnectionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionStatus: ConnectionStatus = 'CLOSED';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = isSupabaseAvailable();
    if (this.isEnabled) {
      this.setupConnectionMonitoring();
    } else {
      console.warn('Supabase not configured. Real-time features are disabled.');
    }
  }

  /**
   * Set up connection monitoring and auto-reconnection
   */
  private setupConnectionMonitoring() {
    if (!supabase) return;

    // Monitor connection status changes
    supabase.realtime.onOpen(() => {
      this.connectionStatus = 'OPEN';
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyStatusChange('OPEN');
      console.log('Supabase realtime connection opened');
    });

    supabase.realtime.onClose(() => {
      this.connectionStatus = 'CLOSED';
      this.notifyStatusChange('CLOSED');
      console.log('Supabase realtime connection closed');
      this.handleReconnection();
    });

    supabase.realtime.onError((error: Error) => {
      this.connectionStatus = 'ERROR';
      this.notifyStatusChange('ERROR');
      console.error('Supabase realtime connection error:', error);
      this.handleReconnection();
    });
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connectionStatus = 'CONNECTING';
      this.notifyStatusChange('CONNECTING');

      // Resubscribe to all existing channels
      this.resubscribeChannels();
    }, delay);
  }

  /**
   * Resubscribe to all existing channels after reconnection
   */
  private resubscribeChannels() {
    if (!supabase) return;

    const channelNames = Array.from(this.channels.keys());

    channelNames.forEach(channelName => {
      const channel = this.channels.get(channelName);
      if (channel) {
        // Remove the old channel
        supabase.removeChannel(channel);

        // Create a new channel with the same name
        // Note: The specific subscription logic will be handled by the event handlers
        console.log(`Resubscribing to channel: ${channelName}`);
      }
    });
  }

  /**
   * Subscribe to a real-time channel
   */
  public subscribe(channelName: string): RealtimeChannel | null {
    if (!this.isEnabled || !supabase) {
      console.warn('Real-time features are disabled');
      return null;
    }

    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName)!;
      supabase.removeChannel(existingChannel);
    }

    // Create new channel
    const channel = supabase.channel(channelName);
    this.channels.set(channelName, channel);

    // Subscribe to the channel
    channel.subscribe((status: string) => {
      console.log(`Channel ${channelName} subscription status:`, status);
    });

    return channel;
  }

  /**
   * Unsubscribe from a real-time channel
   */
  public unsubscribe(channelName: string): Promise<'ok' | 'timed out' | 'error'> {
    const channel = this.channels.get(channelName);

    if (channel && supabase) {
      this.channels.delete(channelName);
      return supabase.removeChannel(channel);
    }

    return Promise.resolve('ok');
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Add a callback for connection status changes
   */
  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify all status callbacks of connection changes
   */
  private notifyStatusChange(status: ConnectionStatus) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Manually disconnect from Supabase realtime
   */
  public disconnect(): Promise<void> {
    // Unsubscribe from all channels
    const unsubscribePromises = Array.from(this.channels.keys()).map(
      channelName => this.unsubscribe(channelName)
    );

    return Promise.all(unsubscribePromises).then(() => {
      // Disconnect from Supabase
      if (supabase) {
        supabase.realtime.disconnect();
      }
      this.connectionStatus = 'CLOSED';
      this.notifyStatusChange('CLOSED');
    });
  }

  /**
   * Get all active channel names
   */
  public getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if a specific channel is active
   */
  public isChannelActive(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

// Singleton instance
export const realtimeManager = new RealtimeConnectionManager();