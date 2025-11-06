# 💻 Products App – Frontend

Interfaz web desarrollada con **React + Vite + TypeScript** para consumir la API de productos.  
Permite **listar, agregar, eliminar y consultar** productos en tiempo real.

---

## 🚀 Tecnologías

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://axios-http.com/)
- [Tailwind CSS](https://tailwindcss.com/) *(opcional)*
- [React Router](https://reactrouter.com/) *(si se usa navegación)*

---

## 📂 Estructura del proyecto

```
products-front/
├── src/
│   ├── components/
│   │   ├── Products.tsx
│   │   └── ProductDetail.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── productService.ts
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz con la URL de tu backend:

```env
VITE_API_URL=http://localhost:3690/api/v1/product
```

> 🔗 [Vite Docs – Env Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## 🧩 Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## 🔗 Consumo de la API

El proyecto usa **Axios** configurado con `baseURL` en `src/services/api.ts`:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});
```

Y el servicio de productos en `src/services/productService.ts`:

```ts
export const getProducts = async () => {
  const res = await api.get("/index");
  return res.data.data;
};
```

---

## 🧠 Componentes principales

- **Products.tsx:**  
  Lista todos los productos, permite crear y eliminar.

- **ProductDetail.tsx:**  
  Consulta un producto por ID y muestra su detalle.

---

## 📷 Vista de ejemplo

```
Productos
---------------------------------------
Laptop Dell XPS — $28999
Mouse Logitech — $599
[Agregar nuevo producto]
```

---

## ⚙️ Comandos útiles

| Comando | Descripción |
|----------|--------------|
| `npm run dev` | Ejecutar entorno de desarrollo |
| `npm run build` | Compilar proyecto para producción |
| `npm run preview` | Previsualizar compilado localmente |

---

## 🧩 Integración completa

Para que funcione correctamente:
1. Inicia el backend: `npm run dev` dentro de `/products-back`
2. Inicia el frontend: `npm run dev` dentro de `/products-front`
3. Accede a `http://localhost:5173` para ver la interfaz

---

## 🧪 Ejemplo de consumo real (React oficial)

Basado en [React.dev – Fetching Data](https://react.dev/learn/synchronizing-with-effects):

```tsx
useEffect(() => {
  getProducts()
    .then(setProducts)
    .catch(console.error);
}, []);
```

---

## 💬 Autor

Desarrollado por 
Adrian Vite 
Gilberto Hernandez
Omar Torres
Irving Alvarez