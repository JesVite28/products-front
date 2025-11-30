import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper para crear instancias de axios por recurso
export const createApiForResource = (resourcePath: string) => {
    const baseURL = import.meta.env.VITE_API_URL as string;
    const rootURL = baseURL.replace(/\/product\/?$/, ''); // Elimina /product del final
    return axios.create({
        baseURL: `${rootURL}/${resourcePath}`,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// Token helpers
export const TOKEN_KEY = 'app_token';

export const getToken = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
        return null;
    }
};

export const setToken = (token: string) => {
    try {
        localStorage.setItem(TOKEN_KEY, token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (e) {
        // ignore
    }
};

export const clearToken = () => {
    try {
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common['Authorization'];
    } catch (e) {
        // ignore
    }
};

// Cargar token al iniciar
const storedToken = getToken();
if (storedToken) {
    setToken(storedToken);
}

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

export interface User {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    roles?: Array<{ _id: string; name: string } | string>;
}

export interface AuthResponse {
    status: string;
    message: string;
    data?: User;
    token?: string;
}
