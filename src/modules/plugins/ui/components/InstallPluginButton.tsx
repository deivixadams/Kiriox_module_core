"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import styles from "../pages/PluginsDashboardPage.module.css";

export function InstallPluginButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFileChange(file: File | null) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setFeedback(null);

    const response = await fetch("/api/plugins/install", {
      method: "POST",
      body: formData,
    });

    const body = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      setFeedback(body.error ?? "No se pudo instalar el plugin.");
      return;
    }

    setFeedback(body.message ?? "Plugin instalado correctamente.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className={styles.installGroup}>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className={styles.hiddenFileInput}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void handleFileChange(file);
          event.target.value = "";
        }}
      />
      <button
        className={styles.installButton}
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={18} />}
        Instalar plugin
      </button>
      {feedback ? <p className={styles.installFeedback}>{feedback}</p> : null}
    </div>
  );
}
