"use client";
const ADMIN_EMAIL = "yossiagil28@gmail.com";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  condition: string;
  description: string;
  location: string;
  status: string;
  image: string;
};

type NewProduct = {
  name: string;
  category: string;
  price: number;
  condition: string;
  description: string;
  location: string;
  status: string;
};

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    category: "Furniture",
    price: 0,
    condition: "Baik",
    description: "",
    location: "Biak",
    status: "Tersedia",
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);
    setLoading(false);

    if (session) {
      loadProducts();
    }
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setMessage("Gagal mengambil produk: " + error.message);
      return;
    }

    setProducts(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProducts([]);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Menambahkan produk...");

    const { error } = await supabase
      .from("products")
      .insert({
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        condition: newProduct.condition,
        description: newProduct.description,
        location: newProduct.location,
        status: newProduct.status,
        image: "",
      });

    if (error) {
      setMessage("Gagal menambahkan produk: " + error.message);
      return;
    }

    setMessage("✅ Produk berhasil ditambahkan.");
    setShowAddForm(false);

    setNewProduct({
      name: "",
      category: "Furniture",
      price: 0,
      condition: "Baik",
      description: "",
      location: "Biak",
      status: "Tersedia",
    });

    await loadProducts();
  }

  async function saveProduct(product: Product) {
    setMessage("Menyimpan perubahan...");

    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        category: product.category,
        price: product.price,
        condition: product.condition,
        description: product.description,
        location: product.location,
        status: product.status,
      })
      .eq("id", product.id);

    if (error) {
      setMessage("Gagal menyimpan: " + error.message);
      return;
    }

    setMessage("✅ Produk berhasil diperbarui.");
    setEditingId(null);
    await loadProducts();
  }
async function deleteProduct(product: Product) {
  const confirmed = window.confirm(
    `Apakah Anda yakin ingin menghapus "${product.name}"?`
  );

  if (!confirmed) {
    return;
  }

  setMessage("Menghapus produk...");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id);

  if (error) {
    setMessage(
      "❌ Gagal menghapus produk: " +
        error.message
    );
    return;
  }

  setMessage("✅ Produk berhasil dihapus.");

  setEditingId(null);

  await loadProducts();
}
async function uploadImage(productId: number, file: File) {
  try {
    setUploadingId(productId);
    setMessage("Mengupload foto...");

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `product-${productId}-${Date.now()}.${extension}`;

    // 1. Upload ke Storage
    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          upsert: false,
        });

    if (uploadError) {
      setMessage(
        "❌ Upload gagal: " + uploadError.message
      );
      return;
    }

    console.log("UPLOAD BERHASIL:", uploadData);

    // 2. Ambil URL publik
    const { data: publicData } =
      supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    console.log("PUBLIC URL:", publicUrl);

    // 3. Simpan URL ke database
    const { error: updateError } =
      await supabase
        .from("products")
        .update({
          image: publicUrl,
        })
        .eq("id", productId);

    if (updateError) {
      setMessage(
        "❌ Database gagal diperbarui: " +
          updateError.message
      );
      return;
    }

    setMessage("✅ Foto berhasil diperbarui.");

    await loadProducts();
  } catch (error) {
    console.error("ERROR UPLOAD:", error);

    setMessage(
      "❌ Terjadi error: " +
        (error instanceof Error
          ? error.message
          : String(error))
    );
  } finally {
    setUploadingId(null);
  }
}
  function updateProduct(
    id: number,
    field: keyof Product,
    value: string | number
  ) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, [field]: value }
          : product
      )
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Memuat...</p>
      </main>
    );
  }

  if (!session) {
  return <Login />;
}

