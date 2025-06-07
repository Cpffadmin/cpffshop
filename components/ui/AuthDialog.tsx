import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language/LanguageContext";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthDialog = ({ isOpen, onClose }: AuthDialogProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogin = () => {
    router.push("/login");
    onClose();
  };

  const handleSignup = () => {
    router.push("/signup");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {t("auth.loginRequired")}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
            {t("auth.loginToAddToCart")}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleLogin} className="w-full">
              {t("auth.login")}
            </Button>
            <Button onClick={handleSignup} variant="outline" className="w-full">
              {t("auth.createAccount")}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
