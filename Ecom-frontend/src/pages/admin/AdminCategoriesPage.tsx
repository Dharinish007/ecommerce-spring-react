import React, { useEffect, useState } from "react";
import categoriesApi from "@/api/categories.api";
import adminApi from "@/api/admin.api";
import { CategoryDTO, CategoryResponse } from "@/types/category.types";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Pagination from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { Plus, Edit2, Trash2 } from "lucide-react";

export const AdminCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [nameError, setNameError] = useState("");

  const loadCategories = async (page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getAllCategories({
        pageNumber: page,
        pageSize: 15,
        sortBy: "categoryId",
        sortOrder: "asc",
      });
      setCategoryData(data);
      setCurrentPage(page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load categories.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(0);
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setNameError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryDTO) => {
    setEditingCategory(cat);
    setCategoryName(cat.categoryName);
    setNameError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || categoryName.trim().length < 3) {
      setNameError("Category name must be between 3 and 50 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.categoryId, {
          categoryName: categoryName.trim(),
        });
        dispatch(addToast({ type: "success", message: "Category updated successfully!" }));
      } else {
        await adminApi.createCategory({ categoryName: categoryName.trim() });
        dispatch(addToast({ type: "success", message: "Category created successfully!" }));
      }
      setIsModalOpen(false);
      loadCategories(currentPage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save category.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: number, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete category "${name}"? Products attached might be affected.`
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteCategory(categoryId);
      dispatch(addToast({ type: "info", message: `Deleted category "${name}".` }));
      loadCategories(currentPage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category.";
      dispatch(addToast({ type: "error", message: msg }));
    }
  };

  const categories = categoryData?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Category Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize catalog products into structured department hierarchies
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Category
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadCategories(currentPage)} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Category Name</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.categoryId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-500">
                      #{c.categoryId}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                      {c.categoryName}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.categoryId, c.categoryName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categoryData && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                pageNumber={categoryData.pageNumber}
                totalPages={categoryData.totalPages}
                totalElements={categoryData.totalElements}
                onPageChange={(page) => loadCategories(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category Name" : "Create New Category"}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            required
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value);
              setNameError("");
            }}
            placeholder="e.g. Laptops &amp; Ultrabooks"
            error={nameError}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
