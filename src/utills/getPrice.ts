// config/pricing.ts
export const PRICING = {
  neonSigns: {
    sizes: {
      small: 1000,
      medium: 2000,
      large: 3000,
    },
  },
  tax: 0.01, 
  shippingCost: 100,
} as const;


export const getNeonSignPrice = (size: string): number => {
  const normalizedSize = size.toLowerCase() as keyof typeof PRICING.neonSigns.sizes;
  const price = PRICING.neonSigns.sizes[normalizedSize];
  
  if (!price) {
    throw new Error(`Invalid size: ${size}`);
  }
  
  return price;
};