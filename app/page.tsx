"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Gagal mengambil produk:", error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    getProducts();
  }, []);

  const categories = useMemo(() => {
    return [
      "Semua",
      ...Array.from(new Set(products.map((product) => product.category))),
    ];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const cocokSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const cocokCategory =
      category === "Semua" || product.category === category;

    return cocokSearch && cocokCategory;
  });

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-blue-100">
                Katalog Barang
              </p>

              <h1 className="text-4xl font-bold tracking-tight">
                Katalog Produk
              </h1>

              <p className="mt-2 max-w-2xl text-blue-100">
                Temukan berbagai barang yang tersedia dengan mudah dan cepat.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-sm text-blue-100">Total Produk</p>
              <p className="text-3xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH & FILTER */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                🔎
              </span>

              <input
                type="text"
                placeholder="Cari nama produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* INFO */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Daftar Produk</h2>

            <p className="mt-1 text-sm text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-blue-600">
                {filteredProducts.length}
              </span>{" "}
              produk
            </p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="text-slate-500">Memuat katalog...</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredProducts.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="text-5xl">📦</div>

            <h3 className="mt-4 text-xl font-bold">
              Produk tidak ditemukan
            </h3>

            <p className="mt-2 text-slate-500">
              Coba gunakan kata kunci atau kategori lain.
            </p>
          </div>
        )}

        {/* PRODUCT GRID */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
         {filteredProducts.map((product) => (
  <Link
    key={product.id}
    href={`/product/${product.id}`}
    className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
  >
                {/* IMAGE */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      📦
                    </div>
                  )}

                  {/* CATEGORY */}
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow backdrop-blur">
                      {product.category}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="absolute right-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow ${
                        product.status?.toLowerCase() === "tersedia"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <h3 className="min-h-[56px] text-lg font-bold leading-7 text-slate-900">
                    {product.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-500">
                    {product.description}
                  </p>

                  {/* PRICE */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Harga
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {formatRupiah(product.price)}
                    </p>
                  </div>

                  <div className="my-4 border-t border-slate-100" />

                  {/* DETAIL */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Kondisi</span>
                      <span className="font-semibold text-slate-700">
                        {product.condition}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Lokasi</span>
                      <span className="text-right font-medium text-slate-700">
                        📍 {product.location}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          © 2026 Katalog Produk
        </div>
      </footer>
    </main>
  );
}