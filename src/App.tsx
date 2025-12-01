// src/App.tsx
import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
} from "react";

import {
  getProducts,
  getProductId,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./services/productService";
import type { Product, User } from "./services/api";
import {
  loginUser,
  logoutUser,
  getUsers,
  updateUserById,
  deleteUserById,
} from "./services/usersService";
import { createApiForResource } from "./services/api";

const IMAGE_ERROR_MSG =
  "por favor seleccione una imagen con el formato válido no mayor a 5mb";

type View = "products" | "users" | "addUser";

// Helper para extraer nombres de roles
const getRoleNames = (user: User | null | undefined): string[] => {
  if (!user || !user.roles) return [];
  return user.roles.map((r) =>
    typeof r === "string" ? r : r.name
  );
};

export default function App() {
  // =========================
  // Estados de AUTENTICACIÓN
  // =========================
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // =========================
  // Estados de VISTAS
  // =========================
  const [activeView, setActiveView] = useState<View>("products");

  // =========================
  // Estados de PRODUCTOS
  // =========================
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [id, setId] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Overrides locales para que los cambios (como stock = 0) se respeten
  const [localOverrides, setLocalOverrides] = useState<Record<string, Product>>(
    {}
  );

  // =========================
  // Estados de USUARIOS (vista admin/gerente)
  // =========================
  const [users, setUsers] = useState<User[]>([]);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [newUserLoading, setNewUserLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // =========================
  // Derivados de ROLES
  // =========================
  const roleNames = getRoleNames(currentUser);
  const isAdmin = roleNames.includes("admin");
  const isManager = roleNames.includes("moderator");
  const isCashier = roleNames.includes("user");

  const canManageProducts = isAdmin || isManager; // Admin + Gerente
  const canManageUsers = isAdmin || isManager; // Admin + Gerente

  let roleLabel = "Usuario";
  if (isAdmin) roleLabel = "Administrador Principal";
  else if (isManager) roleLabel = "Gerente";
  else if (isCashier) roleLabel = "Cajero";

  const viewTitle =
    activeView === "products"
      ? "Productos"
      : activeView === "users"
        ? "Usuarios"
        : "Agregar usuario";

  // =========================
  // EFECTOS
  // =========================

  useEffect(() => {
    if (!currentUser) return;

    if (activeView === "products") {
      verTodos();
    } else if (activeView === "users" && canManageUsers) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeView]);

  const aplicarOverrides = (lista: Product[]): Product[] =>
    lista.map((p) =>
      p._id && localOverrides[p._id] ? localOverrides[p._id] : p
    );

  const verTodos = async () => {
    try {
      const data = await getProducts();
      const merged = aplicarOverrides(data);
      setProducts(merged);
      setAllProducts(merged);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);

      if (Array.isArray(data) && data.length > 0) {
        mostrarAlerta(
          "success",
          `Se cargaron ${data.length} usuario(s) correctamente ✅`
        );
      } else {
        mostrarAlerta("error", "No hay usuarios registrados");
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      mostrarAlerta("error", "No se pudieron cargar los usuarios ❌");
    }
  };

  const buscarPorId = async () => {
    if (activeView !== "products") return;

    const term = id.trim();
    if (!term) {
      return verTodos();
    }
    const esMongoID = /^[0-9a-fA-F]{24}$/.test(term);

    if (esMongoID) {
      try {
        const producto = await getProductId(term);
        const merged =
          producto._id && localOverrides[producto._id]
            ? localOverrides[producto._id]
            : producto;
        setProducts([merged]);
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
    if (!canManageProducts) return;
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const abrirEditar = (p: Product) => {
    if (!canManageProducts) return;
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const abrirEliminar = (p: Product) => {
    if (!canManageProducts) return;
    setDeleteTarget(p);
    setShowDeleteModal(true);
  };

  const abrirDetalle = (p: Product) => {
    setDetailProduct(p);
  };

  const mostrarAlerta = (type: "success" | "error", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 2500);
  };

  const guardarProducto = async (data: any) => {
    if (!canManageProducts) return;

    try {
      const priceNumber = Number(data.price);
      const stockNumber = Number(data.stock);
      const priceBuyNumber = Number(data.price_buy);

      if (isNaN(priceNumber) || isNaN(stockNumber) || isNaN(priceBuyNumber)) {
        mostrarAlerta("error", "Los campos numéricos deben ser válidos");
        return;
      }

      if (stockNumber < 0) {
        mostrarAlerta("error", "El stock no puede ser negativo");
        return;
      }

      const base: any = {
        ...data,
        price: priceNumber,
        stock: stockNumber,
        price_buy: priceBuyNumber,
        date_buy: data.purchaseDate,
        date_caducity: data.expirationDate,
        provider: data.supplier,
      };

      // Solo incluimos image si viene definida desde el modal
      if (data.image !== undefined) {
        base.image = data.image;
      }

      const payload: Product = base;

      if (editingProduct) {
        await updateProduct(editingProduct._id!, payload);

        const updatedProduct: Product = {
          ...(editingProduct as Product),
          ...payload,
        };

        if (updatedProduct._id) {
          setLocalOverrides((prev) => ({
            ...prev,
            [updatedProduct._id!]: updatedProduct,
          }));
        }

        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? updatedProduct : p))
        );
        setAllProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? updatedProduct : p))
        );
        setDetailProduct((prev) =>
          prev && prev._id === editingProduct._id ? updatedProduct : prev
        );

        mostrarAlerta("success", "Producto actualizado correctamente ✅");
      } else {
        const createdFromServer = await createProduct(payload);
        const newProduct: Product = createdFromServer || (payload as Product);

        if (newProduct._id) {
          setLocalOverrides((prev) => ({
            ...prev,
            [newProduct._id!]: newProduct,
          }));
        }

        setProducts((prev) => [...prev, newProduct]);
        setAllProducts((prev) => [...prev, newProduct]);

        mostrarAlerta("success", "Producto creado correctamente ✅");
      }

      setShowProductModal(false);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      mostrarAlerta(
        "error",
        "Error al guardar el producto. Revisa los datos o intenta nuevamente."
      );
    }
  };

  const confirmarEliminar = async () => {
    if (!canManageProducts) return;

    try {
      if (deleteTarget) {
        await deleteProduct(deleteTarget._id!);

        setProducts((prev) =>
          prev.filter((p) => p._id !== deleteTarget._id)
        );
        setAllProducts((prev) =>
          prev.filter((p) => p._id !== deleteTarget._id)
        );

        setLocalOverrides((prev) => {
          const clone = { ...prev };
          if (deleteTarget._id) delete clone[deleteTarget._id];
          return clone;
        });

        setDetailProduct((prev) =>
          prev && prev._id === deleteTarget._id ? null : prev
        );

        mostrarAlerta("success", "Producto eliminado correctamente ✅");
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      mostrarAlerta("error", "Algo salió mal al eliminar ❌");
    }
  };

  const handleMenuEnter = () => setMenuOpen(true);
  const handleMenuLeave = () => setMenuOpen(false);

  // =========================
  // HANDLERS DE AUTH
  // =========================

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword || (authMode === "register" && !authName)) {
      setAuthError("Todos los campos son obligatorios");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "login") {
        const { user } = await loginUser({
          email: authEmail,
          password: authPassword,
        });
        setCurrentUser(user);
        mostrarAlerta("success", "Inicio de sesión exitoso ✅");
      } else {
        const apiAuth = createApiForResource("auth");
        const res = await apiAuth.post("/register", {
          name: authName,
          email: authEmail,
          password: authPassword,
        });
        const { data } = res.data;
        setCurrentUser(data as User);
        mostrarAlerta("success", "Usuario registrado y logueado ✅");
      }

      setAuthPassword("");
    } catch (err) {
      console.error("Error en autenticación:", err);
      setAuthError("Credenciales inválidas o error en el servidor");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setProducts([]);
    setAllProducts([]);
    setLocalOverrides({});
    setDetailProduct(null);
    setShowProductModal(false);
    setShowDeleteModal(false);
    setActiveView("products");
    mostrarAlerta("success", "Sesión cerrada correctamente ✅");
  };

  // =========================
  // HANDLERS DE VISTAS
  // =========================

  const goToProducts = () => {
    setActiveView("products");
    setMenuOpen(false);
  };

  const goToUsers = () => {
    if (!canManageUsers) return;
    setActiveView("users");
    setMenuOpen(false);
  };

  const goToAddUser = () => {
    if (!canManageUsers) return;
    setNewUserForm({ name: "", email: "", password: "" });
    setActiveView("addUser");
    setMenuOpen(false);
  };

  const handleNewUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;

    if (
      !newUserForm.name.trim() ||
      !newUserForm.email.trim() ||
      !newUserForm.password.trim()
    ) {
      mostrarAlerta("error", "Todos los campos son obligatorios");
      return;
    }

    setNewUserLoading(true);
    try {
      const apiAuth = createApiForResource("auth");
      await apiAuth.post("/register", {
        name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
      });

      mostrarAlerta("success", "Usuario creado correctamente ✅");
      setNewUserForm({ name: "", email: "", password: "" });
      setActiveView("users");
      await loadUsers();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      mostrarAlerta("error", "No se pudo crear el usuario ❌");
    } finally {
      setNewUserLoading(false);
    }
  };

  // =========================
  // CRUD USUARIOS (incluye rol)
  // =========================

  const abrirEditarUsuario = (user: User) => {
    if (!canManageUsers) return;
    setEditingUser(user);
  };

  const abrirEliminarUsuario = (user: User) => {
    if (!canManageUsers) return;

    // 🚫 No permitir eliminar al usuario actualmente logueado
    if (
      currentUser &&
      (currentUser._id === user._id || currentUser.email === user.email)
    ) {
      mostrarAlerta(
        "error",
        "No puedes eliminar el usuario con el que estás actualmente logueado."
      );
      return;
    }

    setDeletingUser(user);
  };

  const guardarUsuarioEditado = async (payload: {
    name: string;
    email: string;
    role: "admin" | "moderator" | "user";
  }) => {
    if (!editingUser || !canManageUsers) return;
    try {
      const updated = await updateUserById(editingUser._id!, {
        name: payload.name,
        email: payload.email,
        roles: [payload.role], // se envía el rol por nombre
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      );
      mostrarAlerta("success", "Usuario actualizado correctamente ✅");
      setEditingUser(null);
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      mostrarAlerta("error", "No se pudo actualizar el usuario ❌");
    }
  };

  const confirmarEliminarUsuario = async () => {
    if (!deletingUser || !canManageUsers) return;

    try {
      await deleteUserById(deletingUser._id!);
      setUsers((prev) => prev.filter((u) => u._id !== deletingUser._id));
      mostrarAlerta("success", "Usuario eliminado correctamente ✅");
      setDeletingUser(null);
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      mostrarAlerta("error", "No se pudo eliminar el usuario ❌");
    }
  };

  // =========================
  // RENDER
  // =========================

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

      {!currentUser ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass w-full max-w-md rounded-xl p-8 animate-pop">
            <h1 className="text-2xl font-bold mb-2 text-center">
              {authMode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </h1>
            <p className="text-center mb-6 text-gray-300 text-sm">
              Conéctate para gestionar tus productos
            </p>

            {authError && (
              <div className="mb-4 bg-red-600 text-white px-3 py-2 rounded text-sm">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-200">Nombre</label>
                  <input
                    className="glass border px-3 py-2 rounded text-gray-100 bg-black/40"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-200">Correo</label>
                <input
                  type="email"
                  className="glass border px-3 py-2 rounded text-gray-100 bg-black/40"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-200">Contraseña</label>
                <input
                  type="password"
                  className="glass border px-3 py-2 rounded text-gray-100 bg-black/40"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoComplete={
                    authMode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-2 rounded bg-indigo-600 text-white font-semibold btn-animate disabled:opacity-60"
              >
                {authLoading
                  ? "Procesando..."
                  : authMode === "login"
                    ? "Entrar"
                    : "Registrarse"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-300">
              {authMode === "login" ? (
                <>
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError("");
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    Inicia sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
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
            <ul className="flex flex-col gap-4 text-sm">
              {activeView === "products" && (
                <>
                  <li>
                    <button
                      onClick={verTodos}
                      className="btn-animate w-full text-left text-gray-100 hover:text-indigo-400"
                    >
                      📦 Ver todos los productos
                    </button>
                  </li>
                  {canManageProducts && (
                    <li>
                      <button
                        onClick={abrirAgregar}
                        className="btn-animate w-full text-left text-gray-100 hover:text-green-400"
                      >
                        ➕ Agregar producto
                      </button>
                    </li>
                  )}
                  {canManageUsers && (
                    <li>
                      <button
                        onClick={goToUsers}
                        className="btn-animate w-full text-left text-gray-100 hover:text-cyan-400"
                      >
                        👥 Usuarios
                      </button>
                    </li>
                  )}
                </>
              )}

              {activeView !== "products" && canManageUsers && (
                <>
                  <li>
                    <button
                      onClick={goToProducts}
                      className="btn-animate w-full text-left text-gray-100 hover:text-indigo-400"
                    >
                      📦 Productos
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={goToAddUser}
                      className="btn-animate w-full text-left text-gray-100 hover:text-green-400"
                    >
                      ➕ Agregar usuario
                    </button>
                  </li>
                </>
              )}
            </ul>
          </aside>

          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-30"
            ></div>
          )}

          <main
            className={`transition-all duration-300 ${menuOpen ? "ml-64" : ""
              }`}
          >
            <header className="glass border-b fixed w-full top-0 left-0 z-20">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    Panel de control
                  </span>
                  <h1 className="text-xl font-bold">{viewTitle}</h1>
                </div>
                <div className="flex items-center gap-6">
                  {activeView === "products" && (
                    <div className="flex gap-2">
                      <input
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && buscarPorId()
                        }
                        placeholder="Buscar producto…"
                        className="h-9 w-56 max-w-full px-3 rounded glass border text-gray-200 placeholder-gray-400 text-sm"
                      />
                      <button
                        onClick={buscarPorId}
                        className="h-9 px-4 rounded bg-indigo-600 text-white btn-animate text-sm"
                      >
                        Buscar
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-sm">
                        {currentUser.name || currentUser.email}
                      </div>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-[0.7rem] uppercase tracking-wide text-gray-200">
                          {roleLabel}
                        </span>
                        <button
                          onClick={handleLogout}
                          className="text-[0.7rem] text-red-300 hover:text-red-100 underline-offset-2 hover:underline"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="h-20"></div>

            {activeView === "products" && (
              <section className="max-w-6xl mx-auto px-4 py-6">
                {products.length === 0 ? (
                  <div className="glass border p-8 text-center">
                    Sin resultados.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => {
                      const stockNumber = Number(p.stock ?? 0);

                      return (
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

                            <div className="mt-3 flex justify-between items-center text-sm">
                              <span
                                className={`px-2 py-1 rounded-full font-semibold ${stockNumber > 0
                                    ? "bg-green-600 text-white"
                                    : "bg-red-600 text-white"
                                  }`}
                              >
                                Existencias: {stockNumber}
                              </span>
                            </div>
                          </div>

                          {canManageProducts && (
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
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeView === "users" && canManageUsers && (
              <section className="max-w-5xl mx-auto px-4 py-6">
                <div className="glass border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Usuarios registrados
                  </h2>
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-300">
                      No hay usuarios registrados.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-gray-300 border-b border-gray-700">
                          <tr>
                            <th className="py-2 pr-4">ID</th>
                            <th className="py-2 pr-4">Nombre</th>
                            <th className="py-2 pr-4">Correo</th>
                            <th className="py-2 pr-4">Roles</th>
                            <th className="py-2 pr-4 text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => {
                            const rNames = getRoleNames(u);
                            const rolesText =
                              rNames.length > 0
                                ? rNames.join(", ")
                                : "sin rol";
                            return (
                              <tr
                                key={u._id || u.email}
                                className="border-b border-gray-800 last:border-b-0"
                              >
                                <td className="py-2 pr-4 text-gray-400 max-w-[140px] truncate">
                                  {u._id}
                                </td>
                                <td className="py-2 pr-4">
                                  {u.name || "-"}
                                </td>
                                <td className="py-2 pr-4">
                                  {u.email || "-"}
                                </td>
                                <td className="py-2 pr-4 text-gray-300">
                                  {rolesText}
                                </td>
                                <td className="py-2 pr-0 text-right">
                                  <button
                                    onClick={() => abrirEditarUsuario(u)}
                                    className="px-3 py-1 rounded bg-green-600 text-white text-xs mr-2 btn-animate"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => abrirEliminarUsuario(u)}
                                    className="px-3 py-1 rounded bg-red-600 text-white text-xs btn-animate"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeView === "addUser" && canManageUsers && (
              <section className="max-w-md mx-auto px-4 py-6">
                <div className="glass border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-2">
                    Agregar usuario
                  </h2>
                  <p className="text-sm text-gray-300 mb-4">
                    Crea un nuevo usuario con nombre, correo y
                    contraseña.
                  </p>

                  <form
                    onSubmit={handleNewUserSubmit}
                    className="space-y-4"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-200">
                        Nombre
                      </label>
                      <input
                        className="glass border px-3 py-2 rounded text-gray-100 bg-black/40"
                        value={newUserForm.name}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        autoComplete="name"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-200">
                        Correo
                      </label>
                      <input
                        type="email"
                        className="glass border px-3 py-2 rounded text-gray-100 bg-black/40"
                        value={newUserForm.email}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        autoComplete="email"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-200">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        className="glass border px-3 py-2 rounded text-gray-100 bg-black/40"
                        value={newUserForm.password}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        autoComplete="new-password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={newUserLoading}
                      className="w-full mt-2 py-2 rounded bg-indigo-600 text-white font-semibold btn-animate disabled:opacity-60 text-sm"
                    >
                      {newUserLoading
                        ? "Guardando..."
                        : "Guardar usuario"}
                    </button>
                  </form>
                </div>
              </section>
            )}
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

          {editingUser && (
            <ModalUsuarioEditar
              user={editingUser}
              onClose={() => setEditingUser(null)}
              onSave={guardarUsuarioEditado}
            />
          )}
          {deletingUser && (
            <ModalUsuarioEliminar
              user={deletingUser}
              onClose={() => setDeletingUser(null)}
              onConfirm={confirmarEliminarUsuario}
            />
          )}
        </>
      )}
    </div>
  );
}

// =====================================================================================
// MODAL PRODUCTO
// =====================================================================================

function ModalProducto({ producto, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: producto?.name ?? "",
    price:
      producto?.price !== undefined && producto?.price !== null
        ? String(producto.price)
        : "",
    description: producto?.description ?? "",
    stock:
      producto?.stock !== undefined && producto?.stock !== null
        ? String(producto.stock)
        : "",
    expirationDate: producto?.date_caducity
      ? producto.date_caducity.split("T")[0]
      : "",
    purchaseDate: producto?.date_buy ? producto.date_buy.split("T")[0] : "",
    supplier: producto?.provider ?? "",
    price_buy:
      producto?.price_buy !== undefined && producto?.price_buy !== null
        ? String(producto.price_buy)
        : "",
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

    if (name === "price" || name === "stock" || name === "price_buy") {
      const regex = /^-?\d*\.?\d*$/;
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

    const stockNumber = Number(form.stock);
    if (isNaN(stockNumber)) {
      setFileAlert("El stock debe ser un número válido");
      return;
    }
    if (stockNumber < 0) {
      setFileAlert("El stock no puede ser negativo");
      return;
    }

    const isEditing = !!producto;

    let payloadForSave: any = { ...form };

    // Si el usuario eligió un nuevo archivo, lo convertimos
    if (image instanceof File) {
      try {
        const imageBase64 = await toBase64(image);
        payloadForSave.image = imageBase64;
      } catch (err) {
        console.error(err);
        setFileAlert(IMAGE_ERROR_MSG);
        return;
      }
    } else if (!isEditing) {
      // Creación: si no hay imagen, mandamos cadena vacía o la que haya
      if (typeof image === "string" && image.length > 0) {
        payloadForSave.image = image;
      } else {
        payloadForSave.image = "";
      }
    }
    // Edición SIN cambiar imagen: no añadimos image, el backend conserva la actual

    try {
      await onSave(payloadForSave);
    } catch (err) {
      console.error("Error al guardar desde el modal:", err);
      setFileAlert("Ocurrió un error al guardar el producto.");
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
          <label className="text-gray-300 font-medium mb-1">
            Descripción
          </label>
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
// MODAL DETALLE PRODUCTO
// =====================================================================================

function ModalDetalle({ producto, onClose }: any) {
  const stockNumber = Number(producto.stock ?? 0);

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
          <div className="flex items-center gap-2">
            <b>Existencias:</b>
            <span
              className={`px-2 py-1 rounded-full font-semibold text-xs ${stockNumber > 0
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
                }`}
            >
              {stockNumber}
            </span>
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
// MODAL ELIMINAR PRODUCTO
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

// =====================================================================================
// MODAL EDITAR USUARIO (con selección de rol)
// =====================================================================================

function ModalUsuarioEditar({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    email: string;
    password?: string; // 👈 se queda en el payload aunque no se muestre el campo
    role: "admin" | "moderator" | "user";
  }) => void;
}) {
  const getInitialRole = (): "admin" | "moderator" | "user" => {
    const rawRoles = user.roles ?? [];
    const names = rawRoles.map((r: any) =>
      typeof r === "string" ? r : r.name
    );
    if (names.includes("admin")) return "admin";
    if (names.includes("moderator")) return "moderator";
    return "user";
  };

  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    password: "", // 👈 se mantiene por si luego reactivas el input
  });

  const [role, setRole] = useState<"admin" | "moderator" | "user">(getInitialRole());
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Nombre y correo son obligatorios");
      return;
    }

    const pass = form.password.trim();

    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      password: pass.length > 0 ? pass : undefined, // 👈 listo para usarse si luego reactivas el campo
      role,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade">
      <div className="glass max-w-sm w-full p-6 rounded-xl animate-pop">
        <h2 className="text-lg font-bold mb-4">Editar usuario</h2>

        {error && (
          <div className="mb-3 bg-red-600 text-white px-3 py-2 rounded text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-gray-200">ID</label>
            <input
              value={user._id}
              disabled
              className="glass border px-3 py-2 rounded text-gray-400 bg-black/40 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-200">Nombre</label>
            <input
              className="glass border px-3 py-2 rounded bg-black/40 text-gray-100"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-200">Correo</label>
            <input
              type="email"
              className="glass border px-3 py-2 rounded bg-black/40 text-gray-100"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          {/*
          // ✅ CAMPO CONTRASEÑA (oculto por ahora)
          // Si luego lo quieres mostrar, solo quita este comentario.

          <div className="flex flex-col gap-1">
            <label className="text-gray-200">
              Nueva contraseña{" "}
              <span className="text-[0.7rem] text-gray-400">(opcional)</span>
            </label>
            <input
              type="password"
              className="glass border px-3 py-2 rounded bg-black/40 text-gray-100"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Dejar vacío para no cambiar"
              autoComplete="new-password"
            />
          </div>
          */}

          <div className="flex flex-col gap-1">
            <label className="text-gray-200">Rol</label>
            <select
              className="
                glass border px-3 py-2 rounded 
                bg-gradient-to-r from-indigo-900/60 via-slate-900/70 to-emerald-900/60
                text-gray-100 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                hover:bg-gradient-to-r hover:from-indigo-800/70 hover:via-slate-900/80 hover:to-emerald-800/70
                cursor-pointer
              "
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "moderator" | "user")
              }
            >
              <option className="bg-slate-900 text-gray-100" value="admin">
                🛡️ Administrador principal
              </option>
              <option className="bg-slate-900 text-gray-100" value="moderator">
                📋 Gerente
              </option>
              <option className="bg-slate-900 text-gray-100" value="user">
                💰 Cajero
              </option>
            </select>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded glass border btn-animate"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white btn-animate"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// =====================================================================================
// MODAL ELIMINAR USUARIO
// =====================================================================================

function ModalUsuarioEliminar({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade">
      <div className="glass max-w-sm w-full p-6 rounded-xl animate-pop">
        <h2 className="text-lg font-bold mb-4">
          Eliminar usuario
        </h2>
        <p className="text-sm">
          ¿Deseas eliminar al usuario <b>{user.name || user.email}</b>?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded glass border btn-animate text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white btn-animate text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
