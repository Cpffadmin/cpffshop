"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface EditCategoryDialogProps {
  mode: "create" | "edit";
  category?: Category;
  onSave: (data: Partial<Category>) => void;
}

export function EditCategoryDialog({
  mode,
  category,
  onSave,
}: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>(
    category || {
      name: "",
      description: "",
    }
  );

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      if (mode === "create") {
        const response = await axios.post("/api/admin/categories", formData);
        onSave(response.data.category);
      } else {
        await onSave(formData);
      }
      setOpen(false);
      setFormData({ name: "", description: "" });
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={mode === "create" ? "default" : "ghost"}
        size={mode === "create" ? "default" : "icon"}
      >
        {mode === "create" ? (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </>
        ) : (
          <Pencil className="w-4 h-4" />
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create Category" : "Edit Category"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a new category to your catalog"
                : "Edit category details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Category description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Create Category"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
