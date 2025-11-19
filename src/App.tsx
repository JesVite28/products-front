import { useEffect, useState, useRef } from "react";
import {
  getProducts,
  getProductId,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./services/productService";
import type { Product } from "./services/api";

const IMAGE_ERROR_MSG =
  "por favor seleccione una imagen con el formato válido no mayor a 5mb";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [id, setId] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    verTodos();
  }, []);

  const verTodos = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setAllProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const buscarPorId = async () => {
    const term = id.trim();
    if (!term) {
      return verTodos();
    }
    const esMongoID = /^[0-9a-fA-F]{24}$/.test(term);

    if (esMongoID) {
      try {
        const producto = await getProductId(term);
        setProducts([producto]);
      } catch (err) {
        console.error(err);
        setProducts([]);
      }
    }

    const lower = term.toLowerCase();
    const filtrados = allProducts.filter(
      (producto) =>
        producto.name.toLowerCase().includes(lower) ||
        producto.description.toLowerCase().includes(lower) ||
        producto.provider.toLowerCase().includes(lower)
    );
    setProducts(filtrados);
  };

  const abrirAgregar = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const abrirEditar = (p: Product) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const abrirEliminar = (p: Product) => {
    setDeleteTarget(p);
    setShowDeleteModal(true);
  };

  const abrirDetalle = (p: Product) => {
    setDetailProduct(p);
  };

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const mostrarAlerta = (type: "success" | "error", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 2500);
  };

  const guardarProducto = async (data: any) => {
    try {
      const payload: Product = {
        ...data,
        price: Number(data.price),
        stock: Number(data.stock),
        price_buy: Number(data.price_buy),
        date_buy: data.purchaseDate,
        date_caducity: data.expirationDate,
        provider: data.supplier,
        image: data.image || "",
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id!, payload);
        mostrarAlerta("success", "Producto actualizado correctamente ✅");
      } else {
        await createProduct(payload);
        mostrarAlerta("success", "Producto creado correctamente ✅");
      }
      setShowProductModal(false);
      verTodos();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      // Mensaje específico cuando hay errores al guardar (incluyendo imagen)
      mostrarAlerta("error", IMAGE_ERROR_MSG);
    }
  };

  const confirmarEliminar = async () => {
    try {
      if (deleteTarget) {
        await deleteProduct(deleteTarget._id!);
        mostrarAlerta("success", "Producto eliminado correctamente ✅");
        setShowDeleteModal(false);
        verTodos();
      }
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      mostrarAlerta("error", "Algo salió mal al eliminar ❌");
    }
  };

  const handleMenuEnter = () => setMenuOpen(true);
  const handleMenuLeave = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 overflow-x-hidden">
      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        @keyframes popIn { from {opacity:0; transform:scale(.8);} to{opacity:1;transform:scale(1);} }
        .animate-pop { animation: popIn .25s ease-out; }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        .animate-fade { animation: fadeIn .25s ease-out; }
        .btn-animate { transition: transform 0.2s, background-color 0.2s; }
        .btn-animate:hover { transform: scale(1.05); }
        .btn-animate:active { transform: scale(0.95); }
        .drawer { transition: transform 0.3s ease-in-out; }
        .drawer-open { transform: translateX(0); }
        .drawer-closed { transform: translateX(-100%); }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s; position: relative; }
        .card-hover:hover { transform: scale(1.03); box-shadow: 0 15px 25px rgba(0,0,0,0.5); cursor: pointer; }
        .card-buttons { opacity: 0; transition: opacity 0.3s; position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap:0.5rem; }
        .card-hover:hover .card-buttons { opacity: 1; }
      `}</style>

      {alert && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] p-4 rounded-lg font-semibold animate-pop ${alert.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
            }`}
        >
          {alert.msg}
        </div>
      )}

      <div
        className="fixed top-0 left-0 h-full w-2 z-30"
        onMouseEnter={handleMenuEnter}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900/90 glass z-40 p-6 drawer ${menuOpen ? "drawer-open" : "drawer-closed"
          }`}
        onMouseEnter={handleMenuEnter}
        onMouseLeave={handleMenuLeave}
      >
        <h2 className="text-2xl font-bold mb-6">Menú</h2>
        <ul className="flex flex-col gap-4">
          <li>
            <button
              onClick={verTodos}
              className="btn-animate w-full text-left text-gray-100 hover:text-indigo-400"
            >
              Ver todos
            </button>
          </li>
          <li>
            <button
              onClick={abrirAgregar}
              className="btn-animate w-full text-left text-gray-100 hover:text-green-400"
            >
              ➕ Agregar producto
            </button>
          </li>
        </ul>
      </aside>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30"
        ></div>
      )}

      <main
        className={`transition-all duration-300 ${menuOpen ? "ml-64" : ""}`}
      >
        <header className="glass border-b fixed w-full top-0 left-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Productos</h1>
            </div>
            <div className="flex gap-2">
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarPorId()}
                placeholder="Buscar por ID…"
                className="h-10 w-64 max-w-full px-3 rounded glass border text-gray-200 placeholder-gray-400"
              />
              <button
                onClick={buscarPorId}
                className="h-10 px-4 rounded bg-indigo-600 text-white btn-animate"
              >
                Buscar
              </button>
            </div>
          </div>
        </header>

        <div className="h-20"></div>

        <section className="max-w-6xl mx-auto px-4 py-6">
          {products.length === 0 ? (
            <div className="glass border p-8 text-center">Sin resultados.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <article
                  key={p._id}
                  className="glass border rounded-xl overflow-hidden shadow-lg card-hover group"
                >
                  <img
                    src={
                      p.image ||
                      "https://via.placeholder.com/600x400?text=Producto"
                    }
                    alt={p.name}
                    className="w-full h-40 object-cover"
                    onClick={() => abrirDetalle(p)}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{p.name}</h3>
                      <span className="text-indigo-400 font-medium">
                        ${p.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="card-buttons">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="px-2 py-1 rounded bg-green-600 text-white text-sm btn-animate"
                      autoComplete="off"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => abrirEliminar(p)}
                      className="px-2 py-1 rounded bg-red-600 text-white text-sm btn-animate"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {showProductModal && (
        <ModalProducto
          producto={editingProduct}
          onClose={() => setShowProductModal(false)}
          onSave={guardarProducto}
        />
      )}
      {showDeleteModal && (
        <ModalEliminar
          producto={deleteTarget}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmarEliminar}
        />
      )}
      {detailProduct && (
        <ModalDetalle
          producto={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
}

// =====================================================================================
// MODAL PRODUCTO (VALIDACIÓN DE IMAGEN + ALERTA + VALIDACIÓN NUMÉRICA)
// =====================================================================================

function ModalProducto({ producto, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: producto?.name || "",
    price: producto?.price || "",
    description: producto?.description || "",
    stock: producto?.stock || "",
    expirationDate: producto?.date_caducity
      ? producto.date_caducity.split("T")[0]
      : "",
    purchaseDate: producto?.date_buy ? producto.date_buy.split("T")[0] : "",
    supplier: producto?.provider || "",
    price_buy: producto?.price_buy || "",
  });

  const [image, setImage] = useState<string | File>(producto?.image || "");

  const [fileAlert, setFileAlert] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: any) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024;

    if (!file.type.startsWith("image/")) {
      setFileAlert(IMAGE_ERROR_MSG);
      return;
    }

    if (file.size > maxSize) {
      setFileAlert(IMAGE_ERROR_MSG);
      return;
    }

    setFileAlert("");
    setImage(file);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // Validación numérica para price, stock y price_buy (solo números y decimales)
    if (name === "price" || name === "stock" || name === "price_buy") {
      const regex = /^\d*\.?\d*$/; // permite "", "123", "123.", "123.45"
      if (value === "" || regex.test(value)) {
        setForm({ ...form, [name]: value });
      }
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const submit = async () => {
    const values = Object.values(form);
    if (values.some((v) => v === "" || v === null)) {
      setFileAlert("Todos los campos son obligatorios");
      return;
    }

    let imageBase64 = typeof image === "string" ? image : "";
    if (image instanceof File) {
      try {
        imageBase64 = await toBase64(image);
      } catch (err) {
        console.error(err);
        // Error al convertir/guardar la imagen
        setFileAlert(IMAGE_ERROR_MSG);
        return;
      }
    }

    try {
      await onSave({ ...form, image: imageBase64 });
    } catch (err) {
      console.error("Error al guardar desde el modal:", err);
      // Error al guardar (crear/editar) el producto
      setFileAlert(IMAGE_ERROR_MSG);
    }
  };

  return (
    <div className="overflow-y-scroll fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade">
      {fileAlert && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white px-4 py-2 rounded font-semibold animate-pop shadow-lg">
          {fileAlert}
        </div>
      )}

      <div className="glass w-full max-w-xl rounded-xl p-6 animate-pop">
        <h2 className="text-xl font-bold mb-4">
          {producto ? "Editar Producto" : "Agregar Producto"}
        </h2>

        <div
          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-white/5 transition relative"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {image && typeof image === "string" ? (
            <img
              src={image}
              alt="Producto"
              className="mx-auto max-h-40 object-contain"
            />
          ) : image instanceof File ? (
            <p className="font-medium text-indigo-400">{image.name}</p>
          ) : (
            <p className="text-gray-300">
              Arrastra una imagen o haz click para seleccionar
            </p>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Nombre</label>
            <input
              className="glass border px-3 py-2 rounded"
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Precio</label>
            <input
              className="glass border px-3 py-2 rounded"
              name="price"
              value={form.price}
              onChange={handleChange}
              autoComplete="off"
              inputMode="decimal"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Stock</label>
            <input
              className="glass border px-3 py-2 rounded"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              autoComplete="off"
              inputMode="decimal"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Proveedor</label>
            <input
              className="glass border px-3 py-2 rounded"
              name="supplier"
              value={form.supplier}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">
              Precio compra
            </label>
            <input
              className="glass border px-3 py-2 rounded"
              name="price_buy"
              value={form.price_buy}
              onChange={handleChange}
              autoComplete="off"
              inputMode="decimal"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">
              Fecha de compra
            </label>
            <input
              className="glass border px-3 py-2 rounded"
              type="date"
              name="purchaseDate"
              value={form.purchaseDate}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">
              Fecha de caducidad
            </label>
            <input
              className="glass border px-3 py-2 rounded"
              type="date"
              name="expirationDate"
              value={form.expirationDate}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex flex-col mt-3">
          <label className="text-gray-300 font-medium mb-1">Descripción</label>
          <textarea
            className="glass border px-3 py-2 rounded w-full h-20"
            name="description"
            value={form.description}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded glass border btn-animate"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded bg-indigo-600 text-white btn-animate"
            autoComplete="new-password"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// MODAL DETALLE
// =====================================================================================

function ModalDetalle({ producto, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade">
      <div className="glass max-w-xl w-full p-6 rounded-xl animate-pop overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">{producto.name}</h2>
        <img
          src={
            producto.image ||
            "https://via.placeholder.com/600x400?text=Producto"
          }
          alt={producto.name}
          className="w-full max-h-60 object-contain mb-4 rounded"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <b>Precio:</b> ${producto.price}
          </div>
          <div>
            <b>Stock:</b> {producto.stock}
          </div>
          <div>
            <b>Proveedor:</b> {producto.provider}
          </div>
          <div>
            <b>Precio compra:</b> ${producto.price_buy}
          </div>
          <div>
            <b>Fecha compra:</b> {producto.date_buy?.split("T")[0]}
          </div>
          <div>
            <b>Fecha caducidad:</b> {producto.date_caducity?.split("T")[0]}
          </div>
        </div>
        <div className="mt-4">
          <b>Descripción:</b> {producto.description}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded glass border btn-animate"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// MODAL ELIMINAR
// =====================================================================================

function ModalEliminar({ producto, onClose, onConfirm }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade">
      <div className="glass max-w-sm w-full p-6 rounded-xl animate-pop">
        <h2 className="text-lg font-bold mb-4">Eliminar producto</h2>
        <p>
          ¿Deseas eliminar el producto <b>{producto?.name}</b>?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded glass border btn-animate"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white btn-animate"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
