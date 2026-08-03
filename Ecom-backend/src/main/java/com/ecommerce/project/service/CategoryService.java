package com.ecommerce.project.service;

import com.ecommerce.project.payload.CategoryDTO;
import com.ecommerce.project.payload.CategoryResponse;

public interface CategoryService {

    public CategoryResponse getAllCategories(Integer pageNumber, Integer pageSize,String sortBy,String sortOrder);

    public CategoryDTO createCategory(CategoryDTO categoryDTO);

    public CategoryDTO deleteCategory(Long categoryId);

    public CategoryDTO updateCategory(CategoryDTO categoryDTO,Long categoryId);
}
