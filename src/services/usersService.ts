import { createApiForResource, setToken, clearToken, type User } from './api';

const apiAuth = createApiForResource('auth');
const apiUser = createApiForResource('user');

// Auth - Registro
export const registerUser = async (payload: { name: string; email: string; password: string }) => {
    const res = await apiAuth.post('/register', payload);
    const { token, data } = res.data;
    if (token) {
        setToken(token);
    }
    return { token, user: data as User };
};

// Auth - Login
export const loginUser = async (payload: { email: string; password: string }) => {
    const res = await apiAuth.post('/login', payload);
    const { token, data } = res.data;
    if (token) {
        setToken(token);
    }
    return { token, user: data as User };
};

// Auth - Logout
export const logoutUser = () => {
    clearToken();
};

// Users - Obtener todos (requiere token + admin)
export const getUsers = async (): Promise<User[]> => {
    const res = await apiUser.get('/index');
    return res.data.data;
};

// Users - Obtener por ID (requiere token + admin)
export const getUserById = async (id: string): Promise<User> => {
    const res = await apiUser.get(`/indexId/${id}`);
    return res.data.data;
};

// Users - Actualizar (requiere token + admin)
export const updateUserById = async (id: string, payload: Partial<User>): Promise<User> => {
    const res = await apiUser.patch(`/update/${id}`, payload);
    return res.data.data;
};

// Users - Eliminar (requiere token + admin)
export const deleteUserById = async (id: string): Promise<void> => {
    await apiUser.delete(`/delete/${id}`);
};
