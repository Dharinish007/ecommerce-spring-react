package com.ecommerce.project.service;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.exception.ResourceNotFoundException;
import com.ecommerce.project.model.Cart;
import com.ecommerce.project.model.CartItem;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.CartDTO;
import com.ecommerce.project.payload.ProductDTO;
import com.ecommerce.project.repositories.CartItemRepository;
import com.ecommerce.project.repositories.CartRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.util.AuthUtil;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final ModelMapper modelMapper;
    private final AuthUtil authUtil;

    public CartServiceImpl(CartRepository cartRepository,
                           ProductRepository productRepository,
                           CartItemRepository cartItemRepository,
                           ModelMapper modelMapper,
                           AuthUtil authUtil) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.cartItemRepository = cartItemRepository;
        this.modelMapper = modelMapper;
        this.authUtil = authUtil;
    }

    private Cart findOrCreateUserCart(User user) {
        Cart cart = cartRepository.findCartByEmail(user.getEmail());
        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart.setTotalPrice(BigDecimal.ZERO);
            cart = cartRepository.save(cart);
        }
        return cart;
    }

    private CartDTO mapToCartDTO(Cart cart) {
        CartDTO cartDTO = new CartDTO();
        cartDTO.setCartId(cart.getCartId());
        cartDTO.setTotalPrice(cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO);

        List<ProductDTO> productDTOs = new ArrayList<>();
        if (cart.getCartItems() != null) {
            for (CartItem item : cart.getCartItems()) {
                ProductDTO productDTO = modelMapper.map(item.getProduct(), ProductDTO.class);
                productDTO.setQuantity(item.getQuantity()); // Item quantity in cart
                if (item.getProduct().getCategory() != null) {
                    productDTO.setCategoryId(item.getProduct().getCategory().getCategoryId());
                    productDTO.setCategoryName(item.getProduct().getCategory().getCategoryName());
                }
                productDTOs.add(productDTO);
            }
        }
        cartDTO.setProducts(productDTOs);
        return cartDTO;
    }

    private void recalculateCartTotal(Cart cart) {
        BigDecimal total = BigDecimal.ZERO;
        if (cart.getCartItems() != null) {
            for (CartItem item : cart.getCartItems()) {
                BigDecimal price = item.getProductPrice() != null ? item.getProductPrice() : BigDecimal.ZERO;
                BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
                total = total.add(itemTotal);
            }
        }
        cart.setTotalPrice(total);
    }

    @Override
    @Transactional
    public CartDTO addProductToCart(Long productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new APIException("Quantity must be greater than zero");
        }

        User user = authUtil.loggedInUser();
        Cart cart = findOrCreateUserCart(user);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        if (product.getQuantity() <= 0) {
            throw new APIException("Product '" + product.getProductName() + "' is out of stock");
        }

        CartItem existingCartItem = cartItemRepository.findCartItemByProductIdAndCartId(cart.getCartId(), productId);

        if (existingCartItem != null) {
            int newQuantity = existingCartItem.getQuantity() + quantity;
            if (newQuantity > product.getQuantity()) {
                throw new APIException("Cannot add " + quantity + " more. Only "
                        + product.getQuantity() + " available in stock (you already have " + existingCartItem.getQuantity() + " in cart).");
            }
            existingCartItem.setQuantity(newQuantity);
            existingCartItem.setProductPrice(product.getSpecialPrice() != null ? product.getSpecialPrice() : product.getPrice());
            existingCartItem.setDiscount(product.getDiscount());
            cartItemRepository.save(existingCartItem);
        } else {
            if (quantity > product.getQuantity()) {
                throw new APIException("Requested quantity (" + quantity + ") exceeds available stock (" + product.getQuantity() + ")");
            }
            CartItem newCartItem = new CartItem();
            newCartItem.setProduct(product);
            newCartItem.setCart(cart);
            newCartItem.setQuantity(quantity);
            newCartItem.setDiscount(product.getDiscount());
            newCartItem.setProductPrice(product.getSpecialPrice() != null ? product.getSpecialPrice() : product.getPrice());

            cartItemRepository.save(newCartItem);
            cart.getCartItems().add(newCartItem);
        }

        recalculateCartTotal(cart);
        Cart savedCart = cartRepository.save(cart);
        return mapToCartDTO(savedCart);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartDTO> getAllCarts() {
        List<Cart> carts = cartRepository.findAll();
        if (carts.isEmpty()) {
            return Collections.emptyList();
        }
        return carts.stream().map(this::mapToCartDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CartDTO getCart(String emailId, Long cartId) {
        Cart cart = cartRepository.findCartByEmailAndCartId(emailId, cartId);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart", "cartId", cartId);
        }
        return mapToCartDTO(cart);
    }

    @Override
    @Transactional
    public CartDTO getUserCart(String emailId) {
        User user = authUtil.loggedInUser();
        Cart cart = findOrCreateUserCart(user);
        recalculateCartTotal(cart);
        return mapToCartDTO(cart);
    }

    @Override
    @Transactional
    public CartDTO updateProductQuantityInCart(Long productId, Integer quantity) {
        User user = authUtil.loggedInUser();
        Cart cart = findOrCreateUserCart(user);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cart.getCartId(), productId);
        if (cartItem == null) {
            throw new APIException("Product '" + product.getProductName() + "' is not in your cart");
        }

        int newQuantity = cartItem.getQuantity() + quantity;

        if (newQuantity <= 0) {
            cart.getCartItems().remove(cartItem);
            cartItemRepository.deleteCartItemByCartIdAndProductId(cart.getCartId(), productId);
        } else {
            if (newQuantity > product.getQuantity()) {
                throw new APIException("Requested quantity (" + newQuantity + ") exceeds available stock (" + product.getQuantity() + ")");
            }
            cartItem.setQuantity(newQuantity);
            cartItem.setProductPrice(product.getSpecialPrice() != null ? product.getSpecialPrice() : product.getPrice());
            cartItemRepository.save(cartItem);
        }

        recalculateCartTotal(cart);
        Cart savedCart = cartRepository.save(cart);
        return mapToCartDTO(savedCart);
    }

    @Override
    @Transactional
    public String deleteProductFromCart(Long cartId, Long productId) {
        User user = authUtil.loggedInUser();
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));

        // Ownership check to prevent IDOR
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().name().equals("ROLE_ADMIN"));
        if (!isAdmin && (cart.getUser() == null || !cart.getUser().getUserId().equals(user.getUserId()))) {
            throw new AccessDeniedException("You are not authorized to modify this cart");
        }

        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cartId, productId);
        if (cartItem == null) {
            throw new ResourceNotFoundException("Product", "productId", productId);
        }

        cart.getCartItems().remove(cartItem);
        cartItemRepository.deleteCartItemByCartIdAndProductId(cartId, productId);

        recalculateCartTotal(cart);
        cartRepository.save(cart);

        return "Product '" + cartItem.getProduct().getProductName() + "' removed from cart successfully";
    }

    @Override
    @Transactional
    public void updateProductInCarts(Long cartId, Long productId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));
        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cartId, productId);
        if (cartItem != null) {
            cartItem.setProductPrice(product.getSpecialPrice() != null ? product.getSpecialPrice() : product.getPrice());
            cartItem.setDiscount(product.getDiscount());
            cartItemRepository.save(cartItem);
            recalculateCartTotal(cart);
            cartRepository.save(cart);
        }
    }
}