if (session.user.email !== ADMIN_EMAIL) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Akses Ditolak
        </h1>
        <p className="mt-2 text-gray-600">
          Anda tidak memiliki akses ke halaman admin.
        </p>
        <button
          onClick={logout}
          className="mt-6 bg-red-600 text-white px-5 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Admin Katalog
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola produk katalog Yosi
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 mb-6">

          <button
            onClick={() =>
              setShowAddForm(!showAddForm)
            }
            className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold"
          >
            {showAddForm
              ? "Tutup Form"
              : "+ Tambah Produk"}
          </button>

          {showAddForm && (
            <form
              onSubmit={addProduct}
              className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5"
            >

              <div>
                <label className="block font-medium mb-2">
                  Nama Produk
                </label>

                <input
                  required
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Harga
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: Number(
                        e.target.value
                      ),
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Kategori
                </label>

                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                >
                  <option value="Furniture">
                    Furniture
                  </option>
                  <option value="Elektronik">
                    Elektronik
                  </option>
                  <option value="Kendaraan">
                    Kendaraan
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Kondisi
                </label>

                <input
                  value={newProduct.condition}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      condition: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Lokasi
                </label>

                <input
                  value={newProduct.location}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      location: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Status
                </label>

                <select
                  value={newProduct.status}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      status: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                >
                  <option value="Tersedia">
                    Tersedia
                  </option>
                  <option value="Terjual">
                    Terjual
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium mb-2">
                  Deskripsi
                </label>

                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Simpan Produk
                </button>
              </div>

            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">
              Daftar Produk ({products.length})
            </h2>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">
                    Produk
                  </th>

                  <th className="text-left p-4">
                    Harga
                  </th>

                  <th className="text-left p-4">
                    Kategori
                  </th>

                  <th className="text-left p-4">
                    Status
                  </th>

                  <th className="text-left p-4">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>

                {products.map((product) => {

                  const isEditing =
                    editingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="border-t"
                    >

                      <td className="p-4">

                        <div className="flex items-center gap-4 min-w-[330px]">

                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 text-center">
                              Belum ada foto
                            </div>
                          )}

                          <div className="flex-1">

                            {isEditing ? (
                              <>
                                <input
                                  value={product.name}
                                  onChange={(e) =>
                                    updateProduct(
                                      product.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="border rounded-lg px-3 py-2 w-full font-semibold"
                                />

                                <input
                                  value={product.condition}
                                  onChange={(e) =>
                                    updateProduct(
                                      product.id,
                                      "condition",
                                      e.target.value
                                    )
                                  }
                                  className="border rounded-lg px-3 py-2 w-full mt-2 text-sm"
                                />
                              </>
                            ) : (
                              <>
                                <p className="font-semibold">
                                  {product.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {product.condition}
                                </p>
                              </>
                            )}

                            <label className="inline-block mt-2 cursor-pointer">

                              <span className="bg-gray-200 px-3 py-2 rounded-lg text-sm">
                                {uploadingId === product.id
                                  ? "Mengupload..."
                                  : "📷 Ganti Foto"}
                              </span>

                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={
                                  uploadingId === product.id
                                }
                                onChange={(e) => {

                                  const file =
                                    e.target.files?.[0];

                                  if (file) {
                                    uploadImage(
                                      product.id,
                                      file
                                    );
                                  }

                                  e.target.value = "";
                                }}
                              />

                            </label>

                          </div>
                        </div>

                      </td>

                      <td className="p-4 whitespace-nowrap">

                        {isEditing ? (
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) =>
                              updateProduct(
                                product.id,
                                "price",
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="border rounded-lg px-3 py-2 w-36"
                          />
                        ) : (
                          `Rp ${product.price.toLocaleString(
                            "id-ID"
                          )}`
                        )}

                      </td>

                      <td className="p-4">

                        {isEditing ? (
                          <select
                            value={product.category}
                            onChange={(e) =>
                              updateProduct(
                                product.id,
                                "category",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-3 py-2"
                          >
                            <option value="Furniture">
                              Furniture
                            </option>

                            <option value="Elektronik">
                              Elektronik
                            </option>

                            <option value="Kendaraan">
                              Kendaraan
                            </option>
                          </select>
                        ) : (
                          product.category
                        )}

                      </td>

                      <td className="p-4">

                        <select
                          value={product.status}
                          onChange={(e) =>
                            updateProduct(
                              product.id,
                              "status",
                              e.target.value
                            )
                          }
                          className="border rounded-lg px-3 py-2"
                        >
                          <option value="Tersedia">
                            Tersedia
                          </option>

                          <option value="Terjual">
                            Terjual
                          </option>
                        </select>

                      </td>

                      <td className="p-4">

                        {isEditing ? (
                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                saveProduct(
                                  product
                                )
                              }
                              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              Simpan
                            </button>

                            <button
                              onClick={() => {
                                setEditingId(null);
                                loadProducts();
                              }}
                              className="bg-gray-200 px-4 py-2 rounded-lg"
                            >
                              Batal
                            </button>

                          </div>
                        ) : (
                          <div className="flex gap-2">

  <button
    onClick={() =>
      setEditingId(product.id)
    }
    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
  >
    Edit
  </button>

  <button
    onClick={() =>
      deleteProduct(product)
    }
    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
  >
    Hapus
  </button>

</div>
                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        </div>

      </div>
    </main>
  );
}

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setMessage("Memproses login...");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(
        "Login gagal: " + error.message
      );
      return;
    }

    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center mb-2">
          Admin Katalog
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Silakan login untuk mengelola produk
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>
            <label className="block font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Email admin"
              required
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Password"
              required
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white rounded-lg py-3 font-semibold"
          >
            Login Admin
          </button>

        </form>

        {message && (
          <p className="mt-5 text-center text-sm">
            {message}
          </p>
        )}

      </div>

    </main>
  );
}