// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
    });
  }
};

// Track custom events
export const event = (action: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

// Track test drive specific events
export const trackTestDriveEvent = (eventName: string, data?: Record<string, any>) => {
  event(eventName, {
    event_category: 'test_drive',
    ...data,
  });
};

// Specific tracking functions for your app
export const analytics = {
  // Customer journey tracking
  trackFormStart: () => trackTestDriveEvent('form_start'),
  trackIdUploaded: () => trackTestDriveEvent('id_uploaded'),
  trackWaiverSigned: () => trackTestDriveEvent('waiver_signed'),
  trackPaymentAuthorized: () => trackTestDriveEvent('payment_authorized'),
  trackTestDriveCompleted: () => trackTestDriveEvent('test_drive_completed'),
  
  // Admin tracking
  trackAdminLogin: () => event('admin_login', { event_category: 'admin' }),
  trackCustomerDataViewed: () => event('customer_data_viewed', { event_category: 'admin' }),
  
  // Error tracking
  trackError: (error: string, context?: string) => {
    event('error', {
      event_category: 'error',
      error_message: error,
      error_context: context,
    });
  },
};