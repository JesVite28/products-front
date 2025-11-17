import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export interface Product {
    _id?: string;
    name: string;
    price: number;
    description: string;
    stock: number;
    date_caducity: string; // ISO string
    date_buy: string;      // ISO string
    provider: string;
    price_buy: number;
    image?: string;        // base64
}
