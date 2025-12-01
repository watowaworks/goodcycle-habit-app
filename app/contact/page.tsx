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
        title="グッドサイクル♾️"
        navLinks={[
          { label: "ホーム", href: "/" },
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "お問い合わせ", href: "/contact" },
        ]}
      />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            お問い合わせ
          </h2>
          <p className="text-gray-600">
            ご質問やご意見がございましたら、お気軽にお問い合わせください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* お名前 */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* メールアドレス */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* 件名 */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              件名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                errors.subject
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder="お問い合わせの件名"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
            )}
          </div>

          {/* メッセージ */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              メッセージ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none ${
                errors.message
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder="お問い合わせ内容をご記入ください"
            />
            <div className="mt-1 flex justify-between items-start">
              {errors.message ? (
                <p className="text-sm text-red-500">{errors.message}</p>
              ) : (
                <div></div>
              )}
              <p className="text-xs text-gray-500">
                {formData.message.length} / 1000文字
              </p>
            </div>
          </div>

          {/* 送信成功/エラーメッセージ */}
          {submitStatus.type && (
            <div
              className={`p-4 rounded-lg ${
                submitStatus.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
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
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {isSubmitting ? "送信中..." : "送信する"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
