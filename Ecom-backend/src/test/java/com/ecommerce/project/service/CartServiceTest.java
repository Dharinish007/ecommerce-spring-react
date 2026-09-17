package com.ecommerce.project.service;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.exception.ResourceNotFoundException;
import com.ecommerce.project.model.*;
import com.ecommerce.project.payload.CartDTO;
import com.ecommerce.project.repositories.CartItemRepository;
import com.ecommerce.project.repositories.CartRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.util.AuthUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CartServiceTest {

    private CartRepository cartRepository;
    private ProductRepository productRepository;
    private CartItemRepository cartItemRepository;
    private AuthUtil authUtil;
    private CartServiceImpl cartService;

    private User testUser;
    private Product testProduct;
    private Cart testCart;

    @BeforeEach
    void setUp() {
        cartRepository = mock(CartRepository.class);
        productRepository = mock(ProductRepository.class);
        cartItemRepository = mock(CartItemRepository.class);
        authUtil = mock(AuthUtil.class);
        ModelMapper modelMapper = new ModelMapper();

        cartService = new CartServiceImpl(
                cartRepository,
                productRepository,
                cartItemRepository,
                modelMapper,
                authUtil
        );

        testUser = new User();
        testUser.setUserId(1L);
        testUser.setEmail("shopper@example.com");
        testUser.setUserName("shopper");
        Set<Role> roles = new HashSet<>();
        Role userRole = new Role(AppRole.ROLE_USER);
        roles.add(userRole);
        testUser.setRoles(roles);

        testProduct = new Product();
        testProduct.setProductId(100L);
        testProduct.setProductName("Noise Cancelling Headphones");
        testProduct.setPrice(BigDecimal.valueOf(150.00));
        testProduct.setSpecialPrice(BigDecimal.valueOf(120.00));
        testProduct.setDiscount(BigDecimal.valueOf(20.00));
        testProduct.setQuantity(10);

        testCart = new Cart();
        testCart.setCartId(10L);
        testCart.setUser(testUser);
        testCart.setTotalPrice(BigDecimal.ZERO);
        testCart.setCartItems(new ArrayList<>());

        when(authUtil.loggedInUser()).thenReturn(testUser);
        when(cartRepository.findCartByEmail("shopper@example.com")).thenReturn(testCart);
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testAddProductToCart_Success_NewItem() {
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(null);

        CartDTO result = cartService.addProductToCart(100L, 2);

        assertNotNull(result);
        assertEquals(1, testCart.getCartItems().size());
        assertEquals(2, testCart.getCartItems().get(0).getQuantity());
        assertEquals(BigDecimal.valueOf(240.00), testCart.getTotalPrice());
        verify(cartItemRepository).save(any(CartItem.class));
        verify(cartRepository).save(testCart);
    }

    @Test
    void testAddProductToCart_Success_ExistingItem_UpdatesQuantity() {
        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(testCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(2);
        existingItem.setProductPrice(BigDecimal.valueOf(120.00));
        testCart.getCartItems().add(existingItem);

        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(existingItem);

        CartDTO result = cartService.addProductToCart(100L, 3);

        assertNotNull(result);
        assertEquals(5, existingItem.getQuantity());
        assertEquals(BigDecimal.valueOf(600.00), testCart.getTotalPrice());
        verify(cartItemRepository).save(existingItem);
    }

    @Test
    void testAddProductToCart_ZeroOrNegativeQuantity_ThrowsAPIException() {
        APIException ex = assertThrows(APIException.class, () ->
                cartService.addProductToCart(100L, 0)
        );
        assertEquals("Quantity must be greater than zero", ex.getMessage());

        assertThrows(APIException.class, () ->
                cartService.addProductToCart(100L, -1)
        );
    }

    @Test
    void testAddProductToCart_OutOfStock_ThrowsAPIException() {
        testProduct.setQuantity(0);
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));

        APIException ex = assertThrows(APIException.class, () ->
                cartService.addProductToCart(100L, 1)
        );
        assertTrue(ex.getMessage().contains("out of stock"));
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void testAddProductToCart_QuantityExceedsAvailableStock_ThrowsAPIException() {
        testProduct.setQuantity(5);
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(null);

        APIException ex = assertThrows(APIException.class, () ->
                cartService.addProductToCart(100L, 6)
        );
        assertTrue(ex.getMessage().contains("exceeds available stock"));
    }

    @Test
    void testAddProductToCart_CumulativeQuantityExceedsStock_ThrowsAPIException() {
        testProduct.setQuantity(5);
        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(testCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(4);
        existingItem.setProductPrice(BigDecimal.valueOf(120.00));
        testCart.getCartItems().add(existingItem);

        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(existingItem);

        APIException ex = assertThrows(APIException.class, () ->
                cartService.addProductToCart(100L, 2)
        );
        assertTrue(ex.getMessage().contains("Only 5 available in stock"));
    }

    @Test
    void testAddProductToCart_ProductNotFound_ThrowsResourceNotFoundException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                cartService.addProductToCart(999L, 1)
        );
    }

    @Test
    void testUpdateProductQuantityInCart_IncrementWithinStock() {
        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(testCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(2);
        existingItem.setProductPrice(BigDecimal.valueOf(120.00));
        testCart.getCartItems().add(existingItem);

        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(existingItem);

        CartDTO result = cartService.updateProductQuantityInCart(100L, 1);

        assertNotNull(result);
        assertEquals(3, existingItem.getQuantity());
        assertEquals(BigDecimal.valueOf(360.00), testCart.getTotalPrice());
        verify(cartItemRepository).save(existingItem);
    }

    @Test
    void testUpdateProductQuantityInCart_ExceedsStock_ThrowsAPIException() {
        testProduct.setQuantity(5);
        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(testCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(5);
        existingItem.setProductPrice(BigDecimal.valueOf(120.00));
        testCart.getCartItems().add(existingItem);

        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(existingItem);

        APIException ex = assertThrows(APIException.class, () ->
                cartService.updateProductQuantityInCart(100L, 1)
        );
        assertTrue(ex.getMessage().contains("exceeds available stock"));
    }

    @Test
    void testUpdateProductQuantityInCart_DecrementToZero_RemovesItem() {
        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(testCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(1);
        existingItem.setProductPrice(BigDecimal.valueOf(120.00));
        testCart.getCartItems().add(existingItem);

        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(existingItem);

        CartDTO result = cartService.updateProductQuantityInCart(100L, -1);

        assertNotNull(result);
        assertFalse(testCart.getCartItems().contains(existingItem));
        assertEquals(BigDecimal.ZERO, testCart.getTotalPrice());
        verify(cartItemRepository).deleteCartItemByCartIdAndProductId(10L, 100L);
    }

    @Test
    void testUpdateProductQuantityInCart_ProductNotInCart_ThrowsAPIException() {
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(null);

        APIException ex = assertThrows(APIException.class, () ->
                cartService.updateProductQuantityInCart(100L, 1)
        );
        assertTrue(ex.getMessage().contains("is not in your cart"));
    }

    @Test
    void testDeleteProductFromCart_Success_Owner() {
        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(testCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(2);
        existingItem.setProductPrice(BigDecimal.valueOf(120.00));
        testCart.getCartItems().add(existingItem);
        testCart.setTotalPrice(BigDecimal.valueOf(240.00));

        when(cartRepository.findById(10L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(existingItem);

        String message = cartService.deleteProductFromCart(10L, 100L);

        assertTrue(message.contains("removed from cart successfully"));
        assertFalse(testCart.getCartItems().contains(existingItem));
        assertEquals(BigDecimal.ZERO, testCart.getTotalPrice());
        verify(cartItemRepository).deleteCartItemByCartIdAndProductId(10L, 100L);
        verify(cartRepository).save(testCart);
    }

    @Test
    void testDeleteProductFromCart_NonOwner_ThrowsAccessDeniedException() {
        User otherUser = new User();
        otherUser.setUserId(2L);
        otherUser.setEmail("other@example.com");

        Cart otherCart = new Cart();
        otherCart.setCartId(20L);
        otherCart.setUser(otherUser);

        when(cartRepository.findById(20L)).thenReturn(Optional.of(otherCart));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                cartService.deleteProductFromCart(20L, 100L)
        );
        assertEquals("You are not authorized to modify this cart", ex.getMessage());
        verify(cartItemRepository, never()).deleteCartItemByCartIdAndProductId(anyLong(), anyLong());
    }

    @Test
    void testDeleteProductFromCart_Admin_AllowedForOtherUserCart() {
        User adminUser = new User();
        adminUser.setUserId(99L);
        adminUser.setEmail("admin@example.com");
        Set<Role> adminRoles = new HashSet<>();
        adminRoles.add(new Role(AppRole.ROLE_ADMIN));
        adminUser.setRoles(adminRoles);
        when(authUtil.loggedInUser()).thenReturn(adminUser);

        User regularUser = new User();
        regularUser.setUserId(2L);

        Cart regularCart = new Cart();
        regularCart.setCartId(20L);
        regularCart.setUser(regularUser);

        CartItem existingItem = new CartItem();
        existingItem.setCartItemId(1L);
        existingItem.setCart(regularCart);
        existingItem.setProduct(testProduct);
        existingItem.setQuantity(1);
        regularCart.getCartItems().add(existingItem);

        when(cartRepository.findById(20L)).thenReturn(Optional.of(regularCart));
        when(cartItemRepository.findCartItemByProductIdAndCartId(20L, 100L)).thenReturn(existingItem);

        String message = cartService.deleteProductFromCart(20L, 100L);

        assertTrue(message.contains("removed from cart successfully"));
        verify(cartItemRepository).deleteCartItemByCartIdAndProductId(20L, 100L);
    }

    @Test
    void testDeleteProductFromCart_ItemNotFound_ThrowsResourceNotFoundException() {
        when(cartRepository.findById(10L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findCartItemByProductIdAndCartId(10L, 100L)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () ->
                cartService.deleteProductFromCart(10L, 100L)
        );
    }
}
