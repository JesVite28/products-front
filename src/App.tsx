import React, { useEffect, useState } from "react";
import { getProducts, getProductId } from "./services/productService";
import type { Product } from "./services/api";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [id, setId] = useState("");

  // Cargar todos al iniciar
  useEffect(() => {
    verTodos();
  }, []);

  const verTodos = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const buscarPorId = async () => {
    if (!id.trim()) return verTodos();
    try {
      const p = await getProductId(id.trim());
      setProducts([p]); // mostrar solo el encontrado
    } catch {
      setProducts([]); // si no existe, vacío
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* SIDEBAR (simple, se expande con hover) */}
      <aside className="fixed left-0 top-0 h-screen w-14 hover:w-52 transition-all bg-white border-r">
        <div className="h-14 flex items-center px-3 border-b font-semibold">🛒
          <span className="ml-2 hidden hover:inline">Productos</span>
        </div>
        <nav className="p-2 text-sm">
          <div className="px-3 py-2 cursor-default">📦 <span className="ml-2 hidden hover:inline">Listado</span></div>
          <div className="px-3 py-2 opacity-50 cursor-not-allowed">➕ <span className="ml-2 hidden hover:inline">Agregar (Irving)</span></div>
          <div className="px-3 py-2 opacity-50 cursor-not-allowed">✏️ <span className="ml-2 hidden hover:inline">Editar (Irving)</span></div>
          <div className="px-3 py-2 opacity-50 cursor-not-allowed">🗑️ <span className="ml-2 hidden hover:inline">Eliminar (Irving)</span></div>
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main className="ml-14">
        {/* Header + buscador */}
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold">Products</h1>
            <div className="flex gap-2">
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarPorId()}
                placeholder="Buscar por ID…"
                className="h-10 w-64 max-w-full px-3 rounded border"
              />
              <button onClick={buscarPorId} className="h-10 px-4 rounded bg-indigo-600 text-white">Buscar</button>
              <button onClick={verTodos} className="h-10 px-3 rounded border">Ver todos</button>
            </div>
          </div>
        </header>

        {/* Lista simple */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          {products.length === 0 ? (
            <div className="rounded border bg-white p-8 text-center text-gray-600">
              Sin resultados.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <article key={p._id} className="bg-white border rounded-lg overflow-hidden">
                  <img
                    src={p.image || "https://via.placeholder.com/600x400?text=Producto"}
                    alt={p.name}
                    className="w-full h-40 object-cover bg-gray-100"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{p.name}</h3>
                      <span className="text-indigo-700 font-medium">${p.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
