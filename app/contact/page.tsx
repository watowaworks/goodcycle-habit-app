"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import Header from "@/components/Header";

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // バリデーション関数
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // お名前のバリデーション
    if (!formData.name.trim()) {
      newErrors.name = "お名前を入力してください";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "お名前は2文字以上で入力してください";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "お名前は50文字以内で入力してください";
    }

    // メールアドレスのバリデーション
    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスを入力してください";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "正しいメールアドレスを入力してください";
      }
    }

    // 件名のバリデーション
    if (!formData.subject.trim()) {
      newErrors.subject = "件名を入力してください";
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = "件名は3文字以上で入力してください";
    } else if (formData.subject.trim().length > 100) {
      newErrors.subject = "件名は100文字以内で入力してください";
    }

    // メッセージのバリデーション
    if (!formData.message.trim()) {
      newErrors.message = "メッセージを入力してください";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "メッセージは10文字以上で入力してください";
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = "メッセージは1000文字以内で入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 入力中にエラーをクリア（そのフィールドが既に触れられている場合のみ）
    if (touched[name] && errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // そのフィールドのバリデーションを実行
    const fieldErrors: FormErrors = {};
    const value = formData[name as keyof typeof formData];

    if (name === "name") {
      if (!value.trim()) {
        fieldErrors.name = "お名前を入力してください";
      } else if (value.trim().length < 2) {
        fieldErrors.name = "お名前は2文字以上で入力してください";
      } else if (value.trim().length > 50) {
        fieldErrors.name = "お名前は50文字以内で入力してください";
      }
    } else if (name === "email") {
      if (!value.trim()) {
        fieldErrors.email = "メールアドレスを入力してください";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          fieldErrors.email = "正しいメールアドレスを入力してください";
        }
      }
    } else if (name === "subject") {
      if (!value.trim()) {
        fieldErrors.subject = "件名を入力してください";
      } else if (value.trim().length < 3) {
        fieldErrors.subject = "件名は3文字以上で入力してください";
      } else if (value.trim().length > 100) {
        fieldErrors.subject = "件名は100文字以内で入力してください";
      }
    } else if (name === "message") {
      if (!value.trim()) {
        fieldErrors.message = "メッセージを入力してください";
      } else if (value.trim().length < 10) {
        fieldErrors.message = "メッセージは10文字以上で入力してください";
      } else if (value.trim().length > 1000) {
        fieldErrors.message = "メッセージは1000文字以内で入力してください";
      }
    }

    setErrors((prev) => ({
      ...prev,
      ...fieldErrors,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 全フィールドを「触れた」状態にする
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
    });

    // バリデーション実行
    if (!validate()) {
      // バリデーション失敗
      return;
    }

    // バリデーション成功 → EmailJSで送信
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // EmailJSの設定（環境変数から取得）
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

      if (!serviceId || !templateId || !publicKey) {
        throw new Error(
          "EmailJSの設定が完了していません。環境変数を確認してください。"
        );
      }

      // EmailJSに送信
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          reply_to: formData.email,
        },
        publicKey
      );

      // 送信成功
      setSubmitStatus({
        type: "success",
        message: "お問い合わせを送信しました。ありがとうございます！",
      });

      // フォームをリセット
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setTouched({});
      setErrors({});
    } catch (error) {
      // 送信失敗
      console.error("EmailJS送信エラー:", error);
      setSubmitStatus({
        type: "error",
        message: "送信に失敗しました。しばらく時間をおいて再度お試しください。",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="GoodCycle"
        navLinks={[
          { label: "ホーム", href: "/" },
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "ガーデン", href: "/garden" },
          { label: "お問い合わせ", href: "/contact" },
        ]}
      />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            お問い合わせ
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            ご質問やご意見がございましたら、お気軽にお問い合わせください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* お名前 */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              お名前 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none ${
                errors.name
                  ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* メールアドレス */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              メールアドレス <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none ${
                errors.email
                  ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* 件名 */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              件名 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none ${
                errors.subject
                  ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="お問い合わせの件名"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.subject}</p>
            )}
          </div>

          {/* メッセージ */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              メッセージ <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none resize-none ${
                errors.message
                  ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="お問い合わせ内容をご記入ください"
            />
            <div className="mt-1 flex justify-between items-start">
              {errors.message ? (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.message}</p>
              ) : (
                <div></div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.message.length} / 1000文字
              </p>
            </div>
          </div>

          {/* 送信成功/エラーメッセージ */}
          {submitStatus.type && (
            <div
              className={`p-4 rounded-lg ${
                submitStatus.type === "success"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              <p className="text-sm font-medium">{submitStatus.message}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? "bg-gray-400 dark:bg-gray-600 text-gray-800 dark:text-gray-100 cursor-not-allowed"
                  : "bg-emerald-500 dark:bg-emerald-600 text-gray-800 dark:text-gray-100 hover:bg-emerald-600 dark:hover:bg-emerald-700"
              }`}
            >
              {isSubmitting ? "送信中..." : "送信する"}
            </button>
          </div>
        </form>

        <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm dark:shadow-gray-900/50 backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.17l8 4.8 8-4.8V6H4Zm16 2.83-7.53 4.52a2 2 0 0 1-1.94 0L3 8.83V18h17Z"
                />
              </svg>
            </span>
            <span>その他の連絡方法</span>
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            フォーム以外からのご連絡は、以下のアカウントからも受け付けています。
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Gmail */}
            <a
              href="mailto:watosonworks@gmail.com"
              className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-linear-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 px-4 py-3 transition hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-sm dark:hover:shadow-gray-900/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M20 4H4a2 2 0 0 0-2 2v12.01A2 2 0 0 0 4 20h16a2 2 0 0 0 2-2.01V6a2 2 0 0 0-2-2Zm0 4.03-7.11 4.45a1.25 1.25 0 0 1-1.28 0L4 8.03V6.25L12 11l8-4.75Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Gmail
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 break-all">
                  watosonworks@gmail.com
                </span>
              </div>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/watowaworks"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-linear-to-r from-slate-50 to-white dark:from-slate-900/20 dark:to-gray-800 px-4 py-3 transition hover:-translate-y-0.5 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm dark:hover:shadow-gray-900/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-white shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34a2.65 2.65 0 0 0-1.1-1.46c-.9-.62.07-.6.07-.6a2.1 2.1 0 0 1 1.54 1.04 2.14 2.14 0 0 0 2.92.84 2.15 2.15 0 0 1 .64-1.35c-2.22-.25-4.55-1.11-4.55-4.94A3.87 3.87 0 0 1 6.3 7.5a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.37.84.41 1.8.12 2.67a3.87 3.87 0 0 1 1.03 2.68c0 3.84-2.34 4.68-4.57 4.93a2.4 2.4 0 0 1 .69 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-700 dark:text-slate-400">
                  GitHub
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-slate-200 break-all">
                  github.com/watowaworks
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
