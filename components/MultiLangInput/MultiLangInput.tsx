import React from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Language } from "@/types/language";

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface MultiLangInputProps {
  label?: string;
  value?: Partial<MultiLangValue>;
  onChange: (value: MultiLangValue) => void;
  placeholder?: MultiLangValue;
  type?: "text" | "textarea";
  required?: boolean;
}

export function MultiLangInput({
  label,
  value = { en: "", "zh-TW": "" },
  onChange,
  placeholder = {
    en: "Enter English text",
    "zh-TW": "輸入中文文字",
  },
  type = "text",
  required = false,
}: MultiLangInputProps) {
  const safeValue: MultiLangValue = {
    en: value?.en || "",
    "zh-TW": value?.["zh-TW"] || "",
  };

  const handleChange = (lang: keyof MultiLangValue, newValue: string) => {
    onChange({
      ...safeValue,
      [lang]: newValue,
    });
  };

  const InputComponent = type === "textarea" ? Textarea : Input;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">English</label>
        <InputComponent
          value={safeValue.en}
          onChange={(e) => handleChange("en", e.target.value)}
          placeholder={placeholder.en}
          required={required}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">中文</label>
        <InputComponent
          value={safeValue["zh-TW"]}
          onChange={(e) => handleChange("zh-TW", e.target.value)}
          placeholder={placeholder["zh-TW"]}
          required={required}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}

export interface MultiLangDisplayProps {
  value?: MultiLangValue;
  currentLang: Language;
  variables?: Record<string, string>;
}

export const MultiLangDisplay: React.FC<MultiLangDisplayProps> = ({
  value,
  currentLang,
  variables,
}) => {
  if (!value) return null;

  let text = value[currentLang] || value.en || "";

  if (variables) {
    Object.entries(variables).forEach(([key, val]) => {
      text = text.replace(new RegExp(`{{${key}}}`, "g"), val);
    });
  }

  return <>{text}</>;
};
