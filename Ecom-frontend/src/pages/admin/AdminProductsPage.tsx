import React, { useEffect, useState } from "react";
import productsApi from "@/api/products.api";
import categoriesApi from "@/api/categories.api";
import adminApi from "@/api/admin.api";
import { extractErrorMessage } from "@/api/client";
import { ProductDTO, ProductResponse } from "@/types/product.types";
import { CategoryDTO } from "@/types/category.types";
import { formatPrice, formatDiscount } from "@/utils/formatters";
import { resolveProductImageUrl, handleImageError } from "@/utils/imageUtils";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Pagination from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";

export const AdminProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [productData, setProductData] = useState<ProductResponse | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected product
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    productName: string;
    description: string;
    price: string;
    discount: string;
    quantity: string;
    categoryId: string;
  }>({
    productName: "",
    description: "",
    price: "",
    discount: "0",
    quantity: "10",
    categoryId: "",
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadProducts = async (page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAllProducts({
        pageNumber: page,
        pageSize: 15,
        sortBy: "productId",
        sortOrder: "desc",
      });
      setProductData(data);
      setCurrentPage(page);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to load products.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(0);
    categoriesApi
      .getAllCategories({ pageSize: 100 })
      .then((res) => {
        setCategories(res.content || []);
        if (res.content?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            categoryId: res.content[0].categoryId.toString(),
          }));
        }
      })
      .catch(() => setCategories([]));
  }, []);

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.productName.trim() || formData.productName.length < 3) {
      errs.productName = "Product name must be at least 3 characters";
    }
    if (!formData.description.trim() || formData.description.length < 6) {
      errs.description = "Description must be at least 6 characters";
    }
    const numPrice = parseFloat(formData.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      errs.price = "Price must be greater than 0";
    }
    const numQty = parseInt(formData.quantity, 10);
    if (isNaN(numQty) || numQty < 0) {
      errs.quantity = "Quantity cannot be negative";
    }
    if (!formData.categoryId) {
      errs.categoryId = "Please select a category";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setFormData({
      productName: "",
      description: "",
      price: "",
      discount: "0",
      quantity: "10",
      categoryId: categories[0]?.categoryId.toString() || "",
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (product: ProductDTO) => {
    setSelectedProduct(product);
    setFormData({
      productName: product.productName,
      description: product.description,
      price: product.price.toString(),
      discount: product.discount.toString(),
      quantity: product.quantity.toString(),
      categoryId: product.categoryId?.toString() || categories[0]?.categoryId.toString() || "",
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenImageUpload = (product: ProductDTO) => {
    setSelectedProduct(product);
    setSelectedImageFile(null);
    setIsImageModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const categoryId = parseInt(formData.categoryId, 10);
      const payload: Partial<ProductDTO> = {
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount || "0"),
        quantity: parseInt(formData.quantity, 10),
      };

      await adminApi.createProduct(categoryId, payload);
      dispatch(addToast({ type: "success", message: "Product created successfully!" }));
      setIsCreateModalOpen(false);
      loadProducts(0);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to create product.");
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<ProductDTO> = {
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount || "0"),
        quantity: parseInt(formData.quantity, 10),
        categoryId: parseInt(formData.categoryId, 10),
      };

      await adminApi.updateProduct(selectedProduct.productId, payload);
      dispatch(addToast({ type: "success", message: "Product updated successfully!" }));
      setIsEditModalOpen(false);
      loadProducts(currentPage);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to update product.");
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedImageFile) return;

    setIsSubmitting(true);
    try {
      await adminApi.uploadProductImage(selectedProduct.productId, selectedImageFile);
      dispatch(addToast({ type: "success", message: "Product image uploaded successfully!" }));
      setIsImageModalOpen(false);
      loadProducts(currentPage);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to upload product image.");
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action is permanent.`)) {
      return;
    }

    try {
      await adminApi.deleteProduct(productId);
      dispatch(addToast({ type: "info", message: `Deleted product "${name}".` }));
      loadProducts(currentPage);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to delete product.");
      dispatch(addToast({ type: "error", message: msg }));
    }
  };

  const products = productData?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Product Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add new inventory, update stock levels, adjust prices, and upload assets
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Product
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadProducts(currentPage)} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Stock</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Discount</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const imageUrl = resolveProductImageUrl(p.image);
                  return (
                    <tr key={p.productId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Img */}
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={p.productName}
                            onError={handleImageError}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs">
                            {p.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: #{p.productId}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {p.categoryName || "Uncategorized"}
                      </td>

                      {/* Quantity / Stock */}
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.quantity > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.quantity} in stock
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatPrice(p.price)}
                      </td>

                      {/* Discount */}
                      <td className="py-4 px-6">
                        {p.discount > 0 ? (
                          <span className="text-red-600 font-bold">{formatDiscount(p.discount)}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenImageUpload(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Upload Image"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.productId, p.productName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {productData && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                pageNumber={productData.pageNumber}
                totalPages={productData.totalPages}
                totalElements={productData.totalElements}
                onPageChange={(page) => loadProducts(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Catalog Product"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Name"
            required
            value={formData.productName}
            onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
            placeholder="e.g. Apple MacBook Pro M3"
            error={formErrors.productName}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Price (₹)"
              required
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="49999"
              error={formErrors.price}
            />
            <Input
              label="Discount (%)"
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Quantity"
              required
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              placeholder="10"
              error={formErrors.quantity}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed product specifications and features..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
            {formErrors.description && (
              <p className="text-xs text-red-600 font-medium">{formErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Product #${selectedProduct?.productId}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <Input
            label="Product Name"
            required
            value={formData.productName}
            onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
            error={formErrors.productName}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Price (₹)"
              required
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              error={formErrors.price}
            />
            <Input
              label="Discount (%)"
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
            />
            <Input
              label="Quantity"
              required
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              error={formErrors.quantity}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
            {formErrors.description && (
              <p className="text-xs text-red-600 font-medium">{formErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`Upload Image for "${selectedProduct?.productName}"`}
        maxWidth="md"
      >
        <form onSubmit={handleUploadImage} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select an image file (.jpg, .jpeg, .png, .webp) up to 5 MB to upload directly to
            the backend media server.
          </p>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            required
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedImageFile(e.target.files[0]);
              }
            }}
            className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!selectedImageFile}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;
