export interface CartItem {
  title: string;
  price: number;
  quantity: number;
  meta?: {
    font?: string;
    text?: string;
    size?: string;
    color?: string;
  };
}

export interface ShippingData {
  fullName: string;
  email: string;
  address: string;
  state: string;
  city: string;
  zip: string;
  contact: string;
}
