import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  condition: string;
  description: string;
  location: string;
  status: string;
  image: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-red-600">
            Produk tidak ditemukan
          </h1>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            ← Kembali ke Katalog
          </Link>
        </div>
      </main>
    );
  }

  const whatsappNumber = "6281287817072";

  const whatsappMessage = encodeURIComponent(
    `Halo, saya tertarik dengan produk ${product.name} dengan harga Rp ${Number(
      product.price
    ).toLocaleString("id-ID")}. Apakah masih tersedia?`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            href="/"
            className="text-white/90 hover:text-white"
          >
            ← Kembali ke Katalog
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-white">
            Detail Produk
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
          
          {/* IMAGE */}
          <div className="relative min-h-[500px] bg-slate-100">
            {product.image ? (
              <img
  src={product.image}
  alt={product.name}
  className="h-full w-full object-contain"
  loading="eager"
/>
            ) : (
              <div className="flex h-full min-h-[500px] items-center justify-center text-slate-400">
                Tidak ada gambar
              </div>
            )}
          </div>

          {/* DETAIL */}
          <div className="p-8 md:p-12">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {product.category}
              </span>

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                {product.status}
              </span>
            </div>

            <h2 className="mt-6 text-3xl font-bold text-slate-900">
              {product.name}
            </h2>

            <p className="mt-5 text-3xl font-bold text-blue-600">
              Rp {Number(product.price).toLocaleString("id-ID")}
            </p>

            <div className="my-8 border-t border-slate-200" />

            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-400">Kondisi</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {product.condition}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Lokasi</p>
                <p className="mt-1 font-semibold text-slate-900">
                  📍 {product.location}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Deskripsi</p>
                <p className="mt-2 leading-7 text-slate-600">
                  {product.description}
                </p>
              </div>
            </div>

            {/* WHATSAPP */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600"
            >
              📱 Hubungi / Pesan via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}