/**
 * Rental Pricing Configuration
 *
 * Defines hourly rental rates by bike category and duration
 */

export type BikeCategory = 'luxury_ebike' | 'ebike' | 'escooter';
export type RentalDuration = 1 | 2;
export type RentalType = 'test_ride' | 'rental';

export interface RentalPricing {
  [key: string]: {
    [duration: number]: number;
  };
}

export const RENTAL_PRICING: RentalPricing = {
  luxury_ebike: {
    1: 35, // $35 for 1 hour
    2: 70, // $70 for 2 hours (could add discount later)
  },
  ebike: {
    1: 25, // $25 for 1 hour
    2: 50, // $50 for 2 hours
  },
  escooter: {
    1: 25, // $25 for 1 hour
    2: 50, // $50 for 2 hours
  },
};

export const TEST_RIDE_AUTHORIZATION_AMOUNT = 1.00; // $1 authorization hold

/**
 * Get rental price for a bike category and duration
 */
export function getRentalPrice(category: BikeCategory, duration: RentalDuration): number {
  return RENTAL_PRICING[category]?.[duration] || 0;
}

/**
 * Get all available durations
 */
export function getAvailableDurations(): RentalDuration[] {
  return [1, 2];
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Get bike category display name
 */
export function getBikeCategoryName(category: BikeCategory): string {
  const names: Record<BikeCategory, string> = {
    luxury_ebike: 'Luxury E-Bike',
    ebike: 'E-Bike',
    escooter: 'E-Scooter',
  };
  return names[category] || category;
}

/**
 * Get duration display name
 */
export function getDurationName(duration: RentalDuration): string {
  return duration === 1 ? '1 Hour' : '2 Hours';
}

/**
 * Calculate expected return time
 */
export function calculateExpectedReturn(startTime: Date, duration: RentalDuration): Date {
  const returnTime = new Date(startTime);
  returnTime.setHours(returnTime.getHours() + duration);
  return returnTime;
}

/**
 * Check if rental is overdue
 */
export function isOverdue(expectedReturnTime: Date): boolean {
  return new Date() > new Date(expectedReturnTime);
}
