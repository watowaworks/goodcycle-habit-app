"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged } from "@/lib/firebase";

const features = [
  {
    title: "シンプルな登録・記録",
    description: "習慣を登録して記録するシンプルな操作で、続けるハードルを下げます。",
  },
  {
    title: "ガーデンが成長を可視化",
    description: "続けるほど景色が変わり、努力が目に見えます。",
  },
  {
    title: "通知機能で続けやすく",
    description: "お好みの時間に通知を設定して、習慣化をサポートします。",
  },
];

const steps = [
  { title: "習慣を登録", description: "続けたい行動を登録しよう" },
  { title: "毎日記録", description: "その日完了した習慣をチェックするだけ" },
  { title: "成長を可視化", description: "一目で今の状態がわかる" },
];

const screenshots = [
  { src: "/screenshots/home.png", alt: "ホーム画面のイメージ" },
  { src: "/screenshots/dashboard.png", alt: "ダッシュボード画面のイメージ" },
  { src: "/screenshots/garden.png", alt: "ガーデン画面のイメージ" },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/app");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            GoodCycle
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-linear-to-b from-emerald-50/80 to-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 text-center">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm font-semibold text-emerald-600">
                頑張らなくても続けられる習慣アプリ
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                頑張りたいのに続かない人のための、
                <br />
                成長が見える習慣トラッカー
              </h1>
              <p className="mt-4 text-base text-gray-600 sm:text-lg">
                記録・3D空間で可視化・振り返りで、努力が続く実感に変わります。
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/app"
                className="w-auto rounded-full bg-emerald-500 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:w-auto"
              >
                使ってみる
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-bold text-gray-900">
            続けられる理由
          </h2>
            <div className="mt-8">
            <div className="flex flex-col gap-3 md:hidden">
              {features.map((feature, index) => (
                <div key={feature.title} className="flex flex-col items-center">
                  <div className="w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                  {index < features.length - 1 && (
                    <span className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 rotate-90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h12m0 0l-4-4m4 4l-4 4"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="relative mx-auto hidden h-[600px] max-w-3xl md:block">
              <div className="absolute left-1/2 top-0 w-64 h-64 -translate-x-1/2 rounded-full border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {features[0].title}
                </h3>
                <p className="mt-3 text-sm text-gray-600">
                  {features[0].description}
                </p>
              </div>

              <div className="absolute bottom-0 left-5 w-64 h-64 rounded-full border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {features[1].title}
                </h3>
                <p className="mt-3 text-sm text-gray-600">
                  {features[1].description}
                </p>
              </div>

              <div className="absolute bottom-0 right-5 w-64 h-64 rounded-full border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {features[2].title}
                </h3>
                <p className="mt-3 text-sm text-gray-600">
                  {features[2].description}
                </p>
              </div>

              <svg
                aria-hidden="true"
                viewBox="0 0 600 600"
                className="pointer-events-none absolute inset-0 h-full w-full text-emerald-200/80"
                fill="none"
                stroke="currentColor"
                strokeWidth={5}
              >
                <defs>
                  <marker
                    id="cycle-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path
                      d="M0 0 L6 3 L0 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </marker>
                </defs>
                <path
                  d="M420 220 C460 230 500 270 520 330"
                  strokeLinecap="round"
                  markerEnd="url(#cycle-arrow)"
                />
                <path
                  d="M420 220 C460 230 500 270 520 330"
                  transform="translate(70, 40) rotate(135 320 300)"
                  strokeLinecap="round"
                  markerEnd="url(#cycle-arrow)"
                />
                <path
                  d="M420 220 C460 230 500 270 520 330"
                  transform="translate(-170, 130) rotate(270 320 300)"
                  strokeLinecap="round"
                  markerEnd="url(#cycle-arrow)"
                />
              </svg>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <h2 className="text-2xl font-bold text-gray-900">
              はじめ方は3ステップ
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center"
                >
                  <p className="text-sm font-semibold text-emerald-600">
                    STEP {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-bold text-gray-900">画面イメージ</h2>
          <div className="mt-8 mx-auto grid gap-6 md:grid-cols-3">
            {screenshots.map((shot) => (
              <div
                key={shot.src}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={960}
                  height={600}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-50">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              今日から始める
            </h2>
            <p className="text-base text-gray-600">
              まずは小さな一歩から始める事が、何よりも大切です！
            </p>
            <Link
              href="/app"
              className="rounded-full bg-emerald-500 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              無料で使ってみる
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
