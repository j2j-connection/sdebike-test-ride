/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled for different shops/deployments
 */

export interface FeatureFlags {
  // Show rental vs test ride choice on landing page
  showRentalChoice: boolean;
  // Enable rental workflow
  enableRentals: boolean;
  // Enable test ride workflow
  enableTestRides: boolean;
  // Shop-specific branding
  shopName: string;
  shopSlug: string;
}

// Get feature flags from environment or use defaults
export const FEATURES: FeatureFlags = {
  showRentalChoice: process.env.NEXT_PUBLIC_SHOW_RENTAL_CHOICE === 'true',
  enableRentals: process.env.NEXT_PUBLIC_ENABLE_RENTALS === 'true',
  enableTestRides: process.env.NEXT_PUBLIC_ENABLE_TEST_RIDES !== 'false', // Default true
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'SD Electric Bike',
  shopSlug: process.env.NEXT_PUBLIC_SHOP_SLUG || 'sd-electric-bike',
};

/**
 * Get the default route based on feature flags
 */
export function getDefaultRoute(): string {
  if (!FEATURES.showRentalChoice) {
    // If choice is hidden, route directly to the enabled option
    if (FEATURES.enableRentals && !FEATURES.enableTestRides) {
      return '/rental';
    }
    return '/test-ride';
  }
  // Show choice page
  return '/';
}
