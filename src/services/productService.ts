import {api, type Product} from './api';

//Obtener todos los productos
export const getProducts = async (): Promise<Product[]> => {
    const res = await api.get("/index");
    return res.data.data;
}

// obtener por id
export const getProductId = async (id: string): Promise<Product> => {
    const res = await api.get(`/indexId/${id}`);
    return res.data.data;
}
//Crear un producto
export const createProduct = async (product: Product): Promise <Product> => {
    const res = await api.post("/save", product);
    return res.data.data;
}

// Actualizar un producto
export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
    const res = await api.patch(`/update/${id}`, product);
    return res.data.data;;
}

// Eliminar un producto
export const deleteProduct = async (id: string): Promise<void> => {
    await api.delete(`/delete/${id}`);
}
