// src/services/api.ts
import axios from "axios";

// ==========================
// Instancia base para productos
// ==========================
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ==========================
// Token helpers
// ==========================
export const TOKEN_KEY = "app_token";

export const getToken = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

export const setToken = (token: string) => {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {
        // ignore
    }

    // Asignar token a la instancia base
    (api.defaults.headers as any).common = {
        ...(api.defaults.headers as any).common,
        Authorization: `Bearer ${token}`,
        "x-access-token": token,
    };
};

export const clearToken = () => {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        // ignore
    }

    if ((api.defaults.headers as any).common) {
        delete (api.defaults.headers as any).common["Authorization"];
        delete (api.defaults.headers as any).common["x-access-token"];
    }
};

// ==========================
// Helper para crear instancias por recurso
// auth, user, etc.
// ==========================
export const createApiForResource = (resourcePath: string) => {
    const baseURL = import.meta.env.VITE_API_URL as string;
    const rootURL = baseURL.replace(/\/product\/?$/, ""); // Elimina /product del final

    const instance = axios.create({
        baseURL: `${rootURL}/${resourcePath}`,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Si ya hay token guardado, lo agregamos a esta instancia también
    const token = getToken();
    if (token) {
        (instance.defaults.headers as any).common = {
            ...(instance.defaults.headers as any).common,
            Authorization: `Bearer ${token}`,
            "x-access-token": token,
        };
    }

    return instance;
};

// ==========================
// Cargar token al iniciar
// ==========================
const storedToken = getToken();
if (storedToken) {
    setToken(storedToken);
}

// ==========================
// Tipos
// ==========================
export interface Product {
    _id?: string;
    name: string;
    price: number;
    description: string;
    stock: number;
    date_caducity: string; // ISO string
    date_buy: string; // ISO string
    provider: string;
    price_buy: number;
    image?: string; // base64
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
